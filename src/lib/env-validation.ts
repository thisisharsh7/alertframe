/**
 * Environment Variable Validation Utility
 *
 * Validates required environment variables are present and properly formatted
 * This helps catch configuration issues early before they cause runtime errors
 */

interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
  invalidVars: Array<{ name: string; reason: string }>;
  warnings: Array<{ name: string; message: string }>;
}

/**
 * List of required environment variables for the application
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'ENCRYPTION_KEY',
] as const;

/**
 * List of optional environment variables with warnings if missing
 */
const OPTIONAL_ENV_VARS = [
  'CRON_SECRET',
  'APP_URL',
  'RESEND_API_KEY', // Deprecated but still used as fallback
] as const;

/**
 * Validate a single environment variable
 */
function validateEnvVar(name: string, value: string | undefined): {
  isValid: boolean;
  reason?: string;
} {
  if (!value || value.trim() === '') {
    return { isValid: false };
  }

  // Specific validations for certain variables
  switch (name) {
    case 'DATABASE_URL':
      if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
        return {
          isValid: false,
          reason: 'Must be a valid PostgreSQL connection string starting with postgresql:// or postgres://',
        };
      }
      break;

    case 'NEXTAUTH_SECRET':
    case 'ENCRYPTION_KEY':
      if (value.length < 32) {
        return {
          isValid: false,
          reason: 'Must be at least 32 characters long for security',
        };
      }
      break;

    case 'NEXTAUTH_URL':
    case 'APP_URL':
      try {
        new URL(value);
      } catch {
        return {
          isValid: false,
          reason: 'Must be a valid URL',
        };
      }
      break;

    case 'GOOGLE_CLIENT_ID':
      if (!value.includes('.apps.googleusercontent.com')) {
        return {
          isValid: false,
          reason: 'Must be a valid Google OAuth Client ID ending with .apps.googleusercontent.com',
        };
      }
      break;

    case 'GOOGLE_CLIENT_SECRET':
      if (!value.startsWith('GOCSPX-')) {
        return {
          isValid: false,
          reason: 'Must be a valid Google OAuth Client Secret starting with GOCSPX-',
        };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Validate all required environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const missingVars: string[] = [];
  const invalidVars: Array<{ name: string; reason: string }> = [];
  const warnings: Array<{ name: string; message: string }> = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];

    if (!value) {
      missingVars.push(varName);
      continue;
    }

    const validation = validateEnvVar(varName, value);
    if (!validation.isValid) {
      invalidVars.push({
        name: varName,
        reason: validation.reason || 'Invalid format',
      });
    }
  }

  // Check optional variables and add warnings
  for (const varName of OPTIONAL_ENV_VARS) {
    const value = process.env[varName];

    if (!value) {
      let message = '';
      switch (varName) {
        case 'CRON_SECRET':
          message = 'Cron endpoints will be unprotected. Set CRON_SECRET for production.';
          break;
        case 'APP_URL':
          message = 'Will default to NEXTAUTH_URL. Recommended to set explicitly.';
          break;
        case 'RESEND_API_KEY':
          message = 'Fallback email sending is disabled. Gmail OAuth is recommended.';
          break;
      }

      if (message) {
        warnings.push({ name: varName, message });
      }
    }
  }

  const isValid = missingVars.length === 0 && invalidVars.length === 0;

  return {
    isValid,
    missingVars,
    invalidVars,
    warnings,
  };
}

/**
 * Get a formatted error message for environment validation failures
 */
export function getEnvValidationErrorMessage(result: EnvValidationResult): string {
  const lines: string[] = ['Environment configuration error:'];

  if (result.missingVars.length > 0) {
    lines.push('\nMissing required variables:');
    result.missingVars.forEach((varName) => {
      lines.push(`  - ${varName}`);
    });
  }

  if (result.invalidVars.length > 0) {
    lines.push('\nInvalid variables:');
    result.invalidVars.forEach(({ name, reason }) => {
      lines.push(`  - ${name}: ${reason}`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push('\nWarnings:');
    result.warnings.forEach(({ name, message }) => {
      lines.push(`  - ${name}: ${message}`);
    });
  }

  lines.push('\nPlease check your .env file and restart the application.');

  return lines.join('\n');
}

/**
 * Log environment validation results
 */
export function logEnvValidation(result: EnvValidationResult): void {
  if (result.isValid) {
    console.log('[Env Validation] ✅ All required environment variables are valid');

    if (result.warnings.length > 0) {
      console.warn('[Env Validation] ⚠️  Warnings:');
      result.warnings.forEach(({ name, message }) => {
        console.warn(`  - ${name}: ${message}`);
      });
    }
  } else {
    console.error('[Env Validation] ❌ Environment validation failed');
    console.error(getEnvValidationErrorMessage(result));
  }
}

/**
 * Validate environment on module load (server-side only)
 * This runs automatically when the module is imported
 */
if (typeof window === 'undefined') {
  const result = validateEnvironment();
  logEnvValidation(result);

  // In development, throw error to prevent startup with invalid config
  if (!result.isValid && process.env.NODE_ENV === 'development') {
    throw new Error(getEnvValidationErrorMessage(result));
  }
}
