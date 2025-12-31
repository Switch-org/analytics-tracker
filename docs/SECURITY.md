# Security Guide

## 🔒 Security Overview

This guide covers security best practices for using and contributing to `user-analytics-tracker`.

## For Users

### 1. Secure Your Backend Endpoint

**Always use HTTPS in production:**

```tsx
// ✅ Good - HTTPS
apiEndpoint: 'https://api.yourcompany.com/analytics'

// ❌ Bad - HTTP (insecure)
apiEndpoint: 'http://api.yourcompany.com/analytics'
```

### 2. Implement Backend Validation

**Never trust client-side data.** Always validate and sanitize on your backend:

```javascript
// Example: Express.js backend validation
app.post('/analytics', (req, res) => {
  const { event, data } = req.body;
  
  // Validate event name
  if (!event || typeof event !== 'string') {
    return res.status(400).json({ error: 'Invalid event' });
  }
  
  // Sanitize data
  const sanitizedData = sanitizeInput(data);
  
  // Rate limiting
  // Authentication
  // Store data securely
});
```

### 3. Implement Rate Limiting

Protect your analytics endpoint from abuse:

```javascript
const rateLimit = require('express-rate-limit');

const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.post('/analytics', analyticsLimiter, handler);
```

### 4. Authenticate Requests

Use API keys or tokens to authenticate requests:

```tsx
// Client-side: Include token in headers (via custom fetch)
const analytics = useAnalytics({
  config: {
    apiEndpoint: 'https://api.yourcompany.com/analytics',
    // Use custom fetch to add auth headers
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${process.env.REACT_APP_ANALYTICS_TOKEN}`
        }
      });
    }
  }
});
```

### 5. Handle User Consent

Always obtain user consent before tracking:

```tsx
import { useLocationConsent } from 'user-analytics-tracker';

function App() {
  const { hasConsent, requestConsent } = useLocationConsent();
  
  if (!hasConsent) {
    return <ConsentDialog onAccept={requestConsent} />;
  }
  
  return <YourApp />;
}
```

### 6. Use Essential Mode

Minimize data collection to reduce privacy concerns:

```tsx
const analytics = useAnalytics({
  config: {
    apiEndpoint: 'https://api.yourcompany.com/analytics',
    fieldStorage: {
      ipLocation: { mode: 'essential' },
      deviceInfo: { mode: 'essential' },
      location: { mode: 'essential' }
    }
  }
});
```

## For Contributors

### 1. Never Commit Secrets

**Before committing, check for secrets:**

```bash
# Check for secrets in your changes
git diff | grep -i "password\|secret\|token\|key\|credential"

# Check git history for secrets (if needed)
git log --all --full-history --source -- "*secret*"
```

### 2. Use Environment Variables

```typescript
// ❌ Bad - Hardcoded
const API_KEY = 'sk_live_1234567890';

// ✅ Good - Environment variable
const API_KEY = process.env.API_KEY;
```

### 3. Review Dependencies

Before adding dependencies:

```bash
# Check for vulnerabilities
npm audit

# Review package
npm view <package-name>
```

### 4. Validate Inputs

Always validate user inputs:

```typescript
function validateEventName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  // Only allow alphanumeric, underscore, hyphen
  return /^[a-zA-Z0-9_-]+$/.test(name);
}
```

### 5. Sanitize Outputs

Sanitize data before sending:

```typescript
function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .trim()
    .substring(0, 1000); // Limit length
}
```

## Security Checklist

### Before Publishing

- [ ] No secrets in code
- [ ] No secrets in git history
- [ ] Dependencies are secure (`npm audit`)
- [ ] Only necessary files published (check `package.json` → `files`)
- [ ] No `.env` files in package
- [ ] HTTPS endpoints in examples
- [ ] Security warnings in documentation

### Before Merging PRs

- [ ] Code review for security issues
- [ ] No secrets in PR
- [ ] Dependencies reviewed
- [ ] Input validation implemented
- [ ] Security tests pass

## Reporting Security Issues

**Never report security vulnerabilities in public issues.**

See [SECURITY.md](../SECURITY.md) for reporting procedures.

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [GitHub Security](https://docs.github.com/en/code-security)

