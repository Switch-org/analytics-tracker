# GitHub Actions Setup Guide

This guide will help you set up automatic npm publishing via GitHub Actions.

## 📋 Prerequisites

1. **npm Account**: You need an npm account with access to the `@atif910` scope
2. **npm Access Token**: Create an npm access token with publish permissions

## 🔑 Step 1: Create npm Access Token

### Important: Token Type and Permissions

You need an **Automation** token with **publish** permissions:

1. Go to [npmjs.com](https://www.npmjs.com/) and log in
2. Click on your profile picture (top right) → **Access Tokens**
3. Click **Generate New Token**
4. **Select "Automation" token type** (NOT "Classic")
   - **Automation tokens** are required for CI/CD and semantic-release
   - These tokens are designed for automated publishing
5. **Token name**: `github-actions` (or any name you prefer)
6. **Expiration**: Choose based on your preference
   - For long-term: "No expiration"
   - For security: Set expiration date
7. Click **Generate Token**
8. **Copy the token immediately** (starts with `npm_...`)
   - ⚠️ **Important**: You won't be able to see this token again!
   - Save it securely until you add it to GitHub Secrets

### Two-Factor Authentication (2FA)

If you have 2FA enabled on your npm account:

- **Required setting**: Set 2FA level to **"Authorization only"**
- ❌ **NOT**: "Authorization and writes" (this won't work with semantic-release)
- To change: npmjs.com → Profile → Two Factor Authentication → Change level

### Verify Token Permissions

After creating the token, verify it has the right permissions:

```bash
# Test token locally (optional)
export NPM_TOKEN="npm_your_token_here"
echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc
npm whoami  # Should show your npm username
```

## 🔐 Step 2: Add NPM_TOKEN to GitHub Secrets

1. Go to your GitHub repository: `https://github.com/switch-org/analytics-tracker`
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm access token
6. Click **Add secret**

## ✅ Step 3: Verify Setup

Once the secret is added, the GitHub Actions will automatically:

1. **On every push/PR** → Run CI workflow (test, lint, build)
2. **On push to main/master** → Run Release workflow which:
   - Runs tests
   - Builds the package
   - Determines version based on commit messages
   - Publishes to npm
   - Creates GitHub release
   - Updates CHANGELOG.md
   - Creates git tag

## 📝 Commit Message Format

To trigger automatic releases, use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add new feature` → Minor version bump (0.1.0 → 0.2.0)
- `fix: resolve bug` → Patch version bump (0.1.0 → 0.1.1)
- `feat!: breaking change` or `BREAKING CHANGE:` → Major version bump (0.1.0 → 1.0.0)
- `docs: update README` → No release (documentation only)
- `chore: update dependencies` → No release (maintenance only)

## 🚀 How It Works

### CI Workflow (`ci.yml`)
- Runs on: push and pull requests
- Tests on: Node.js 18.x and 20.x
- Steps:
  1. Install dependencies
  2. Run linter
  3. Type check
  4. Run tests
  5. Build package
  6. Verify build output

### Release Workflow (`release.yml`)
- Runs on: push to `main` or `master` branch
- Steps:
  1. Checkout code
  2. Setup Node.js
  3. Install dependencies
  4. Run tests
  5. Build package
  6. Run semantic-release which:
     - Analyzes commits
     - Determines version bump
     - Generates changelog
     - Publishes to npm
     - Creates GitHub release
     - Creates git tag
     - Commits CHANGELOG.md back to repo

## 🔍 Troubleshooting

### Invalid npm token error

If you see `EINVALIDNPMTOKEN` or `401 Unauthorized`:

1. **Check token type**:
   - ✅ Must be **Automation token** (not Classic token)
   - ❌ Classic tokens don't work with semantic-release

2. **Check token permissions**:
   - ✅ Token must have **publish** permissions
   - ✅ Must have access to `@atif910` scope

3. **Check 2FA settings** (if enabled):
   - ✅ Set to **"Authorization only"**
   - ❌ NOT "Authorization and writes"

4. **Verify token in GitHub Secrets**:
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Verify `NPM_TOKEN` secret exists
   - Ensure it's the exact token value (starts with `npm_`)
   - No extra spaces or quotes

5. **Test token locally**:
   ```bash
   export NPM_TOKEN="your_token_here"
   echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc
   npm whoami  # Should show your username
   npm publish --dry-run  # Test publish (won't actually publish)
   ```

6. **Regenerate token if needed**:
   - Delete old token from npmjs.com
   - Create new Automation token
   - Update GitHub Secret with new token

### Release not triggering

1. **Check branch**: Ensure you're pushing to `main` or `master`
2. **Check commit format**: Use conventional commit format
3. **Check NPM_TOKEN**: Verify the secret is set correctly
4. **Check Actions tab**: View workflow runs in GitHub Actions tab

### Publishing fails

1. **Check npm permissions**: Ensure your token has publish access
2. **Check package name**: Verify `@atif910/analytics-tracker` scope access
3. **Check version**: Ensure version doesn't already exist on npm
4. **Check logs**: View detailed logs in GitHub Actions
5. **Check token validity**: Token might be expired, regenerate if needed

### Manual Release (if needed)

If you need to publish manually:

```bash
npm version patch   # 0.1.0 → 0.1.1
npm publish --access public
```

## 📚 Resources

- [Semantic Release](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [npm Publishing](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)

