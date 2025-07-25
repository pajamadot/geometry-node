import { JsonNodeDefinition } from '../types/jsonNodes';
import { 
  AIRequest, 
  CreateNodeRequest, 
  PlanSceneRequest, 
  ComposeSceneRequest, 
  DiffSceneRequest,
  GenerateSceneRequest,
  ValidationResult 
} from './types';
import { 
  buildCatalog, 
  buildNodeExamples, 
  buildScenePresets, 
  buildPromptForTask 
} from './contextBuilders';
import { validateNodeCode, validateSceneJSON, validateAIRequest } from './validators';
import { createStreamingSession, getAvailableModels } from './aiClient';
import { 
  StandardResponse, 
  createSuccessResponse, 
  createErrorResponse, 
  createError, 
  ErrorType, 
  handleError,
  validationToResponse 
} from './errorHandler';

/**
 * Main AI Agent class for systematic geometry node operations
 */
export class GeometryAIAgent {
  private model: string;

  constructor(model: string = 'anthropic/claude-3.5-sonnet') {
    this.model = model;
  }

  /**
   * Execute a specific AI task with comprehensive validation and error handling
   */
  async executeTask(request: AIRequest, modelName?: string): Promise<StandardResponse<string>> {
    // Validate the request
    const validation = validateAIRequest(request);
    if (!validation.success) {
      return validationToResponse<string>(validation, undefined, 'executeTask');
    }

    try {
      switch (request.task) {
        case 'create_node':
          return await this.createNodeWithErrorHandling(request as CreateNodeRequest, modelName);
        case 'plan_scene':
          return await this.planSceneWithErrorHandling(request as PlanSceneRequest, modelName);
        case 'compose_scene':
          return await this.composeSceneWithErrorHandling(request as ComposeSceneRequest, modelName);
        case 'diff_scene':
          return await this.diffSceneWithErrorHandling(request as DiffSceneRequest, modelName);
        case 'generate_scene':
          return await this.generateSceneWithErrorHandling(request as GenerateSceneRequest, modelName);
        default:
          const error = createError(
            ErrorType.VALIDATION_ERROR,
            `Unknown task type: ${(request as any).task}`,
            request,
            'executeTask'
          );
          return createErrorResponse(error);
      }
    } catch (error) {
      const standardError = handleError(error, 'executeTask');
      return createErrorResponse(standardError);
    }
  }

  /**
   * Stream a specific AI task for real-time feedback with error handling
   */
  async *streamTask(request: AIRequest, modelName?: string): AsyncGenerator<string> {
    // Validate the request
    const validation = validateAIRequest(request);
    if (!validation.success) {
      yield `Validation Error: ${validation.errors.join(', ')}`;
      return;
    }

    try {
      const prompt = buildPromptForTask(request);
      const result = await createStreamingSession(prompt, modelName || this.model);

      for await (const chunk of result.textStream) {
        yield chunk;
      }
    } catch (error) {
      const standardError = handleError(error, 'streamTask');
      yield `Error: ${standardError.message}`;
    }
  }

  /**
   * Create a new node with comprehensive error handling
   */
  private async createNodeWithErrorHandling(request: CreateNodeRequest, modelName?: string): Promise<StandardResponse<string>> {
    try {
      const nodeExamples = buildNodeExamples();
      
      let prompt = `TASK: "create_node"
BEHAVIOR: "${request.behavior}"

NODE_EXAMPLES:
${nodeExamples}`;

      if (request.validator_report) {
        prompt += `\n\nVALIDATOR_REPORT:
${request.validator_report}`;
      }

      const result = await createStreamingSession(prompt, modelName || this.model);
      
      // Collect full response from stream
      let fullResponse = '';
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
      }
      
      // Return the generated JSON response
      return createSuccessResponse(fullResponse);
    } catch (error) {
      const standardError = handleError(error, 'createNode');
      return createErrorResponse(standardError);
    }
  }

  /**
   * Plan a scene with comprehensive error handling
   */
  private async planSceneWithErrorHandling(request: PlanSceneRequest, modelName?: string): Promise<StandardResponse<string>> {
    try {
      const catalog = buildCatalog();
      
      const prompt = `TASK: "plan_scene"
SCENE_IDEA: "${request.scene_idea}"

CATALOG:
${catalog}`;

      const result = await createStreamingSession(prompt, modelName || this.model);
      
      // Collect full response from stream
      let fullResponse = '';
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
      }
      
      return createSuccessResponse(fullResponse);
    } catch (error) {
      const standardError = handleError(error, 'planScene');
      return createErrorResponse(standardError);
    }
  }

  /**
   * Compose a scene with comprehensive error handling
   */
  private async composeSceneWithErrorHandling(request: ComposeSceneRequest, modelName?: string): Promise<StandardResponse<string>> {
    try {
      const scenePresets = buildScenePresets();
      
      const prompt = `TASK: "compose_scene"
SELECTED_NODE_IDS: ${JSON.stringify(request.selected_node_ids)}

SCENE_PRESETS:
${scenePresets}`;

      const result = await createStreamingSession(prompt, modelName || this.model);
      
      // Collect full response from stream
      let fullResponse = '';
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
      }
      
      // Try to validate the generated scene JSON
      try {
        const sceneJSON = JSON.parse(fullResponse);
        const sceneValidation = validateSceneJSON(sceneJSON);
        
        if (!sceneValidation.success) {
          const error = createError(
            ErrorType.VALIDATION_ERROR,
            `Generated scene validation failed: ${sceneValidation.errors.join(', ')}`,
            { generatedScene: fullResponse, validation: sceneValidation },
            'composeScene'
          );
          return createErrorResponse(error);
        }
        
        return createSuccessResponse(fullResponse, sceneValidation.warnings);
      } catch (parseError) {
        const error = createError(
          ErrorType.PARSING_ERROR,
          'Generated scene is not valid JSON',
          { generatedScene: fullResponse, parseError },
          'composeScene'
        );
        return createErrorResponse(error);
      }
    } catch (error) {
      const standardError = handleError(error, 'composeScene');
      return createErrorResponse(standardError);
    }
  }

  /**
   * Create a diff of scene changes with comprehensive error handling
   */
  private async diffSceneWithErrorHandling(request: DiffSceneRequest, modelName?: string): Promise<StandardResponse<string>> {
    try {
      const prompt = `TASK: "diff_scene"
OLD_SCENE_JSON: ${JSON.stringify(request.old_scene_json, null, 2)}
CHANGE_REQUEST: "${request.change_request}"`;

      const result = await createStreamingSession(prompt, modelName || this.model);
      
      // Collect full response from stream
      let fullResponse = '';
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
      }
      
      return createSuccessResponse(fullResponse);
    } catch (error) {
      const standardError = handleError(error, 'diffScene');
      return createErrorResponse(standardError);
    }
  }

  /**
   * Generate a complete scene with comprehensive error handling and validation
   */
  private async generateSceneWithErrorHandling(request: GenerateSceneRequest, modelName?: string): Promise<StandardResponse<string>> {
    try {
      const prompt = buildPromptForTask(request);
      
      const result = await createStreamingSession(prompt, modelName || this.model);
      
      // Collect full response from stream
      let fullResponse = '';
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
      }
      
      // Clean up the response - remove any markdown formatting
      const cleanedResponse = this.cleanJsonResponse(fullResponse);
      
      // Try to validate the generated scene JSON
      try {
        const sceneJSON = JSON.parse(cleanedResponse);
        const sceneValidation = validateSceneJSON(sceneJSON);
        
        if (!sceneValidation.success) {
          // Try to fix common validation issues
          const fixedScene = this.attemptSceneFix(sceneJSON, sceneValidation.errors);
          
          if (fixedScene) {
            const revalidation = validateSceneJSON(fixedScene);
            if (revalidation.success) {
              return createSuccessResponse(JSON.stringify(fixedScene), revalidation.warnings);
            }
          }
          
          const error = createError(
            ErrorType.VALIDATION_ERROR,
            `Generated scene validation failed: ${sceneValidation.errors.join(', ')}`,
            { generatedScene: cleanedResponse, validation: sceneValidation },
            'generateScene'
          );
          return createErrorResponse(error);
        }
        
        return createSuccessResponse(cleanedResponse, sceneValidation.warnings);
      } catch (parseError) {
        // Try to extract JSON from response if it's embedded in other text
        const extractedJson = this.extractJsonFromResponse(fullResponse);
        if (extractedJson) {
          try {
            const sceneJSON = JSON.parse(extractedJson);
            const sceneValidation = validateSceneJSON(sceneJSON);
            
            if (sceneValidation.success) {
              return createSuccessResponse(extractedJson, sceneValidation.warnings);
            }
          } catch (secondParseError) {
            // Continue to error below
          }
        }
        
        const error = createError(
          ErrorType.PARSING_ERROR,
          'Generated scene is not valid JSON',
          { generatedScene: fullResponse, parseError },
          'generateScene'
        );
        return createErrorResponse(error);
      }
    } catch (error) {
      const standardError = handleError(error, 'generateScene');
      return createErrorResponse(standardError);
    }
  }

  /**
   * Clean JSON response by removing markdown formatting and extra text
   */
  private cleanJsonResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to find JSON object boundaries
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    
    return cleaned.trim();
  }

  /**
   * Extract JSON from response that might contain other text
   */
  private extractJsonFromResponse(response: string): string | null {
    try {
      // Look for JSON object boundaries
      const patterns = [
        /\{[\s\S]*\}/,  // Basic object pattern
        /\{[\s\S]*?"edges"[\s\S]*?\}/, // Look for scene structure
        /\{[\s\S]*?"nodes"[\s\S]*?\}/  // Look for nodes array
      ];
      
      for (const pattern of patterns) {
        const match = response.match(pattern);
        if (match) {
          return match[0];
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Attempt to fix common scene validation issues
   */
  private attemptSceneFix(scene: any, errors: string[]): any | null {
    try {
      const fixedScene = JSON.parse(JSON.stringify(scene)); // Deep clone
      
      // Fix missing nodes array
      if (!fixedScene.nodes || !Array.isArray(fixedScene.nodes)) {
        fixedScene.nodes = [];
      }
      
      // Fix missing edges array
      if (!fixedScene.edges || !Array.isArray(fixedScene.edges)) {
        fixedScene.edges = [];
      }
      
      // Fix node structure issues
      fixedScene.nodes.forEach((node: any, index: number) => {
        if (!node.id) node.id = `node-${index}`;
        if (!node.type) node.type = 'cube'; // Default fallback
        if (!node.position) node.position = { x: 100 + index * 300, y: 100 };
        if (!node.data) {
          node.data = {
            id: node.id,
            type: node.type,
            label: node.type.charAt(0).toUpperCase() + node.type.slice(1),
            parameters: {},
            inputConnections: {},
            liveParameterValues: {}
          };
        }
        
        // Ensure data object has required fields
        if (!node.data.id) node.data.id = node.id;
        if (!node.data.type) node.data.type = node.type;
        if (!node.data.label) node.data.label = node.type;
        if (!node.data.parameters) node.data.parameters = {};
        if (!node.data.inputConnections) node.data.inputConnections = {};
        if (!node.data.liveParameterValues) node.data.liveParameterValues = {};
      });
      
      // Fix edge structure issues
      fixedScene.edges.forEach((edge: any, index: number) => {
        if (!edge.id) edge.id = `edge-${index}`;
        if (!edge.sourceHandle) edge.sourceHandle = 'geometry-out';
        if (!edge.targetHandle) edge.targetHandle = 'geometry-in';
      });
      
      return fixedScene;
    } catch (error) {
      return null;
    }
  }

  /**
   * Stream a single-step scene generation task
   */
  async *streamGenerateScene(request: GenerateSceneRequest, modelName?: string): AsyncGenerator<string> {
    const prompt = buildPromptForTask(request);
    
    const result = await createStreamingSession(prompt, modelName || this.model);
    
    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }

  /**
   * Stream node generation with real-time feedback
   */
  async *streamNodeGeneration(prompt: string, modelName?: string): AsyncGenerator<string> {
    const request: CreateNodeRequest = {
      task: 'create_node',
      behavior: prompt
    };

    for await (const chunk of this.streamTask(request, modelName)) {
      yield chunk;
    }
  }

  /**
   * Stream scene generation with real-time feedback
   */
  async *streamSceneGeneration(prompt: string, modelName?: string): AsyncGenerator<string> {
    const request: PlanSceneRequest = {
      task: 'plan_scene',
      scene_idea: prompt
    };

    for await (const chunk of this.streamTask(request, modelName)) {
      yield chunk;
    }
  }

  /**
   * Legacy method: Generate node with streaming feedback
   */
  async *generateNode(prompt: string, modelName?: string): AsyncGenerator<string, JsonNodeDefinition | null> {
    const request: CreateNodeRequest = {
      task: 'create_node',
      behavior: prompt
    };

    try {
      let fullResponse = '';
      
      // Stream the generation process
      for await (const chunk of this.streamTask(request, modelName)) {
        fullResponse += chunk;
        yield chunk;
      }
      
      yield 'Processing generated JSON...';
      
      // Try to extract and parse the JSON node definition
      const nodeDefinition = this.parseJsonNodeDefinition(fullResponse);
      
      if (nodeDefinition) {
        yield 'Successfully parsed JSON node definition';
        return nodeDefinition;
      } else {
        yield 'Warning: Could not parse JSON response to valid node format';
        return null;
      }
    } catch (error) {
      yield `Error: ${error}`;
      return null;
    }
  }

  /**
   * Parse JSON response to extract JsonNodeDefinition (public method)
   */
  public parseJsonNodeDefinition(jsonResponse: string): JsonNodeDefinition | null {
    try {
      console.log('🔍 Parsing JSON response length:', jsonResponse.length);
      
      // Clean the response to extract just the JSON object
      let cleanedResponse = jsonResponse.trim();
      
      // Remove markdown code blocks if present
      cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
      cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
      
      // Find JSON object boundaries
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        console.error('❌ No JSON object found in response');
        console.log('Response preview:', cleanedResponse.substring(0, 200) + '...');
        return null;
      }
      
      const jsonStr = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      console.log('📝 Extracted JSON string length:', jsonStr.length);
      
      // Parse the JSON
      const nodeDefinition = JSON.parse(jsonStr) as JsonNodeDefinition;
      console.log('✅ Successfully parsed JSON with type:', nodeDefinition.type);
      
             // Validate required fields
       if (!nodeDefinition.type || !nodeDefinition.name) {
         console.error('❌ Missing required fields:', {
           hasType: !!nodeDefinition.type,
           hasName: !!nodeDefinition.name
         });
         return null;
       }

       // Validate executeCode for forbidden functions
       if (nodeDefinition.executeCode) {
         const forbiddenPatterns = [
           /ThreeBSP/i,
           /CSG/i,
           /import\s+/,
           /require\s*\(/,
           /await\s+/,
           /async\s+/,
           /fetch\s*\(/,
           /XMLHttpRequest/,
           /document\./,
           /window\./,
           /WebGL/i,
           /shader/i
         ];

         for (const pattern of forbiddenPatterns) {
           if (pattern.test(nodeDefinition.executeCode)) {
             console.error('❌ Forbidden function detected in executeCode:', pattern);
             console.log('Code:', nodeDefinition.executeCode);
             console.log('💡 Only use THREE.js built-in classes and standard JavaScript. See the constraints in the context.');
             return null;
           }
         }
       }
      
      // Add metadata if missing
      if (!nodeDefinition.version) nodeDefinition.version = '1.0.0';
      if (!nodeDefinition.author) nodeDefinition.author = 'AI Generated';
      if (!nodeDefinition.created) nodeDefinition.created = new Date().toISOString();
      if (!nodeDefinition.tags) nodeDefinition.tags = [nodeDefinition.category || 'generated'];
      
      console.log('✅ Valid node definition:', nodeDefinition.type, nodeDefinition.name);
      return nodeDefinition;
      
    } catch (error) {
      console.error('❌ Failed to parse JSON response:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      console.log('Response that failed to parse:', jsonResponse.substring(0, 500) + '...');
      return null;
    }
  }

  /**
   * Legacy method: Generate scene with streaming feedback
   */
  async *generateScene(prompt: string, modelName?: string): AsyncGenerator<string, any | null> {
    try {
      // Step 1: Plan scene
      const planRequest: PlanSceneRequest = {
        task: 'plan_scene',
        scene_idea: prompt
      };
      
      yield 'Planning scene...';
      const planResponse = await this.executeTask(planRequest, modelName);
      
      if (!planResponse.success) {
        yield `Planning failed: ${planResponse.error?.message}`;
        return null;
      }
      
      // Step 2: Compose scene
      const composeRequest: ComposeSceneRequest = {
        task: 'compose_scene',
        selected_node_ids: JSON.parse(planResponse.data!)
      };
      
      yield 'Composing scene...';
      const composeResponse = await this.executeTask(composeRequest, modelName);
      
      if (!composeResponse.success) {
        yield `Composition failed: ${composeResponse.error?.message}`;
        return null;
      }
      
      const scene = JSON.parse(composeResponse.data!);
      yield `Generated scene with ${scene.nodes?.length || 0} nodes`;
      return scene;
    } catch (error) {
      yield `Error: ${error}`;
      return null;
    }
  }

  /**
   * Validate node code
   */
  validateNodeCode(code: string): ValidationResult {
    return validateNodeCode(code);
  }

  /**
   * Validate scene JSON
   */
  validateSceneJSON(sceneJSON: any): ValidationResult {
    return validateSceneJSON(sceneJSON);
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return getAvailableModels();
  }
} 