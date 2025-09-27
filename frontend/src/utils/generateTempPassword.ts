/**
 * Generates a cryptographically secure random integer within a given range.
 * This function replaces Node.js's `crypto.randomInt()`.
 * @param {number} min - The minimum value (inclusive).
 * @param {number} max - The maximum value (exclusive).
 * @returns {number} A random integer in the range [min, max).
 */
function getRandomInt(min, max) {
  // Create a buffer for a 32-bit unsigned integer
  const randomBuffer = new Uint32Array(1);
  // Fill the buffer with a random value from the Web Crypto API
  window.crypto.getRandomValues(randomBuffer);
  // Scale the random value to the desired range
  const randomNumber = randomBuffer[0] / (0xffffffff + 1);
  return Math.floor(randomNumber * (max - min)) + min;
}

/**
 * Generate a temporary password that follows these rules:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 * @param {number} [length=12] - The desired length of the password.
 * @returns {string} The generated temporary password.
 */
export function generateTempPassword(length = 12) {
  if (length < 8) {
    throw new Error('Password length must be at least 8 characters');
  }

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&()-_=+[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + digits + special;

  // Helper to get a random character from a given string
  const getRandomChar = charset => charset[getRandomInt(0, charset.length)];

  // Ensure the password has at least one of each required character type
  const passwordChars = [
    getRandomChar(uppercase),
    getRandomChar(lowercase),
    getRandomChar(digits),
    getRandomChar(special),
  ];

  // Fill the rest of the password with random characters from all sets
  for (let i = passwordChars.length; i < length; i++) {
    passwordChars.push(getRandomChar(allChars));
  }

  // Shuffle the array to ensure the required characters are not always at the start
  // (Fisher-Yates Shuffle Algorithm)
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
}
