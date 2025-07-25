import { NextRequest } from 'next/server';
import { 
  geometryAI, 
  PlanSceneRequest, 
  ComposeSceneRequest,
  validateAPIRequest, 
  validationToResponse,
  createHTTPResponse,
  createStreamingErrorResponse,
  ErrorType,
  createError,
  logError
} from '../../../agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate API request parameters
    const validation = validateAPIRequest(body);
    if (!validation.success) {
      const response = validationToResponse(validation, null, 'generate-scene API');
      return createHTTPResponse(response, 400);
    }

    const { prompt, model, mode = 'generate' } = body;

    // Create a readable stream for streaming responses
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          if (mode === 'generate') {
            // Use structured task methods instead of legacy
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'progress', 
              content: 'Planning scene...' 
            })}\n\n`));

            // Step 1: Plan the scene
            const planRequest: PlanSceneRequest = {
              task: 'plan_scene',
              scene_idea: prompt
            };

            let planResult = '';
            for await (const chunk of geometryAI.streamTask(planRequest, model)) {
              planResult += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'progress', 
                content: chunk 
              })}\n\n`));
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'progress', 
              content: 'Composing scene from planned nodes...' 
            })}\n\n`));

            try {
              // Extract node IDs from plan result
              // This is a simplified approach - in production you'd want better parsing
              const nodeIds = extractNodeIdsFromPlan(planResult);
              
              if (nodeIds.length === 0) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'error', 
                  content: 'No valid node IDs found in scene plan',
                  errorType: ErrorType.PARSING_ERROR
                })}\n\n`));
                return;
              }

              // Step 2: Compose the scene
              const composeRequest: ComposeSceneRequest = {
                task: 'compose_scene',
                selected_node_ids: nodeIds
              };

              let sceneResult = '';
              for await (const chunk of geometryAI.streamTask(composeRequest, model)) {
                sceneResult += chunk;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'progress', 
                  content: chunk 
                })}\n\n`));
              }

              try {
                // Parse the scene JSON
                const scene = JSON.parse(sceneResult);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'success', 
                  content: 'Scene generated successfully!',
                  scene: scene
                })}\n\n`));
              } catch (parseError) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'error', 
                  content: 'Failed to parse generated scene JSON',
                  errorType: ErrorType.PARSING_ERROR
                })}\n\n`));
              }

            } catch (planParseError) {
              const error = createError(
                ErrorType.PARSING_ERROR,
                'Failed to parse scene plan',
                planParseError,
                'generate-scene planning'
              );
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'error', 
                content: error.message,
                errorType: error.type
              })}\n\n`));
            }

          } else if (mode === 'explain') {
            // Use structured streaming method for explanation
            const planRequest: PlanSceneRequest = {
              task: 'plan_scene',
              scene_idea: prompt
            };
            
            for await (const chunk of geometryAI.streamTask(planRequest, model)) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'stream', 
                content: chunk 
              })}\n\n`));
            }
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'done', 
              content: '' 
            })}\n\n`));
          } else {
            const error = createError(
              ErrorType.VALIDATION_ERROR,
              `Invalid mode: ${mode}. Must be 'generate' or 'explain'`,
              { mode },
              'generate-scene mode validation'
            );
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              content: error.message,
              errorType: error.type
            })}\n\n`));
          }
        } catch (error) {
          const standardError = createError(
            ErrorType.AI_SERVICE_ERROR,
            'Failed to generate scene',
            error,
            'generate-scene execution'
          );
          logError(standardError);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            content: standardError.message,
            errorType: standardError.type
          })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const standardError = createError(
      ErrorType.UNKNOWN_ERROR,
      'Request processing failed',
      error,
      'generate-scene request'
    );
    return createStreamingErrorResponse(standardError);
  }
}

/**
 * Extract node IDs from the AI-generated plan
 * This is a simplified implementation - in production you'd want more robust parsing
 */
function extractNodeIdsFromPlan(planText: string): string[] {
  try {
    // Look for JSON array in the response
    const jsonMatch = planText.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback: look for node type mentions
    const nodeMatches = planText.match(/["'](\w+)["']/g);
    if (nodeMatches) {
      return nodeMatches.map(match => match.replace(/["']/g, ''));
    }
    
    return [];
  } catch (error) {
    console.warn('Failed to extract node IDs from plan:', error);
    return [];
  }
} 