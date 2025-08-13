/**
 * Input Validation & Sanitization System
 */

// Validation rule interface
interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'url' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  sanitize?: boolean;
}

// Validation schema interface
interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Validation result interface
interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
  sanitizedData?: any;
}

/**
 * Input validation and sanitization
 */
export function validateInput(data: any, schema: ValidationSchema): ValidationResult {
  const errors: { [key: string]: string } = {};
  const sanitizedData: any = {};

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }

    // Skip validation if field is not required and empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      sanitizedData[field] = value;
      continue;
    }

    // Type validation
    if (rule.type) {
      if (!validateType(value, rule.type)) {
        errors[field] = `${field} must be of type ${rule.type}`;
        continue;
      }
    }

    // String length validation
    if (rule.type === 'string' || typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors[field] = `${field} must be at least ${rule.minLength} characters`;
        continue;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors[field] = `${field} must be no more than ${rule.maxLength} characters`;
        continue;
      }
    }

    // Number range validation
    if (rule.type === 'number' || typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors[field] = `${field} must be at least ${rule.min}`;
        continue;
      }
      if (rule.max !== undefined && value > rule.max) {
        errors[field] = `${field} must be no more than ${rule.max}`;
        continue;
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        errors[field] = `${field} format is invalid`;
        continue;
      }
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        errors[field] = typeof customResult === 'string' ? customResult : `${field} is invalid`;
        continue;
      }
    }

    // Sanitization
    sanitizedData[field] = rule.sanitize ? sanitizeValue(value, rule.type) : value;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Type validation helper
 */
function validateType(value: any, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'email':
      return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'url':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return true;
  }
}

/**
 * Value sanitization helper
 */
function sanitizeValue(value: any, type?: string): any {
  if (typeof value === 'string') {
    // Basic HTML sanitization
    value = value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    // Trim whitespace
    value = value.trim();
  }

  if (type === 'number' && typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? value : num;
  }

  return value;
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // User authentication
  login: {
    email: { required: true, type: 'email' as const, sanitize: true },
    password: { required: true, type: 'string' as const, minLength: 6 }
  },

  // Card search
  cardSearch: {
    query: { type: 'string' as const, maxLength: 100, sanitize: true },
    filters: { type: 'object' as const },
    page: { type: 'number' as const, min: 1 },
    limit: { type: 'number' as const, min: 1, max: 100 }
  },

  // Price data
  priceData: {
    cardId: { required: true, type: 'string' as const, sanitize: true },
    price: { required: true, type: 'number' as const, min: 0 },
    date: { required: true, type: 'string' as const },
    source: { type: 'string' as const, sanitize: true }
  },

  // Admin actions
  adminAction: {
    action: { required: true, type: 'string' as const, sanitize: true },
    target: { type: 'string' as const, sanitize: true },
    parameters: { type: 'object' as const }
  }
};

/**
 * SQL injection prevention
 */
export function sanitizeSQL(input: string): string {
  return input.replace(/[';\x00\x08\x09\x1a\n\r"'\\%]/g, char => {
    switch (char) {
      case "'":
        return "''";
      case '"':
        return '""';
      case '\\':
        return '\\';
      case '%':
        return '\%';
      default:
        return '';
    }
  });
}

/**
 * XSS prevention
 */
export function sanitizeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export default {
  validateInput,
  commonSchemas,
  sanitizeSQL,
  sanitizeHTML
};
