# Security Guidelines for Contributors

## 🔒 Security Checklist

Before submitting a PR, ensure:

- [ ] No secrets, API keys, or tokens are committed
- [ ] No hardcoded credentials in code
- [ ] Environment variables are used for sensitive data
- [ ] Dependencies are up-to-date and secure
- [ ] Input validation is implemented
- [ ] Output is sanitized
- [ ] Security tests are included (if applicable)

## 🚫 Never Commit

- API keys or tokens
- Passwords or credentials
- Private keys (.pem, .key files)
- Environment files (.env, .env.local)
- npm tokens
- GitHub tokens
- Database credentials
- AWS/cloud credentials

## ✅ Safe to Commit

- Public configuration
- Documentation
- Test fixtures (without real credentials)
- Public API endpoints (without keys)
- Example code (with placeholder values)

## 🔍 Pre-Commit Checks

Run these before committing:

```bash
# Check for secrets
git diff | grep -i "password\|secret\|token\|key\|credential"

# Check for .env files
git status | grep "\.env"

# Run security audit
npm audit

# Check for exposed secrets in history (if needed)
git log --all --full-history --source -- "*secret*" "*key*" "*token*"
```

## 🛡️ GitHub Actions Security

- Secrets are stored in GitHub Secrets (Settings → Secrets and variables → Actions)
- Never log secrets in workflow output
- Use `${{ secrets.SECRET_NAME }}` syntax
- Restrict workflow permissions to minimum required

## 📦 npm Package Security

- Only publish necessary files (see `package.json` → `files`)
- No secrets in published package
- Review `dist/` folder before publishing
- Use `npm pack` to preview what will be published

## 🔐 Dependency Security

- Regularly run `npm audit`
- Update dependencies with `npm update`
- Review security advisories: https://github.com/advisories
- Use `npm audit fix` for automatic fixes

## 🐛 Reporting Security Issues

See [SECURITY.md](../SECURITY.md) for reporting vulnerabilities.

**Never** report security issues in public GitHub issues.

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [GitHub Security](https://docs.github.com/en/code-security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

