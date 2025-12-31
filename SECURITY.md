# Security Policy

## Supported Versions

We actively support and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | :white_check_mark: |
| 2.x.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

### How to Report

If you discover a security vulnerability, please report it responsibly:

1. **Email**: Send details to [security@switch.org](mailto:security@switch.org)
   - Include a clear description of the vulnerability
   - Provide steps to reproduce (if applicable)
   - Include potential impact assessment

2. **GitHub Security Advisory**: Use GitHub's private security advisory feature
   - Go to: https://github.com/switch-org/analytics-tracker/security/advisories
   - Click "New draft security advisory"
   - Fill in the vulnerability details

### What to Include

- Type of vulnerability (XSS, injection, data exposure, etc.)
- Affected component/functionality
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity (typically 7-30 days)

### Disclosure Policy

- We will acknowledge receipt of your report within 48 hours
- We will keep you informed of the progress toward fixing the vulnerability
- We will notify you when the vulnerability has been fixed
- We will credit you in the security advisory (if you wish)

## Security Best Practices

### For Users

1. **Keep dependencies updated**: Regularly update to the latest version
2. **Review configuration**: Ensure your `apiEndpoint` points to your own secure backend
3. **Use HTTPS**: Always use HTTPS endpoints for production
4. **Validate data**: Validate all analytics data on your backend
5. **Rate limiting**: Implement rate limiting on your analytics endpoint
6. **Authentication**: Secure your analytics endpoint with proper authentication

### For Contributors

1. **Never commit secrets**: Use environment variables or GitHub Secrets
2. **Review dependencies**: Check for vulnerabilities before adding new dependencies
3. **Follow secure coding practices**: Validate inputs, sanitize outputs
4. **Test security**: Include security tests in your PRs

## Known Security Considerations

### Client-Side Library

This is a **client-side library** that runs in users' browsers. Important considerations:

- **No server-side secrets**: This library does not and should not contain any server-side secrets
- **Public code**: All code is public and visible to users
- **Backend validation required**: Always validate and sanitize data on your backend
- **HTTPS only**: Use HTTPS endpoints in production

### Data Privacy

- **User consent**: Always obtain user consent before tracking location data
- **GDPR compliance**: Ensure your implementation complies with GDPR and other privacy regulations
- **Data minimization**: Use essential mode to minimize data collection
- **Secure transmission**: All data should be transmitted over HTTPS

## Security Updates

Security updates are released as:
- **Patch versions** (x.x.1, x.x.2) for critical security fixes
- **Minor versions** (x.1.0) for security improvements
- **Major versions** (1.0.0) for breaking security changes

Subscribe to GitHub releases to be notified of security updates.

## Security Audit

We regularly audit:
- Dependencies for known vulnerabilities
- Code for security best practices
- GitHub Actions workflows for security
- Published package contents

## Contact

For security concerns:
- **Email**: [security@switch.org](mailto:security@switch.org)
- **GitHub Security Advisory**: https://github.com/switch-org/analytics-tracker/security/advisories

---

**Thank you for helping keep this project secure!**

