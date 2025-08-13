/**
 * Environment Variable Validation and Configuration
 */

// Required environment variables for production
const REQUIRED_ENV_VARS = {
  production: [
    'JWT_SECRET',
    'DATABASE_URL'
  ],
  development: []
};

// Environment variable validation schema
interface EnvVarSchema {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean';
  minLength?: number;
  enum?: string[];
  default?: string | number | boolean;
  description: string;
}

const ENV_SCHEMA: Record<string, EnvVarSchema> = {
  JWT_SECRET: {
    required: process.env.NODE_ENV === 'production',
    type: 'string',
    minLength: 32,
    description: 'JWT signing secret - must be at least 32 characters'
  },
  DATABASE_URL: {
    required: false,
    type: 'string',
    description: 'Database connection URL'
  },
  NODE_ENV: {
    required: false,
    type: 'string',
    enum: ['development', 'test', 'production'],
    default: 'development',
    description: 'Node.js environment'
  },
  SESSION_COOKIE_SECURE: {
    required: false,
    type: 'boolean',
    default: process.env.NODE_ENV === 'production',
    description: 'Enable secure cookies in production'
  },
  API_RATE_LIMIT_MAX: {
    required: false,
    type: 'number',
    default: 100,
    description: 'Maximum requests per time window'
  },
  API_RATE_LIMIT_WINDOW: {
    required: false,
    type: 'number', 
    default: 60000,
    description: 'Rate limit time window in milliseconds'
  }
};

/**
 * Validate environment variables
 */
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const env = process.env.NODE_ENV || 'development';

  // Check required variables
  const required = REQUIRED_ENV_VARS[env as keyof typeof REQUIRED_ENV_VARS] || [];
  for (const varName of required) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate schema
  for (const [varName, schema] of Object.entries(ENV_SCHEMA)) {
    const value = process.env[varName];
    
    if (schema.required && !value) {
      errors.push(`Missing required environment variable: ${varName} - ${schema.description}`);
      continue;
    }

    if (value) {
      // Type validation
      if (schema.type === 'number' && isNaN(Number(value))) {
        errors.push(`Invalid type for ${varName}: expected number, got string`);
      }

      if (schema.type === 'boolean' && !['true', 'false'].includes(value.toLowerCase())) {
        errors.push(`Invalid type for ${varName}: expected boolean (true/false)`);
      }

      // Enum validation
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`Invalid value for ${varName}: must be one of ${schema.enum.join(', ')}`);
      }

      // Length validation
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`${varName} must be at least ${schema.minLength} characters long`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get environment configuration with defaults
 */
export function getEnvironmentConfig() {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    console.error('❌ Environment validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed in production');
    }
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL || './data/mtg-investment.db',
    sessionCookieSecure: process.env.SESSION_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimitMax: parseInt(process.env.API_RATE_LIMIT_MAX || '100'),
    rateLimitWindow: parseInt(process.env.API_RATE_LIMIT_WINDOW || '60000'),
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test'
  };
}

// Validate on import (but allow override in tests)
if (process.env.NODE_ENV !== 'test') {
  const validation = validateEnvironment();
  if (!validation.isValid && process.env.NODE_ENV === 'production') {
    console.error('❌ Critical environment validation errors in production:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  } else if (!validation.isValid) {
    console.warn('⚠️  Environment validation warnings:');
    validation.errors.forEach(error => console.warn(`  - ${error}`));
  }
}

export default getEnvironmentConfig();
