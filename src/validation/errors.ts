import type { ErrorResponse } from '@/types/types';

export function createErrorResponse(
  error: string,
  message: string,
  status: number
): ErrorResponse {
  return {
    success: false,
    error,
    message,
    status,
  };
}
