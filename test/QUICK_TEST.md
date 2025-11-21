# Quick Testing Guide

## ✅ Option 1: Test Server (Easiest)

1. **Build the package:**
   ```bash
   npm run build
   ```

2. **Start the test server:**
   ```bash
   node test/server.js
   ```
   This starts a server on `http://localhost:3000` that will log all received events.

3. **Open the test page:**
   ```bash
   # Option A: Using Python
   cd test && python3 -m http.server 8080
   
   # Option B: Using Node.js (npx)
   npx http-server test -p 8080
   ```

4. **Open in browser:**
   - Go to `http://localhost:8080/index.html`
   - The endpoint should already be set to `http://localhost:3000/api/analytics`
   - Click any button to track events
   - Check both:
     - Browser logs (on the page)
     - Server terminal (to see full event data)

## ✅ Option 2: Webhook.site (No Server Setup)

1. **Get a webhook URL:**
   - Visit [https://webhook.site](https://webhook.site)
   - Copy your unique URL

2. **Build the package:**
   ```bash
   npm run build
   ```

3. **Open test page:**
   - Open `test/index.html` in your browser
   - Paste webhook URL in the endpoint input
   - Click "Update Endpoint"

4. **Test events:**
   - Click any button
   - Check webhook.site for received events

## ✅ Option 3: Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## ✅ Option 4: In Your React App

```tsx
import { useAnalytics } from '@atif910/analytics-tracker';

function MyComponent() {
  const { trackEvent, trackPageView } = useAnalytics({
    config: { 
      apiEndpoint: 'http://localhost:3000/api/analytics' 
    }
  });

  const handleClick = () => {
    trackEvent('button_click', {
      button_name: 'signup'
    });
  };

  return <button onClick={handleClick}>Test</button>;
}
```

## 📊 What to Check

When testing, verify:
- ✅ Events are sent to your endpoint
- ✅ Event name is correct
- ✅ Event parameters are included
- ✅ Device/network/location context is collected
- ✅ Event ID and timestamp are generated
- ✅ Page URL is included

## 🔍 Debugging

- **Browser Console:** Check for errors or warnings
- **Network Tab:** See actual HTTP requests
- **Server Logs:** Full event payload details

For more details, see [TESTING.md](../TESTING.md).

