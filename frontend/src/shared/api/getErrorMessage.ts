import { AxiosError } from 'axios';

export function getErrorMessage(
  error: unknown,
  fallback = 'An error occurred'
): string {
  if (error instanceof AxiosError) {
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      fallback
    );
  }

  // Non-Axios Error
  if (error instanceof Error) {
    return error.message;
  }

  // Handle generic or unexpected structures
  if (typeof error === 'object' && error !== null) {
    return (error as any)?.message || fallback;
  }

  return fallback;
}
