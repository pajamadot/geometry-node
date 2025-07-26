import { NextRequest } from 'next/server';
import { 
  geometryAI, 
  GenerateSceneRequest,
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
            // Use the new single-step generation approach
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'progress', 
              content: 'Generating scene...' 
            })}\n\n`));

            const generateRequest: GenerateSceneRequest = {
              task: 'generate_scene',
              scene_description: prompt
            };

            // Attempt generation with retry logic
            let attempts = 0;
            const maxAttempts = 3;
            let lastError = null;

            while (attempts < maxAttempts) {
              attempts++;
              
              try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'progress', 
                  content: attempts > 1 ? `Retry attempt ${attempts}...` : 'Processing scene description...' 
                })}\n\n`));

                let sceneResult = '';
                let hasContent = false;
                let pendingChunks = '';
                let lastUpdateTime = 0;
                const UPDATE_THROTTLE_MS = 100; // Batch updates every 100ms

                // Stream the generation with real-time content display
                for await (const chunk of geometryAI.streamGenerateScene(generateRequest, model)) {
                  hasContent = true;
                  sceneResult += chunk;
                  pendingChunks += chunk;
                  
                  // ✅ Send batched content for better performance while maintaining real-time feel
                  const now = Date.now();
                  if (now - lastUpdateTime >= UPDATE_THROTTLE_MS || chunk.includes('}') || chunk.includes('\n')) {
                    if (pendingChunks) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        type: 'stream', 
                        content: pendingChunks 
                      })}\n\n`));
                      pendingChunks = '';
                      lastUpdateTime = now;
                    }
                  }
                }

                // Send any remaining chunks
                if (pendingChunks) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    type: 'stream', 
                    content: pendingChunks 
                  })}\n\n`));
                }

                if (!hasContent) {
                  throw new Error('No content received from AI service');
                }

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'progress', 
                  content: '\n\nValidating generated scene...' 
                })}\n\n`));

                // Validate the complete result (but we already streamed the content)
                const result = await geometryAI.executeTask(generateRequest, model);
                
                if (result.success && result.data) {
                  // Parse and validate the final scene
                  try {
                    const scene = JSON.parse(result.data);
                    
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      type: 'success', 
                      content: 'Scene generated successfully!',
                      scene: scene
                    })}\n\n`));
                    
                    return; // Success - exit the retry loop
                    
                  } catch (parseError) {
                    // Try to parse the streamed content directly
                    try {
                      const scene = JSON.parse(sceneResult);
                      
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        type: 'success', 
                        content: 'Scene generated successfully!',
                        scene: scene
                      })}\n\n`));
                      
                      return; // Success with streamed content
                    } catch (streamParseError) {
                      lastError = createError(
                        ErrorType.PARSING_ERROR,
                        'Generated scene could not be parsed as JSON',
                        { parseError, generatedContent: result.data, streamedContent: sceneResult },
                        'generate-scene parsing'
                      );
                    }
                  }
                } else {
                  // Try to use the streamed content if the executeTask failed
                  try {
                    const scene = JSON.parse(sceneResult);
                    
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      type: 'success', 
                      content: 'Scene generated successfully (from stream)!',
                      scene: scene
                    })}\n\n`));
                    
                    return; // Success with streamed content
                  } catch (streamParseError) {
                    lastError = createError(
                      ErrorType.AI_SERVICE_ERROR,
                      typeof result.error === 'string' ? result.error : 'Scene generation failed',
                      { result, streamedContent: sceneResult },
                      'generate-scene execution'
                    );
                  }
                }

              } catch (attemptError) {
                lastError = createError(
                  ErrorType.AI_SERVICE_ERROR,
                  `Generation attempt ${attempts} failed`,
                  attemptError,
                  'generate-scene attempt'
                );
              }

              // If not the last attempt, prepare for retry
              if (attempts < maxAttempts) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'progress', 
                  content: `Attempt ${attempts} failed, retrying...` 
                })}\n\n`));
                
                // Brief pause before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            // All attempts failed
            if (lastError) {
              logError(lastError);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'error', 
                content: `Scene generation failed after ${maxAttempts} attempts: ${lastError.message}`,
                errorType: lastError.type
              })}\n\n`));
            } else {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'error', 
                content: 'Scene generation failed for unknown reasons',
                errorType: ErrorType.UNKNOWN_ERROR
              })}\n\n`));
            }

          } else if (mode === 'explain') {
            // Use explanation mode for scene planning
            const generateRequest: GenerateSceneRequest = {
              task: 'generate_scene',
              scene_description: prompt
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'progress', 
              content: 'Analyzing scene requirements...' 
            })}\n\n`));
            
            for await (const chunk of geometryAI.streamGenerateScene(generateRequest, model)) {
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