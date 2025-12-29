# Publishing Guide - How to Deploy to npm

This guide explains how to push your code and automatically deploy it to npm using GitHub Actions and semantic-release.

## 🚀 Quick Start

### Step 1: Ensure NPM_TOKEN is Set

Before pushing, make sure you have the `NPM_TOKEN` secret configured in GitHub:

1. Go to your GitHub repository: `https://github.com/switch-org/analytics-tracker`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Verify `NPM_TOKEN` exists (if not, see [Setup Guide](#setup-npm-token) below)

### Step 2: Commit Your Changes

Use [Conventional Commits](https://www.conventionalcommits.org/) format for your commit messages:

```bash
# For a new feature (bumps minor version: 2.0.0 → 2.1.0)
git commit -m "feat: migrate IP geolocation to ipwho.is API"

# For a bug fix (bumps patch version: 2.0.0 → 2.0.1)
git commit -m "fix: resolve timezone type error in location detector"

# For a breaking change (bumps major version: 2.0.0 → 3.0.0)
git commit -m "feat!: remove deprecated API" 
# OR
git commit -m "feat: new API

BREAKING CHANGE: old API removed"

# For documentation only (no release)
git commit -m "docs: update upgrade guide"

# For maintenance (no release)
git commit -m "chore: update dependencies"
```

### Step 3: Push to Main/Master Branch

```bash
# Push to main branch
git push origin main

# Or if your default branch is master
git push origin master
```

### Step 4: Automatic Deployment

Once you push, GitHub Actions will automatically:

1. ✅ Run tests and build
2. ✅ Analyze your commit messages
3. ✅ Determine version bump (patch/minor/major)
4. ✅ Update CHANGELOG.md
5. ✅ Publish to npm
6. ✅ Create GitHub release
7. ✅ Create git tag
8. ✅ Commit CHANGELOG.md back to repo

**That's it!** Your package will be published to npm automatically.

## 📋 Complete Workflow Example

Here's a complete example for your current changes:

```bash
# 1. Check current status
git status

# 2. Stage your changes
git add .

# 3. Commit with conventional commit message
git commit -m "feat: migrate IP geolocation to ipwho.is API with dynamic key storage"

# 4. Push to main branch
git push origin main

# 5. Watch the deployment
# Go to: https://github.com/switch-org/analytics-tracker/actions
# You'll see the "Release" workflow running
```

## 🔍 Monitoring the Deployment

### Check GitHub Actions

1. Go to your repository on GitHub
2. Click on the **Actions** tab
3. You'll see the "Release" workflow running
4. Click on it to see detailed logs

### What to Look For

✅ **Success indicators:**
- "Release" job completes successfully
- "Published to npm" message in logs
- New version appears on npm: https://www.npmjs.com/package/user-analytics-tracker
- GitHub release created
- CHANGELOG.md updated

❌ **If it fails:**
- Check the error message in the workflow logs
- Common issues:
  - Missing or invalid `NPM_TOKEN`
  - Version already exists on npm
  - npm authentication issues
  - Build/test failures

## 📝 Commit Message Format

The version bump is determined by your commit message:

| Commit Type | Version Bump | Example |
|------------|--------------|---------|
| `feat:` | Minor (2.0.0 → 2.1.0) | `feat: add new feature` |
| `fix:` | Patch (2.0.0 → 2.0.1) | `fix: resolve bug` |
| `feat!:` or `BREAKING CHANGE:` | Major (2.0.0 → 3.0.0) | `feat!: breaking change` |
| `docs:` | None | `docs: update README` |
| `chore:` | None | `chore: update deps` |
| `style:` | None | `style: format code` |
| `refactor:` | None | `refactor: improve code` |
| `test:` | None | `test: add tests` |

### Multiple Commits

If you have multiple commits, semantic-release will:
- Analyze all commits since the last release
- Determine the highest version bump needed
- Create a single release with all changes

## 🔧 Setup NPM_TOKEN

If you haven't set up the NPM_TOKEN yet:

### Step 1: Create npm Access Token

1. Go to [npmjs.com](https://www.npmjs.com/) and log in
2. Click your profile → **Access Tokens**
3. Click **Generate New Token**
4. **Important**: Select **"Automation"** token type (NOT Classic)
5. Name it: `github-actions`
6. Set expiration (or "No expiration")
7. Click **Generate Token**
8. **Copy the token immediately** (starts with `npm_...`)

### Step 2: Add to GitHub Secrets

1. Go to: `https://github.com/switch-org/analytics-tracker/settings/secrets/actions`
2. Click **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: Paste your npm token
5. Click **Add secret**

### Step 3: Verify Setup

The next time you push, the workflow will verify the token automatically.

## 🎯 Current Changes - Ready to Deploy

For your current changes (IP geolocation migration), here's what to do:

```bash
# Commit your changes
git add .
git commit -m "feat: migrate IP geolocation to ipwho.is API with dynamic key storage

- Migrated from ip-api.com to ipwho.is API
- Added dynamic key storage for all API response fields
- Enhanced IPLocation type with new fields (continent, flag, connection, timezone)
- Maintained full backward compatibility
- Updated documentation and upgrade guide"

# Push to trigger deployment
git push origin main
```

This will:
- Bump version to **2.1.0** (minor version bump for new feature)
- Publish to npm
- Create GitHub release
- Update CHANGELOG.md

## 🚨 Troubleshooting

### "NPM_TOKEN not found"

**Solution:**
1. Go to GitHub repo → Settings → Secrets → Actions
2. Add `NPM_TOKEN` secret with your npm Automation token
3. See [Setup NPM_TOKEN](#setup-npm-token) above

### "npm authentication failed"

**Solution:**
1. Verify token is valid: https://www.npmjs.com/settings/yourusername/tokens
2. Check token type is **"Automation"** (not Classic)
3. Regenerate token if needed
4. Update GitHub Secret with new token

### "Version already exists"

**Solution:**
- Semantic-release detected a version that already exists on npm
- This usually means you need to bump the version manually or use a different commit type
- Check: https://www.npmjs.com/package/user-analytics-tracker?activeTab=versions

### "No release created"

**Possible reasons:**
- Commit message doesn't follow conventional format
- Only `docs:` or `chore:` commits (these don't trigger releases)
- No changes detected since last release

**Solution:**
- Use `feat:` or `fix:` commit messages to trigger releases
- Or manually trigger: `npm version patch/minor/major` then push

### Manual Release (if needed)

If automatic release fails, you can publish manually:

```bash
# Update version
npm version patch   # 2.0.0 → 2.0.1
# OR
npm version minor   # 2.0.0 → 2.1.0
# OR
npm version major   # 2.0.0 → 3.0.0

# Build
npm run build

# Publish
npm publish --access public

# Push version commit and tag
git push origin main --follow-tags
```

## 📚 Additional Resources

- [Semantic Release Documentation](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)

## ✅ Checklist Before Pushing

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npm run type-check`
- [ ] NPM_TOKEN is set in GitHub Secrets
- [ ] Commit message follows conventional format
- [ ] Ready to push to main/master branch

---

**Ready to deploy?** Just commit and push! 🚀

```bash
git add .
git commit -m "feat: your feature description"
git push origin main
```

