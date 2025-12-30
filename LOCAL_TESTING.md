# Local Testing Guide

This guide explains how to install and test the package locally in another project.

## Package Created

The package tarball has been created: **`user-analytics-tracker-2.1.0.tgz`**

Location: `/Users/venom/Documents/Switch-org/analytics-tracker/user-analytics-tracker-2.1.0.tgz`

## Installation in Your Test Project

### Method 1: Install from Local File (Recommended)

1. **Copy the tarball to your test project** (or use absolute path):

```bash
# Option A: Copy the file
cp /Users/venom/Documents/Switch-org/analytics-tracker/user-analytics-tracker-2.1.0.tgz /path/to/your/test-project/

# Option B: Use absolute path directly
```

2. **Install in your test project**:

```bash
cd /path/to/your/test-project
npm install /Users/venom/Documents/Switch-org/analytics-tracker/user-analytics-tracker-2.1.0.tgz
```

Or if you copied it:

```bash
cd /path/to/your/test-project
npm install ./user-analytics-tracker-2.1.0.tgz
```

### Method 2: Install from Local Directory

```bash
cd /path/to/your/test-project
npm install /Users/venom/Documents/Switch-org/analytics-tracker
```

### Method 3: Using npm link (For Development)

This creates a symlink, so changes in the source will be reflected immediately:

```bash
# In the analytics-tracker directory
cd /Users/venom/Documents/Switch-org/analytics-tracker
npm link

# In your test project
cd /path/to/your/test-project
npm link user-analytics-tracker
```

**Note:** With `npm link`, you need to rebuild after changes:
```bash
cd /Users/venom/Documents/Switch-org/analytics-tracker
npm run build
```

## Testing the Package

### Basic Usage Test

```tsx
import { useAnalytics } from 'user-analytics-tracker';

function TestComponent() {
  const analytics = useAnalytics({
    config: {
      apiEndpoint: '/api/analytics',
      fieldStorage: {
        ipLocation: { mode: 'essential' },
        deviceInfo: { mode: 'essential' },
        networkInfo: { mode: 'essential' },
        location: { mode: 'essential' },
        attribution: { mode: 'essential' },
      },
    },
  });

  return <div>Testing analytics tracker</div>;
}
```

### Test IP Location with Custom Configuration

```tsx
import { useAnalytics } from 'user-analytics-tracker';

function TestComponent() {
  const analytics = useAnalytics({
    config: {
      apiEndpoint: '/api/analytics',
      fieldStorage: {
        // Test custom configuration
        ipLocation: {
          mode: 'custom',
          fields: ['ip', 'country', 'countryCode', 'city', 'isp'],
        },
        deviceInfo: {
          mode: 'all',
          exclude: ['deviceMemory', 'hardwareConcurrency'],
        },
      },
    },
  });

  // Check what data is being sent
  console.log('Analytics:', analytics);

  return <div>Testing custom field storage</div>;
}
```

### Test Direct IP Location Functions

```typescript
import { getCompleteIPLocation } from 'user-analytics-tracker';

async function testIPLocation() {
  const location = await getCompleteIPLocation();
  console.log('IP Location:', location);
  // Should contain: ip, country, connection, timezone, flag, etc.
}
```

## Verifying Field Storage

### Check What Fields Are Stored

1. **Set up a test endpoint** to log the received data:

```typescript
// In your test project's API route
export async function POST(req: Request) {
  const data = await req.json();
  console.log('Received analytics event:', JSON.stringify(data, null, 2));
  
  // Check field storage
  console.log('IP Location fields:', Object.keys(data.customData?.ipLocation || {}));
  console.log('Device Info fields:', Object.keys(data.deviceInfo || {}));
  console.log('Network Info fields:', Object.keys(data.networkInfo || {}));
  console.log('Location fields:', Object.keys(data.location || {}));
  console.log('Attribution fields:', Object.keys(data.attribution || {}));
  
  return Response.json({ ok: true });
}
```

2. **Test with different configurations**:

```typescript
// Test 1: Essential mode (default)
fieldStorage: {
  ipLocation: { mode: 'essential' },
}

// Test 2: All fields
fieldStorage: {
  ipLocation: { mode: 'all' },
}

// Test 3: Custom fields
fieldStorage: {
  ipLocation: {
    mode: 'custom',
    fields: ['ip', 'country', 'city'],
  },
}
```

## Quick Test Checklist

- [ ] Package installs successfully
- [ ] No TypeScript errors
- [ ] IP location data is fetched from ipwho.is
- [ ] Field storage configuration works (essential/all/custom)
- [ ] Only configured fields are stored
- [ ] All data types are filtered (device, network, location, attribution)
- [ ] Data is sent to your API endpoint correctly

## Troubleshooting

### Package not found
```bash
# Make sure you're using the correct path
ls -la /Users/venom/Documents/Switch-org/analytics-tracker/user-analytics-tracker-2.1.0.tgz
```

### TypeScript errors
```bash
# Rebuild the package
cd /Users/venom/Documents/Switch-org/analytics-tracker
npm run build
npm pack
```

### Changes not reflected
```bash
# Rebuild and reinstall
cd /Users/venom/Documents/Switch-org/analytics-tracker
npm run build
npm pack

cd /path/to/your/test-project
npm install /Users/venom/Documents/Switch-org/analytics-tracker/user-analytics-tracker-2.1.0.tgz --force
```

## Package Details

- **Package Name:** `user-analytics-tracker`
- **Version:** `2.1.0`
- **Package File:** `user-analytics-tracker-2.1.0.tgz`
- **Package Size:** ~97.4 kB
- **Location:** `/Users/venom/Documents/Switch-org/analytics-tracker/`

## Next Steps

After testing locally:
1. Verify all features work as expected
2. Test different field storage configurations
3. Check storage optimization (compare payload sizes)
4. Once satisfied, push to npm using the publishing guide

---

**Ready to test!** Install the package in your test project and start testing. 🚀

