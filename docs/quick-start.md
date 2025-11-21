# Quick Start Guide

This guide will help you **run**, **test**, and **publish** your `@atif/analytics-tracker` package.

## 🚀 Step 1: Run/Develop Your Package Locally

Since this is a **library** (not an app), you'll work on it by building and testing it locally.

### Build the Package

```bash
# Build the package (creates dist/ folder with compiled code)
npm run build

# Build in watch mode (rebuilds automatically when you change files)
npm run build:watch

# Or use the dev alias
npm run dev
```

After building, you'll have:
- `dist/index.cjs.js` - CommonJS bundle
- `dist/index.esm.js` - ES Module bundle
- `dist/index.d.ts` - TypeScript definitions (ESM)
- `dist/index.d.cts` - TypeScript definitions (CJS)

### Type Checking

```bash
# Check TypeScript types without building
npm run type-check
```

### Linting & Formatting

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## 🧪 Step 2: Test Your Package

### Run Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Writing New Tests

Tests are located in `src/tests/`. The project uses **Vitest** for testing. Example test structure:

```typescript
import { describe, it, expect } from 'vitest';
import { NetworkDetector } from '../detectors/network-detector';

describe('NetworkDetector', () => {
  it('should detect network type', () => {
    const network = NetworkDetector.detect();
    expect(network).toHaveProperty('type');
  });
});
```

## 📦 Step 3: Test Package Locally Before Publishing

### Option 1: npm link (Recommended for Local Testing)

1. **In your package directory** (analytics-tracker):
   ```bash
   npm link
   ```

2. **In your test React app**:
   ```bash
   npm link @atif/analytics-tracker
   ```

3. **Use in your test app**:
   ```tsx
   import { useAnalytics } from '@atif/analytics-tracker';
   
   function App() {
     const { deviceInfo, networkInfo } = useAnalytics();
     return <div>Device: {deviceInfo?.deviceBrand}</div>;
   }
   ```

4. **To unlink**:
   ```bash
   # In your test app
   npm unlink @atif/analytics-tracker
   
   # In package directory
   npm unlink
   ```

### Option 2: npm pack (Test the Actual Package)

```bash
# Create a tarball (.tgz file) like npm would publish
npm pack

# This creates: atif-analytics-tracker-0.1.0.tgz

# In a test React app, install it:
npm install /path/to/analytics-tracker/atif-analytics-tracker-0.1.0.tgz
```

## 🌐 Step 4: Make It Live (Publish to npm)

### Prerequisites

1. **npm Account**: You need an npm account with access to the `@atif` scope
2. **Login to npm**:
   ```bash
   npm login
   # Enter your username, password, and email
   ```

3. **Verify login**:
   ```bash
   npm whoami
   ```

### Pre-Publish Checklist

Before publishing, ensure everything is ready:

```bash
# 1. Clean previous builds
npm run clean

# 2. Install dependencies (if needed)
npm install

# 3. Run linting
npm run lint

# 4. Type check
npm run type-check

# 5. Run tests
npm test

# 6. Build the package
npm run build

# 7. Verify build output
ls dist/
# Should see: index.cjs.js, index.esm.js, index.d.ts, index.d.cts
```

### Publish Method 1: Automatic (Recommended)

This uses **semantic-release** with GitHub Actions for automatic versioning and publishing.

#### Setup

1. **Set up GitHub Secrets** (if using GitHub Actions):
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add `NPM_TOKEN` with your npm access token
   - Get token at: https://www.npmjs.com/settings/YOUR_USERNAME/tokens

2. **Commit changes with conventional commits**:
   ```bash
   git add .
   git commit -m "feat: add new feature"        # Minor version bump
   git commit -m "fix: resolve bug"             # Patch version bump
   git commit -m "feat!: breaking change"       # Major version bump
   ```

3. **Push to main**:
   ```bash
   git push origin main
   ```

4. **GitHub Actions will automatically**:
   - Run tests
   - Build the package
   - Determine version (based on commit messages)
   - Generate changelog
   - Publish to npm
   - Create GitHub release
   - Create git tag

### Publish Method 2: Manual

For manual control:

1. **Update version**:
   ```bash
   npm version patch   # 0.1.0 → 0.1.1 (bug fixes)
   npm version minor   # 0.1.0 → 0.2.0 (new features)
   npm version major   # 0.1.0 → 1.0.0 (breaking changes)
   ```
   
   Or edit `package.json` manually and commit.

2. **Update CHANGELOG.md**:
   Manually document your changes.

3. **Dry run** (test without publishing):
   ```bash
   npm publish --dry-run
   ```

4. **Publish to npm**:
   ```bash
   npm publish --access public
   ```

5. **Create git tag** (if not done by npm version):
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

6. **Create GitHub Release**:
   - Go to GitHub → Releases → Draft a new release
   - Select the tag
   - Add release notes
   - Publish

### Verify Publication

```bash
# Check on npm website
# Visit: https://www.npmjs.com/package/@atif/analytics-tracker

# Or via CLI
npm view @atif/analytics-tracker
```

### Install Your Published Package

Once published, anyone can install it:

```bash
npm install @atif/analytics-tracker react react-dom
```

## 🔄 Complete Development Workflow

Here's a typical workflow:

```bash
# 1. Make changes to your code
# Edit files in src/

# 2. Run tests (watch mode)
npm run test:watch

# 3. Build (watch mode in another terminal)
npm run build:watch

# 4. Type check
npm run type-check

# 5. Lint and fix
npm run lint:fix

# 6. Format code
npm run format

# 7. When ready, run full test suite
npm test

# 8. Build for production
npm run build

# 9. Commit with conventional commit message
git add .
git commit -m "feat: add amazing feature"

# 10. Push (triggers automatic publish if GitHub Actions is set up)
git push origin main

# OR manually publish
npm version patch
npm publish --access public
```

## 📝 Common Commands Summary

| Command | Description |
|---------|-------------|
| `npm run build` | Build the package once |
| `npm run build:watch` | Build in watch mode |
| `npm run dev` | Alias for `build:watch` |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Check for linting errors |
| `npm run lint:fix` | Auto-fix linting errors |
| `npm run format` | Format code |
| `npm run type-check` | Check TypeScript types |
| `npm run clean` | Remove dist/ folder |
| `npm run docs` | Generate documentation |
| `npm publish --dry-run` | Test publish without actually publishing |
| `npm publish --access public` | Publish to npm |

## 🆘 Troubleshooting

### Build fails
```bash
# Clean and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Tests fail
```bash
# Check test files are in src/tests/
# Verify vitest.config.ts is correct
npm test
```

### Can't publish
```bash
# Check you're logged in
npm whoami

# Check you have access to @atif scope
npm login

# Verify publishConfig in package.json
# Should have: "publishConfig": { "access": "public" }
```

### Package not found after publishing
- Wait a few minutes (npm CDN cache)
- Check package name matches exactly: `@atif/analytics-tracker`
- Verify scope access in npm account settings

## 🎯 Next Steps

1. ✅ Build your package: `npm run build`
2. ✅ Test it: `npm test`
3. ✅ Test locally with `npm link`
4. ✅ Publish: `npm publish --access public`
5. ✅ Install it in a real project and verify it works

---

For more details, see:
- [Main README](../README.md) - Package documentation
- [Usage Guide](./usage-guide.md) - Complete usage guide
- [Publishing Guide](./publishing.md) - Detailed publishing guide
- [Package Structure](./package-structure.md) - Codebase structure
- [CHANGELOG](../CHANGELOG.md) - Version history

