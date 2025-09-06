#!/usr/bin/env node
import crypto from 'crypto';

function generateSecret(bytes = 32, encoding = 'hex') {
  return crypto.randomBytes(bytes).toString(encoding);
}

function generateSecrets() {
  console.log('🔐 Cryptographically Secure Secret Generator\n');

  // Different secret types
  const secrets = {
    'JWT Secret (256-bit)': generateSecret(32, 'hex'),
    'Refresh Token Secret (256-bit)': generateSecret(32, 'hex'),
    'Session Secret (192-bit)': generateSecret(24, 'base64'),
    'Database Encryption Key (256-bit)': generateSecret(32, 'hex'),
    'API Key (256-bit)': generateSecret(32, 'hex'),
    'Strong Secret (512-bit)': generateSecret(64, 'hex'),
    'UUID-like Secret': crypto.randomUUID(),
  };

  // Display secrets
  Object.entries(secrets).forEach(([name, secret]) => {
    console.log(`${name}:`);
    console.log(`  ${secret}`);
    console.log();
  });

  // Generate .env format
  console.log('📄 .env Format:');
  console.log('JWT_SECRET=' + generateSecret(32, 'hex'));
  console.log('REFRESH_TOKEN_SECRET=' + generateSecret(32, 'hex'));
  console.log('SESSION_SECRET=' + generateSecret(24, 'base64'));
  console.log('DATABASE_URL_SECRET=' + generateSecret(32, 'hex'));
  console.log();

  // Different encodings of the same secret
  const rawBytes = crypto.randomBytes(32);
  console.log('🔄 Same Secret, Different Encodings:');
  console.log('Hex:     ' + rawBytes.toString('hex'));
  console.log('Base64:  ' + rawBytes.toString('base64'));
  console.log('Base64URL: ' + rawBytes.toString('base64url'));
  console.log();

  // Security info
  console.log('🛡️  Security Information:');
  console.log('• All secrets generated using crypto.randomBytes()');
  console.log(
    '• 256-bit secrets provide excellent security for most use cases'
  );
  console.log(
    '• Store secrets securely (environment variables, secret managers)'
  );
  console.log('• Never commit secrets to version control');
  console.log('• Rotate secrets periodically');
  console.log();

  // Validation
  console.log('✅ Secret Quality Check:');
  const testSecret = generateSecret(32, 'hex');
  console.log(`Length: ${testSecret.length} characters`);
  console.log(`Entropy: ~${32 * 8} bits`);
  console.log(
    `Character set: ${testSecret.includes('0-9') ? 'numeric, ' : ''}hex (0-9, a-f)`
  );
}

// Command line options
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Secret Key Generator');
  console.log('');
  console.log('Usage:');
  console.log('  node generate-secrets.js            Generate various secrets');
  console.log(
    '  node generate-secrets.js --quick    Generate just JWT secrets'
  );
  console.log(
    '  node generate-secrets.js --env      Generate .env format only'
  );
  console.log('  node generate-secrets.js --custom N Generate N-byte secret');
  console.log('');
  process.exit(0);
}

if (args.includes('--quick')) {
  console.log('JWT_SECRET=' + generateSecret(32, 'hex'));
  console.log('REFRESH_TOKEN_SECRET=' + generateSecret(32, 'hex'));
  process.exit(0);
}

if (args.includes('--env')) {
  console.log('# Generated secrets - add to your .env file');
  console.log('JWT_SECRET=' + generateSecret(32, 'hex'));
  console.log('REFRESH_TOKEN_SECRET=' + generateSecret(32, 'hex'));
  console.log('SESSION_SECRET=' + generateSecret(24, 'base64'));
  console.log('DB_ENCRYPTION_KEY=' + generateSecret(32, 'hex'));
  console.log('API_KEY=' + generateSecret(32, 'hex'));
  process.exit(0);
}

const customIndex = args.indexOf('--custom');
if (customIndex !== -1 && args[customIndex + 1]) {
  const bytes = parseInt(args[customIndex + 1]);
  if (bytes > 0 && bytes <= 1024) {
    console.log(`Custom ${bytes}-byte secret:`);
    console.log(generateSecret(bytes, 'hex'));
    process.exit(0);
  } else {
    console.log('Error: Custom byte count must be between 1 and 1024');
    process.exit(1);
  }
}

// Default: generate all secrets
generateSecrets();

// Export for use as module
export default { generateSecret };
