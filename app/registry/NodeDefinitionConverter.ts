import { NodeDefinition, SerializableNodeDefinition, IconType } from '../types/nodeSystem';
import { BUILTIN_FUNCTIONS } from './ExecutionEngine';

// Map React components to icon identifiers
const ICON_COMPONENT_MAP: Record<string, IconType> = {
  'Box': 'box',
  'Globe': 'sphere',
  'Cylinder': 'cylinder',
  'Calculator': 'calculator',
  'Clock': 'clock',
  'GitBranch': 'git-branch',
  'MapPin': 'map-pin',
  'Building2': 'building',
  'Mountain': 'mountain',
  'Waves': 'waves',
  'Sparkles': 'sparkles'
};

// Analysis patterns to detect builtin functions
const BUILTIN_PATTERNS: Record<string, string> = {
  'cube': 'cube',
  'sphere': 'sphere', 
  'cylinder': 'cylinder',
  'math': 'math_basic',
  'time': 'time',
  'make-vector': 'vector_make',
  'break-vector': 'vector_break',
  'transform': 'transform',
  'output': 'output'
};

export class NodeDefinitionConverter {
  // Convert runtime NodeDefinition to SerializableNodeDefinition
  static toSerializable(runtime: NodeDefinition, options: {
    author?: string;
    isPublic?: boolean;
    tags?: string[];
  } = {}): SerializableNodeDefinition {
    const iconType = this.extractIconType(runtime.ui?.icon);
    const execution = this.analyzeExecution(runtime);
    
    return {
      type: runtime.type,
      name: runtime.name,
      description: runtime.description,
      category: runtime.category,
      version: '1.0.0',
      color: runtime.color,
      layout: runtime.layout,
      ui: runtime.ui ? {
        ...runtime.ui,
        icon: iconType
      } : undefined,
      inputs: runtime.inputs,
      outputs: runtime.outputs,
      parameters: runtime.parameters,
      execution,
      tags: options.tags || [runtime.category],
      author: options.author,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: options.isPublic ?? true
    };
  }
  
  // Extract icon type from React component
  private static extractIconType(iconComponent: any): IconType | undefined {
    if (!iconComponent) return undefined;
    
    // Try to get component name
    const componentName = iconComponent.displayName || iconComponent.name;
    if (componentName && ICON_COMPONENT_MAP[componentName]) {
      return ICON_COMPONENT_MAP[componentName];
    }
    
    // Default fallback based on common patterns
    return 'settings';
  }
  
  // Analyze execution function to create serializable execution
  private static analyzeExecution(runtime: NodeDefinition) {
    const nodeType = runtime.type;
    
    // Check if it matches a known builtin pattern
    const builtinFunction = BUILTIN_PATTERNS[nodeType];
    if (builtinFunction && BUILTIN_FUNCTIONS[builtinFunction]) {
      return {
        type: 'builtin' as const,
        functionName: builtinFunction
      };
    }
    
    // Try to analyze the function for simple mathematical expressions
    const functionString = runtime.execute.toString();
    
    if (this.isSimpleMathFunction(functionString)) {
      return this.extractMathExpressions(functionString, runtime);
    }
    
    // For complex functions, create a composite execution
    return this.createCompositeExecution(runtime);
  }
  
  // Check if function is simple math
  private static isSimpleMathFunction(funcStr: string): boolean {
    const mathKeywords = ['Math.', '+', '-', '*', '/', 'Math.sin', 'Math.cos', 'Math.sqrt'];
    const hasComplexLogic = /if\s*\(|switch\s*\(|for\s*\(|while\s*\(/i.test(funcStr);
    const hasMath = mathKeywords.some(keyword => funcStr.includes(keyword));
    
    return hasMath && !hasComplexLogic;
  }
  
  // Extract mathematical expressions from simple functions
  private static extractMathExpressions(funcStr: string, runtime: NodeDefinition) {
    const expressions: Record<string, string> = {};
    
    // This is a simplified extraction - in practice, you'd use AST parsing
    runtime.outputs.forEach(output => {
      // Try to find assignment patterns like "result = expression"
      const assignmentPattern = new RegExp(`${output.id}\\s*[=:]\\s*([^;\\n}]+)`, 'i');
      const match = funcStr.match(assignmentPattern);
      
      if (match) {
        expressions[output.id] = match[1].trim();
      } else {
        // Default simple expression
        expressions[output.id] = 'inputs.valueA + inputs.valueB';
      }
    });
    
    return {
      type: 'expression' as const,
      expressions
    };
  }
  
  // Create composite execution for complex functions
  private static createCompositeExecution(runtime: NodeDefinition) {
    // Create a simplified composite based on node type and I/O
    const steps = [];
    
    if (runtime.inputs.length > 0 && runtime.outputs.length > 0) {
      steps.push({
        operation: `${runtime.type}_operation`,
        inputs: runtime.inputs.reduce((acc, input) => {
          acc[input.id] = input.defaultValue || 0;
          return acc;
        }, {} as Record<string, any>),
        output: runtime.outputs[0].id
      });
    }
    
    return {
      type: 'composite' as const,
      steps
    };
  }
  
  // Convert all existing nodes to serializable format
  static convertExistingNodes(existingNodes: NodeDefinition[], options: {
    author?: string;
    isPublic?: boolean;
  } = {}): SerializableNodeDefinition[] {
    return existingNodes.map(node => 
      this.toSerializable(node, {
        ...options,
        tags: [node.category, 'legacy-converted']
      })
    );
  }
  
  // Create example serializable nodes for testing
  static createExamples(): SerializableNodeDefinition[] {
    return [
      {
        type: 'example-cube',
        name: 'Example Cube',
        description: 'Example cube geometry node',
        category: 'geometry',
        version: '1.0.0',
        color: { primary: '#ea580c', secondary: '#c2410c' },
        inputs: [
          { id: 'width', name: 'Width', type: 'number', defaultValue: 1, description: 'Cube width' },
          { id: 'height', name: 'Height', type: 'number', defaultValue: 1, description: 'Cube height' },
          { id: 'depth', name: 'Depth', type: 'number', defaultValue: 1, description: 'Cube depth' }
        ],
        outputs: [
          { id: 'geometry', name: 'Geometry', type: 'geometry', description: 'Generated cube geometry' }
        ],
        parameters: [],
        ui: { icon: 'box' },
        execution: { type: 'builtin', functionName: 'cube' },
        tags: ['geometry', 'primitive', 'example'],
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      
      {
        type: 'example-math',
        name: 'Example Math',
        description: 'Example mathematical operations',
        category: 'math',
        version: '1.0.0',
        color: { primary: '#16a34a', secondary: '#15803d' },
        inputs: [
          { id: 'valueA', name: 'X', type: 'number', defaultValue: 0, description: 'First value' },
          { id: 'valueB', name: 'Y', type: 'number', defaultValue: 0, description: 'Second value' }
        ],
        outputs: [
          { id: 'result', name: 'Result', type: 'number', description: 'Math result' }
        ],
        parameters: [
          { 
            id: 'operation', 
            name: 'Operation', 
            type: 'select', 
            defaultValue: 'add',
            options: ['add', 'subtract', 'multiply', 'divide'],
            description: 'Mathematical operation'
          }
        ],
        ui: { icon: 'calculator' },
        execution: { 
          type: 'expression',
          expressions: {
            'result': 'operation === "add" ? valueA + valueB : operation === "subtract" ? valueA - valueB : operation === "multiply" ? valueA * valueB : valueB !== 0 ? valueA / valueB : 0'
          }
        },
        tags: ['math', 'basic', 'example'],
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
} 