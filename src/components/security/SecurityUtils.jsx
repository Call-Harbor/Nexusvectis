// Security validation utilities

export const SecurityUtils = {
  // Validate and sanitize email
  validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim()) && email.length <= 255;
  },

  // Validate and sanitize text input
  sanitizeInput(input) {
    if (!input || typeof input !== 'string') return '';
    // Remove potential XSS patterns
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .trim()
      .slice(0, 10000); // Max length
  },

  // Validate numeric input
  validateNumber(value, min = -Infinity, max = Infinity) {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  },

  // Validate coordinates
  validateCoordinates(lat, lng) {
    return (
      this.validateNumber(lat, -90, 90) &&
      this.validateNumber(lng, -180, 180)
    );
  },

  // Rate limiter (client-side)
  rateLimiters: new Map(),
  
  checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    const limiter = this.rateLimiters.get(key) || { attempts: 0, resetAt: now + windowMs };
    
    if (now > limiter.resetAt) {
      limiter.attempts = 0;
      limiter.resetAt = now + windowMs;
    }
    
    limiter.attempts++;
    this.rateLimiters.set(key, limiter);
    
    return limiter.attempts <= maxAttempts;
  },

  // Generate secure random ID
  generateSecureId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `${prefix}${timestamp}${randomPart}`;
  }
};