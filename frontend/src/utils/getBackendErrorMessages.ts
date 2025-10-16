export function getBackendErrorMessage(
  err: any,
  fallback = 'An error occurred'
) {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}
 