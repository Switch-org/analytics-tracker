# GitHub Secrets Setup

## Required Secrets

You only need to add **ONE secret** manually:

### ✅ NPM_TOKEN (Required)

**Why needed:**
- Publishes packages to npm
- Must be added manually

**How to add:**
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Your npm Automation token (starts with `npm_...`)
6. Click **Add secret**

**How to create npm token:**
1. Go to https://www.npmjs.com/settings/yourusername/tokens
2. Click **Generate New Token**
3. Select **"Automation"** token type (NOT Classic)
4. Copy the token (starts with `npm_...`)
5. Paste it into GitHub Secrets as `NPM_TOKEN`

---

### ✅ GITHUB_TOKEN (Automatically Provided)

**Why needed:**
- Creates GitHub releases
- Creates git tags
- Commits CHANGELOG.md back to repo

**Do you need to add it manually?**
- ❌ **NO** - It's automatically provided by GitHub Actions
- ✅ The workflow uses `${{ secrets.GITHUB_TOKEN }}` which is always available
- ✅ No action needed on your part

---

## Summary

**Secrets you need to add manually:**
- ✅ `NPM_TOKEN` - Your npm Automation token

**Secrets automatically provided:**
- ✅ `GITHUB_TOKEN` - Automatically provided by GitHub Actions

**Total secrets needed:** Just 1 (`NPM_TOKEN`)

---

## Verification

To verify your secrets are set up correctly:

1. **Check NPM_TOKEN is set:**
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Verify `NPM_TOKEN` exists
   - Check that the value starts with `npm_`

2. **Test the workflow:**
   - Make a commit with conventional format: `feat: test release`
   - Push to `main` branch
   - Check GitHub Actions tab to see workflow run

3. **Check logs:**
   - If authentication fails, check the "Verify npm authentication" step logs
   - The workflow will show clear error messages if token is invalid

---

## Troubleshooting

### "NPM_TOKEN secret not found"
- Go to Settings → Secrets → Actions
- Verify `NPM_TOKEN` secret exists (case-sensitive)
- Make sure it's spelled exactly as `NPM_TOKEN`

### "npm authentication failed"
- Verify token is valid: Go to npmjs.com → Access Tokens
- Check token type is "Automation" (not Classic)
- Regenerate token if needed and update GitHub Secret

### "GITHUB_TOKEN not found"
- This shouldn't happen - GITHUB_TOKEN is automatically provided
- If you see this error, check GitHub Actions permissions in repo settings
- Make sure "Allow GitHub Actions to create and approve pull requests" is enabled

