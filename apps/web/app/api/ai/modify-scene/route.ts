import { NextRequest } from 'next/server';
import { 
  geometryAI, 
  ModifySceneRequest,
  validateAPIRequest, 
  validationToResponse,
  createHTTPResponse,
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
      const response = validationToResponse(validation, null, 'modify-scene API');
      return createHTTPResponse(response, 400);
    }

    const { sceneData, prompt, model } = body;

    if (!sceneData) {
      const error = createError(
        ErrorType.VALIDATION_ERROR,
        'Missing required parameter: sceneData',
        { body },
        'modify-scene API validation'
      );
      const response = validationToResponse({ success: false, errors: [error.message] }, null, 'modify-scene API');
      return createHTTPResponse(response, 400);
    }

    // Create a readable stream for streaming responses
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Use structured task method
          const taskRequest: ModifySceneRequest = {
            task: 'modify_scene',
            sceneData,
            modification_description: prompt
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'progress', 
            content: 'Generating scene modifications...' 
          })}\n\n`));

          // Execute the modification task
          const result = await geometryAI.executeTask(taskRequest, model);

          if (!result.success) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              content: result.error?.message || 'Failed to modify scene',
              errorType: result.error?.type || ErrorType.AI_SERVICE_ERROR
            })}\n\n`));
          } else {
            // Parse the modified scene from the result
            try {
              const modifiedScene = JSON.parse(result.data!);
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'success', 
                content: 'Scene successfully modified!',
                scene: modifiedScene
              })}\n\n`));
            } catch (parseError) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'error', 
                content: 'Failed to parse modified scene JSON',
                errorType: ErrorType.PARSING_ERROR
              })}\n\n`));
            }
          }
        } catch (error) {
          const standardError = createError(
            ErrorType.AI_SERVICE_ERROR,
            'Failed to modify scene',
            error,
            'modify-scene execution'
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
      }
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
      'Unexpected error in modify-scene API',
      error,
      'modify-scene API'
    );
    logError(standardError);
    
    const response = validationToResponse(
      { success: false, errors: [standardError.message] }, 
      null, 
      'modify-scene API'
    );
    return createHTTPResponse(response, 500);
  }
} 