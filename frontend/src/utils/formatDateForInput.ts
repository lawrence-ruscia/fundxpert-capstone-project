// Helper function to format date properly (fixes the -1 day issue)
export const formatDateForInput = (dateString: string | Date): string => {
  if (!dateString) return '';

  // If it's already a string in YYYY-MM-DD format, return it
  if (
    typeof dateString === 'string' &&
    dateString.match(/^\d{4}-\d{2}-\d{2}$/)
  ) {
    return dateString;
  }

  // Create date and format as local date to avoid timezone issues
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
