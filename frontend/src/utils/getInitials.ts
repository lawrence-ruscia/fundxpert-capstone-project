export const getInitials = (name: string) => {
  if (!name || typeof name !== 'string') return '';

  const words = name
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  // Take first and last word only
  const firstInitial = words[0].charAt(0).toUpperCase();
  const lastInitial = words[words.length - 1].charAt(0).toUpperCase();

  return firstInitial + lastInitial;
};
