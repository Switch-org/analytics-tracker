# Fix: npm authentication failed

If the Release workflow fails at **"Verify npm authentication"** with:

```
❌ npm authentication failed!
```

do the following.

## 1. Create an npm Automation token

1. Open **https://www.npmjs.com/settings/~/tokens**
2. Click **"Generate New Token"** → choose **"Automation"** (not Classic).
3. Copy the token (it starts with `npm_`). You won’t see it again.

## 2. Add or update the GitHub secret

1. Open your repo: **https://github.com/Switch-org/analytics-tracker**
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. If **NPM_TOKEN** already exists: click it → **Update** and paste the new token.
4. If it doesn’t exist: **New repository secret** → Name: **NPM_TOKEN** (exact), Value: paste the token → **Add secret**.

## 3. Re-run the workflow

- Go to **Actions** → select the failed run → **Re-run all jobs**.

## Checklist

- [ ] Token type is **Automation** (not Classic)
- [ ] Secret name is exactly **NPM_TOKEN**
- [ ] No extra spaces or quotes when pasting the token
- [ ] If the token was created long ago, regenerate it and update the secret (tokens can expire or be revoked)

## Test the token locally (optional)

```bash
export NPM_TOKEN="npm_your_token_here"
echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc
npm whoami   # Should print your npm username
```

If `npm whoami` fails locally, the token is invalid or expired; create a new Automation token and try again.
