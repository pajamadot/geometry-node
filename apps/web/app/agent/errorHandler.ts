import { ValidationResult } from './types';

// Standard error types for the AI Agent system
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  REGISTRATION_ERROR = 'REGISTRATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Standard error interface
export interface StandardError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: string;
  context?: string;
}

// Standard response interface
export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: StandardError;
  warnings?: string[];
}

/**
 * Creates a standardized error object
 */
export function createError(
  type: ErrorType,
  message: string,
  details?: any,
  context?: string
): StandardError {
  return {
    type,
    message,
    details,
    context,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(data: T, warnings?: string[]): StandardResponse<T> {
  return {
    success: true,
    data,
    warnings
  };
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: StandardError): StandardResponse {
  return {
    success: false,
    error
  };
}

/**
 * Wraps a function with standardized error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
) {
  return async (...args: T): Promise<StandardResponse<R>> => {
    try {
      const result = await fn(...args);
      return createSuccessResponse(result);
    } catch (error) {
      const standardError = handleError(error, context);
      return createErrorResponse(standardError);
    }
  };
}

/**
 * Wraps a generator function with standardized error handling
 */
export function withErrorHandlingGenerator<T extends any[], R>(
  fn: (...args: T) => AsyncGenerator<string, R>,
  context: string
) {
  return async function* (...args: T): AsyncGenerator<string, StandardResponse<R>> {
    try {
      const generator = fn(...args);
      let finalResult: R;
      
      for await (const chunk of generator) {
        if (typeof chunk === 'string') {
          yield chunk;
        } else {
          finalResult = chunk;
        }
      }
      
      return createSuccessResponse(finalResult!);
    } catch (error) {
      const standardError = handleError(error, context);
      yield `Error in ${context}: ${standardError.message}`;
      return createErrorResponse(standardError);
    }
  };
}

/**
 * Handles different types of errors and converts them to StandardError
 */
export function handleError(error: any, context?: string): StandardError {
  // If it's already a StandardError, return it
  if (error && error.type && Object.values(ErrorType).includes(error.type)) {
    return error;
  }

  // Handle validation errors
  if (error && error.success === false && error.errors) {
    return createError(
      ErrorType.VALIDATION_ERROR,
      error.errors.join(', '),
      error,
      context
    );
  }

  // Handle network/fetch errors
  if (error && (error.name === 'FetchError' || error.code === 'ECONNREFUSED')) {
    return createError(
      ErrorType.NETWORK_ERROR,
      'Network connection failed',
      error,
      context
    );
  }

  // Handle parsing errors
  if (error && (error instanceof SyntaxError || error.name === 'SyntaxError')) {
    return createError(
      ErrorType.PARSING_ERROR,
      'Failed to parse response',
      error,
      context
    );
  }

  // Handle AI service specific errors
  if (error && error.message && error.message.includes('API')) {
    return createError(
      ErrorType.AI_SERVICE_ERROR,
      error.message,
      error,
      context
    );
  }

  // Default unknown error
  return createError(
    ErrorType.UNKNOWN_ERROR,
    error?.message || 'An unknown error occurred',
    error,
    context
  );
}

/**
 * Converts ValidationResult to StandardResponse
 */
export function validationToResponse<T>(
  validation: ValidationResult,
  data?: T,
  context?: string
): StandardResponse<T> {
  if (validation.success) {
    return createSuccessResponse(data!, validation.warnings);
  } else {
    const error = createError(
      ErrorType.VALIDATION_ERROR,
      validation.errors.join(', '),
      validation,
      context
    );
    return createErrorResponse(error);
  }
}

/**
 * Logs errors in a standardized format
 */
export function logError(error: StandardError): void {
  console.error(`[${error.type}] ${error.timestamp}: ${error.message}`, {
    context: error.context,
    details: error.details
  });
}

/**
 * Creates HTTP response from StandardResponse
 */
export function createHTTPResponse(response: StandardResponse, status?: number): Response {
  if (response.success) {
    return Response.json(response, { status: status || 200 });
  } else {
    logError(response.error!);
    return Response.json(response, { status: status || 500 });
  }
}

/**
 * Creates streaming HTTP response for errors
 */
export function createStreamingErrorResponse(error: StandardError): Response {
  logError(error);
  
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
        type: 'error', 
        content: error.message,
        errorType: error.type
      })}\n\n`));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 