# Publishing Guide

This guide explains how to publish `user-analytics-tracker` to npm.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Publishing Methods](#publishing-methods)
4. [Pre-Publish Checklist](#pre-publish-checklist)
5. [Troubleshooting](#troubleshooting)
6. [Version Management](#version-management)
7. [Best Practices](#best-practices)
8. [Security](#security)
9. [Resources](#resources)

## Prerequisites

1. **npm Account**: You need an npm account with access to the `@atif` scope
2. **NPM_TOKEN**: Create an npm access token with publish permissions
3. **GitHub Token**: For semantic-release automation

## Initial Setup

### 1. Login to npm

```bash
npm login
# Enter your credentials
# Username: your-username
# Password: your-password
# Email: your-email@example.com
```

### 2. Verify npm Account

```bash
npm whoami
```

### 3. Set npm Scope Access

For scoped packages (`@atif/...`), ensure public access:

```bash
npm publish --access public
```

Or configure in `package.json`:

```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

## Publishing Methods

### Method 1: Automatic Release (Recommended)

Uses semantic-release with GitHub Actions for automated versioning and publishing.

#### Setup GitHub Secrets

1. Go to your GitHub repository settings
2. Navigate to Secrets and variables → Actions
3. Add the following secrets:
   - `NPM_TOKEN`: Your npm access token (starts with `npm_`)
   - `GITHUB_TOKEN`: Automatically provided by GitHub Actions

#### Workflow

1. Make changes to the code
2. Commit following [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   git commit -m "docs: update README"
   ```
3. Push to `main` or `master` branch:
   ```bash
   git push origin main
   ```
4. GitHub Actions will:
   - Run tests
   - Build the package
   - Determine version bump (patch/minor/major)
   - Generate changelog
   - Publish to npm
   - Create GitHub release
   - Create git tag

#### Version Bumps

- `feat:` → Minor version bump (0.1.0 → 0.2.0)
- `fix:` → Patch version bump (0.1.0 → 0.1.1)
- `BREAKING CHANGE:` or `feat!:` → Major version bump (0.1.0 → 1.0.0)

### Method 2: Manual Release

For manual control over versioning and publishing.

#### 1. Update Version

```bash
# Patch version (0.1.0 → 0.1.1)
npm version patch

# Minor version (0.1.0 → 0.2.0)
npm version minor

# Major version (0.1.0 → 1.0.0)
npm version major
```

Or edit `package.json` directly and commit:

```json
{
  "version": "0.2.0"
}
```

#### 2. Update CHANGELOG

Manually update `CHANGELOG.md` with changes.

#### 3. Build Package

```bash
npm run build
```

#### 4. Test Build

```bash
# Verify build artifacts exist
ls dist/

# Should see:
# - index.cjs.js
# - index.esm.js
# - index.d.ts
# - index.d.cts
```

#### 5. Publish to npm

```bash
# Dry run first (won't actually publish)
npm publish --dry-run

# Actually publish
npm publish --access public
```

#### 6. Create Git Tag

```bash
git tag v0.2.0
git push origin v0.2.0
```

#### 7. Create GitHub Release

1. Go to GitHub repository
2. Navigate to Releases → Draft a new release
3. Select the tag
4. Add release notes
5. Publish release

## Pre-Publish Checklist

Before publishing, ensure:

- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] Version is updated
- [ ] CHANGELOG.md is updated
- [ ] README.md is accurate
- [ ] License file exists
- [ ] No sensitive data in code
- [ ] `.gitignore` and `.npmignore` are correct

## Troubleshooting

### "You do not have permission to publish"

**Solution**: Ensure you're logged in and have access to the `@atif` scope.

```bash
npm whoami
npm login
```

### "Package name already exists"

**Solution**: Either:
1. Use a different package name, or
2. Update the version number

### "Cannot publish private packages to public registry"

**Solution**: Add `publishConfig` to `package.json`:

```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

Or use the `--access public` flag:

```bash
npm publish --access public
```

### Semantic Release Not Triggering

**Check**:
1. GitHub Actions secrets are set (`NPM_TOKEN`, `GITHUB_TOKEN`)
2. Workflow file is in `.github/workflows/`
3. Commits follow Conventional Commits format
4. You're pushing to `main` or `master` branch

### Build Errors

**Solution**: Ensure all dependencies are installed:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Version Management

### Beta Releases

To publish a beta version:

```bash
npm version prerelease --preid=beta
npm publish --tag beta --access public
```

Users install with:
```bash
npm install user-analytics-tracker@beta
```

### Unpublishing (Emergency Only)

⚠️ **Warning**: Only unpublish within 72 hours of publishing. After that, deprecate instead.

```bash
# Unpublish specific version
npm unpublish user-analytics-tracker@0.1.0

# Deprecate instead (recommended)
npm deprecate user-analytics-tracker@0.1.0 "Use version 0.2.0 instead"
```

## Best Practices

1. **Always test before publishing**: Run all tests and build locally
2. **Follow semantic versioning**: Breaking changes = major, new features = minor, fixes = patch
3. **Use conventional commits**: Makes semantic-release work correctly
4. **Update CHANGELOG**: Document all changes
5. **Tag releases**: Create git tags for all published versions
6. **Monitor issues**: After publishing, monitor npm and GitHub for issues

## Security

- Never commit npm tokens or secrets
- Use environment variables or GitHub Secrets
- Regularly audit dependencies: `npm audit`
- Keep dependencies up to date: `npm outdated`

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Release](https://semantic-release.gitbook.io/)

---

---

For more information, see:
- [Main README](../README.md) - Package documentation
- [Usage Guide](./usage-guide.md) - Complete usage guide
- [Quick Start](./quick-start.md) - Getting started guide
- [Package Structure](./package-structure.md) - Codebase structure

Happy Publishing! 🚀

