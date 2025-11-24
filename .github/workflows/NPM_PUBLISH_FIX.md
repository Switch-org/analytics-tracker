# Fix: npm 403 Forbidden Error

## Error Message
```
npm error 403 403 Forbidden - PUT https://registry.npmjs.org/user-analytics-tracker - You may not perform that action with these credentials.
```

## Root Causes

### 1. Package Ownership Issue
The package `user-analytics-tracker` might be owned by a different npm user than the one associated with your `NPM_TOKEN`.

**Solution:**
- Check who owns the package: `npm owner ls user-analytics-tracker`
- If you're not the owner, you need to:
  - Either use the token from the package owner's account
  - Or have the owner add you as a maintainer: `npm owner add YOUR_NPM_USERNAME user-analytics-tracker`

### 2. Token Type Issue
The token might not be an "Automation" token or might not have publish permissions.

**Solution:**
1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Create a new **"Automation"** token (NOT Classic)
3. Make sure it has **"Publish"** permissions
4. Update the `NPM_TOKEN` secret in GitHub

### 3. Package Name Already Exists
If the package exists but is owned by someone else, you can't publish to it.

**Solution:**
- Check if package exists: `npm view user-analytics-tracker`
- If it exists and you don't own it, you need to:
  - Contact the owner to transfer ownership
  - Or use a different package name

### 4. 2FA Settings
If you have 2FA enabled, it must be set to **"Authorization only"** (not "Authorization and writes").

**Solution:**
1. Go to npmjs.com → Profile → Two Factor Authentication
2. Set level to **"Authorization only"**
3. Regenerate your Automation token
4. Update GitHub Secret

## Step-by-Step Fix

### Step 1: Verify Package Ownership

```bash
# Check who owns the package
npm view user-analytics-tracker maintainers

# Or check if package exists
npm view user-analytics-tracker
```

### Step 2: Verify Your npm Account

```bash
# Check which npm user you're logged in as
npm whoami

# Make sure this matches the package owner
```

### Step 3: Create/Update npm Token

1. Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Delete old token (if exists)
3. Click **"Generate New Token"**
4. Select **"Automation"** type
5. Name: `github-actions-user-analytics-tracker`
6. Permissions: **Publish** (must be enabled)
7. Copy token (starts with `npm_...`)

### Step 4: Update GitHub Secret

1. Go to: https://github.com/switch-org/analytics-tracker/settings/secrets/actions
2. Find `NPM_TOKEN` secret
3. Click **"Update"**
4. Paste new token
5. Click **"Update secret"**

### Step 5: Test Locally (Optional)

```bash
# Test token locally
export NPM_TOKEN="npm_your_token_here"
echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc
npm whoami  # Should show your username
npm publish --dry-run --access public  # Test publish
```

### Step 6: Verify Package Access

If the package already exists, make sure you have access:

```bash
# Check if you're a maintainer
npm owner ls user-analytics-tracker

# If not listed, ask the owner to add you:
# npm owner add YOUR_USERNAME user-analytics-tracker
```

## Quick Checklist

- [ ] Token is "Automation" type (not Classic)
- [ ] Token has "Publish" permissions
- [ ] Token is from the npm account that owns `user-analytics-tracker`
- [ ] 2FA is set to "Authorization only" (if enabled)
- [ ] GitHub Secret `NPM_TOKEN` is updated with new token
- [ ] Package `user-analytics-tracker` is owned by your npm account (or you're a maintainer)

## If Package Doesn't Exist Yet

If `user-analytics-tracker` doesn't exist on npm yet:
- The first publish will create it
- Make sure your npm token is from the account you want to own it
- The token must have "Publish" permissions

## Still Not Working?

1. **Check npm account**: Make sure you're using the correct npm account
2. **Check package name**: Verify `user-analytics-tracker` is available/owned by you
3. **Regenerate token**: Create a fresh Automation token
4. **Check GitHub Actions logs**: Look at the "Verify npm authentication" step for detailed errors

