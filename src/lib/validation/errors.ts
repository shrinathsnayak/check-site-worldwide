import type { ErrorResponse } from '../types/types';

export function createErrorResponse(
  error: string,
  message: string,
  status: number = 400,
  details?: unknown,
  supportedCountries?: string[]
): { response: ErrorResponse; status: number } {
  const errorResponse: ErrorResponse = {
    success: false,
    error,
    message,
    status,
  };

  if (details) {
    errorResponse.details = details;
  }

  if (supportedCountries) {
    errorResponse.supportedCountries = supportedCountries;
  }

  return { response: errorResponse, status };
}

export function createInternalErrorResponse(error: unknown): {
  response: ErrorResponse;
  status: number;
} {
  const errorMessage =
    error instanceof Error ? error.message : 'Internal server error';

  return createErrorResponse('Internal server error', errorMessage, 500);
}
