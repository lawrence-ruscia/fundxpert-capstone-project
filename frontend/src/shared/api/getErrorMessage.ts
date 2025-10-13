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

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
