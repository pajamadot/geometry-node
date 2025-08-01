import { NextRequest } from 'next/server';
import { 
  geometryAI, 
  CreateNodeRequest, 
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
      const response = validationToResponse(validation, null, 'generate-node API');
      return createHTTPResponse(response, 400);
    }

    const { prompt, model, mode = 'generate' } = body;

    // Create a readable stream for streaming responses
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          if (mode === 'generate') {
            // Use structured task method instead of legacy
            const taskRequest: CreateNodeRequest = {
              task: 'create_node',
              behavior: prompt
            };

            let finalResult = null;
            let fullResponse = '';

            // Stream the generation process
            for await (const chunk of geometryAI.streamTask(taskRequest, model)) {
              fullResponse += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'progress', 
                content: chunk 
              })}\n\n`));
            }

            // Process the generated code
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'progress', 
              content: 'Processing generated JSON...' 
            })}\n\n`));

            try {
                    // Parse the JSON response directly
      const nodeDefinition = geometryAI.parseJsonNodeDefinition(fullResponse);
              
              if (nodeDefinition) {
                // Return the node definition to the client for registration
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'success', 
                  content: 'Node generated successfully!',
                  node: nodeDefinition
                })}\n\n`));
              } else {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'error', 
                  content: 'Failed to parse generated JSON to valid node format',
                  errorType: ErrorType.PARSING_ERROR
                })}\n\n`));
              }
            } catch (parseError) {
              const error = createError(
                ErrorType.PARSING_ERROR,
                'Failed to process generated JSON node definition',
                parseError,
                'generate-node parsing'
              );
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'error', 
                content: error.message,
                errorType: error.type
              })}\n\n`));
            }

          } else if (mode === 'explain') {
            // Use structured streaming method
            const taskRequest: CreateNodeRequest = {
              task: 'create_node',
              behavior: prompt
            };
            
            for await (const chunk of geometryAI.streamTask(taskRequest, model)) {
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
              'generate-node mode validation'
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
            'Failed to generate node',
            error,
            'generate-node execution'
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
      'generate-node request'
    );
    return createStreamingErrorResponse(standardError);
  }
}

// GET endpoint to list available models
export async function GET() {
  try {
    const models = geometryAI.getAvailableModels();
    const response = { success: true, data: { models } };
    return createHTTPResponse(response);
  } catch (error) {
    const standardError = createError(
      ErrorType.UNKNOWN_ERROR,
      'Failed to retrieve available models',
      error,
      'get-models'
    );
    const response = { success: false, error: standardError };
    return createHTTPResponse(response, 500);
  }
} 