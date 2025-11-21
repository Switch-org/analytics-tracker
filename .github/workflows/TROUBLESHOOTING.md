# Troubleshooting: Package Not Updated

## Issue: Workflow Runs But Package Doesn't Update

If your GitHub Actions workflow runs successfully but the package version doesn't update on npm, here are the most common causes:

## 🔍 Common Causes

### 1. Commit Messages Not in Conventional Format

**Problem**: Semantic-release requires commits to follow [Conventional Commits](https://www.conventionalcommits.org/) format.

**❌ Wrong Format:**
```
[feat] update README
[fix] update workflows
[feat] add new feature
```

**✅ Correct Format:**
```
feat: update README
fix: update workflows
feat: add new feature
```

**Solution**: Use proper conventional commit format:
- `feat: description` - New feature (minor version bump)
- `fix: description` - Bug fix (patch version bump)
- `feat!: description` - Breaking change (major version bump)
- `docs: description` - Documentation only (no release)
- `chore: description` - Maintenance (no release)

### 2. No New Commits Since Last Release

**Problem**: Semantic-release only creates a release if there are new commits that trigger a version bump.

**Check**: 
```bash
# See recent commits
git log --oneline -10

# Check if semantic-release sees any releasable commits
npm run release -- --dry-run
```

**Solution**: Make a new commit with proper format:
```bash
git commit -m "feat: add new feature"
git push origin main
```

### 3. All Commits Are "docs" or "chore"

**Problem**: Documentation and chore commits don't trigger releases by default.

**Solution**: Make a commit that triggers a release:
```bash
# This will trigger a patch release
git commit -m "fix: resolve issue"

# This will trigger a minor release
git commit -m "feat: add new feature"
```

### 4. Version Already Exists on npm

**Problem**: The version semantic-release wants to publish already exists on npm.

**Check**:
```bash
npm view @atif910/analytics-tracker versions --json
```

**Solution**: Make a new commit that triggers a different version bump, or manually bump version.

### 5. Semantic-Release Skipped Release

**Problem**: Semantic-release analyzed commits and determined no release is needed.

**Check GitHub Actions logs** for messages like:
- "There are no relevant changes, so no new version is released"
- "No release will be published"

**Solution**: Make a commit that triggers a release:
```bash
git commit -m "feat: add new feature"  # Triggers minor bump
# or
git commit -m "fix: resolve bug"        # Triggers patch bump
```

## 🛠️ How to Fix

### Option 1: Make a New Commit (Recommended)

Create a new commit with proper conventional commit format:

```bash
# For a patch release (0.1.0 → 0.1.1)
git commit -m "fix: update package configuration"

# For a minor release (0.1.0 → 0.2.0)
git commit -m "feat: add new functionality"

# For a major release (0.1.0 → 1.0.0)
git commit -m "feat!: breaking change"
```

Then push:
```bash
git push origin main
```

### Option 2: Fix Commit History (Advanced)

If you want to fix existing commits, you can use interactive rebase:

```bash
# Rebase last 5 commits
git rebase -i HEAD~5

# Change commit messages from [feat] to feat:
# Change: [feat] update README
# To:     feat: update README
```

**⚠️ Warning**: Only do this if you haven't pushed to main yet, or if you're okay with force-pushing.

### Option 3: Manual Release (Quick Fix)

If you need to publish immediately:

```bash
# Bump version manually
npm version patch   # 0.1.0 → 0.1.1
# or
npm version minor   # 0.1.0 → 0.2.0

# Push version commit
git push origin main --follow-tags

# Publish manually
npm publish --access public
```

## 🔍 Debugging Steps

### 1. Check What Semantic-Release Sees

Run semantic-release locally to see what it would do:

```bash
# Install semantic-release globally (if needed)
npm install -g semantic-release

# Run in dry-run mode
npm run release -- --dry-run
```

### 2. Check Commit History

```bash
# See recent commits
git log --oneline -10

# Check if commits match conventional format
git log --format="%s" -10 | grep -E "^(feat|fix|perf|revert|docs|style|chore|refactor|test|build|ci)(\(.+\))?:"
```

### 3. Check GitHub Actions Logs

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click on the latest workflow run
4. Look for semantic-release output
5. Check for messages about "no release" or "skipped"

### 4. Verify npm Package

```bash
# Check current version on npm
npm view @atif910/analytics-tracker version

# Check all versions
npm view @atif910/analytics-tracker versions --json

# Check package info
npm view @atif910/analytics-tracker
```

## 📝 Commit Format Reference

### Format: `type(scope): description`

**Types that trigger releases:**
- `feat:` - New feature → **Minor version** (0.1.0 → 0.2.0)
- `fix:` - Bug fix → **Patch version** (0.1.0 → 0.1.1)
- `perf:` - Performance improvement → **Patch version**
- `revert:` - Revert previous commit → **Patch version**

**Types that DON'T trigger releases:**
- `docs:` - Documentation only
- `style:` - Code style (formatting, etc.)
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring (no behavior change)
- `test:` - Adding/updating tests
- `build:` - Build system changes
- `ci:` - CI configuration changes

**Breaking changes:**
- `feat!: description` - Breaking feature → **Major version** (0.1.0 → 1.0.0)
- `fix!: description` - Breaking fix → **Major version**
- Or add `BREAKING CHANGE:` in commit body

### Examples

```bash
# ✅ Correct - will trigger minor release
git commit -m "feat: add device detection"

# ✅ Correct - will trigger patch release
git commit -m "fix: resolve network detection bug"

# ✅ Correct - will trigger major release
git commit -m "feat!: change API structure"

# ❌ Wrong - won't trigger release
git commit -m "[feat] add device detection"

# ❌ Wrong - won't trigger release
git commit -m "feat add device detection"  # Missing colon

# ❌ Wrong - won't trigger release
git commit -m "Added device detection"  # No type prefix
```

## 🚀 Quick Fix Checklist

- [ ] Check commit messages use proper format (`feat:`, `fix:`, etc.)
- [ ] Verify you're pushing to `main` or `master` branch
- [ ] Check GitHub Actions logs for semantic-release output
- [ ] Make a new commit with proper format if needed
- [ ] Verify NPM_TOKEN secret is set correctly
- [ ] Check if version already exists on npm
- [ ] Run `npm run release -- --dry-run` locally to test

## 💡 Pro Tips

1. **Use commitizen**: Install `commitizen` to help format commits correctly
2. **Use a pre-commit hook**: Validate commit messages before committing
3. **Check logs first**: Always check GitHub Actions logs to see why release was skipped
4. **Test locally**: Run `npm run release -- --dry-run` before pushing

---

If you're still having issues, check the GitHub Actions logs for detailed error messages from semantic-release.

