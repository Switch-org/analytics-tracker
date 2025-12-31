# Testing Guide for Analytics Tracker

This guide shows you how to test the new Firebase/GA-style event tracking functionality.

## Table of Contents

1. [Quick Start Testing](#quick-start-testing)
2. [Manual Browser Testing](#manual-browser-testing)
3. [Unit Tests](#unit-tests)
4. [Using Webhook.site for Testing](#using-webhooksite-for-testing)
5. [Testing Checklist](#testing-checklist)

## Quick Start Testing

### Option 1: Use the Test HTML File (Recommended)

1. **Build the package:**
   ```bash
   npm run build
   ```

2. **Start the test server:**
   ```bash
   node test/server.js
   ```

3. **Open the test page:**
   - Open `test/index.html` in your browser
   - Or use a simple HTTP server:
     ```bash
     # Using Python
     cd test && python3 -m http.server 8080
     
     # Using Node.js (npx)
     npx http-server test -p 8080
     ```
   - Then open `http://localhost:8080/index.html`

4. **Test events:**
   - Click any button to track an event
   - Check the logs in the browser
   - Check the terminal where the server is running to see received events

### Option 2: Use Webhook.site

1. Go to [https://webhook.site](https://webhook.site)
2. Copy your unique webhook URL
3. Open `test/index.html` in your browser
4. Paste the webhook URL in the endpoint input field
5. Click "Update Endpoint"
6. Test events - they'll appear on webhook.site in real-time

## Manual Browser Testing

### In a React Application

1. **Install and configure:**
   ```tsx
   import { useAnalytics, AnalyticsService } from 'user-analytics-tracker';

   // Configure endpoint
   AnalyticsService.configure({
     apiEndpoint: 'https://your-api.com/analytics'
   });
   ```

2. **Track events in components:**
   ```tsx
   function MyComponent() {
     const { trackEvent, trackPageView } = useAnalytics({
       config: { apiEndpoint: 'https://your-api.com/analytics' }
     });

     const handleClick = () => {
       trackEvent('button_click', {
         button_name: 'signup',
         button_location: 'header'
       });
     };

     useEffect(() => {
       trackPageView('/dashboard', {
         page_title: 'Dashboard'
       });
     }, []);

     return <button onClick={handleClick}>Click Me</button>;
   }
   ```

3. **Standalone usage (without React):**
   ```javascript
   import { AnalyticsService } from 'user-analytics-tracker';

   AnalyticsService.configure({
     apiEndpoint: 'https://your-api.com/analytics'
   });

   // Track events
   AnalyticsService.logEvent('button_click', {
     button_name: 'signup'
   });

   AnalyticsService.trackPageView('/dashboard', {
     page_title: 'Dashboard'
   });
   ```

## Unit Tests

Run the unit tests to verify functionality:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

The tests verify:
- ✅ Event tracking with parameters
- ✅ Page view tracking
- ✅ Auto-context collection
- ✅ Custom context override
- ✅ Custom endpoint configuration
- ✅ Error handling

## Using Webhook.site for Testing

Webhook.site is a great tool for testing webhooks and APIs without setting up your own server.

### Steps:

1. Visit [https://webhook.site](https://webhook.site)
2. You'll get a unique URL like: `https://webhook.site/unique-id-here`
3. Use this URL as your endpoint in `test/index.html`
4. All events will appear on the webhook.site page in real-time
5. You can inspect the full request payload

### Example:

```javascript
// In test/index.html, set endpoint to:
// https://webhook.site/YOUR-UNIQUE-ID

AnalyticsService.configure({
  apiEndpoint: 'https://webhook.site/YOUR-UNIQUE-ID'
});
```

## Testing Checklist

Use this checklist to verify all functionality:

### ✅ Basic Event Tracking
- [ ] `logEvent()` sends event with eventName
- [ ] Event parameters are included in payload
- [ ] Event ID is generated automatically
- [ ] Timestamp is included
- [ ] Request is sent to correct endpoint

### ✅ Page View Tracking
- [ ] `trackPageView()` sends page_view event
- [ ] Page name is included
- [ ] Page title is auto-collected (when available)
- [ ] Custom parameters work

### ✅ Context Auto-Collection
- [ ] Device info is collected automatically
- [ ] Network info is collected automatically
- [ ] Location info is collected automatically (GPS or IP)
- [ ] Attribution data is collected automatically
- [ ] Session ID is generated

### ✅ Custom Context
- [ ] Custom context overrides auto-collected context
- [ ] Partial context works correctly

### ✅ Error Handling
- [ ] Failed requests don't break the app
- [ ] Network errors are handled gracefully
- [ ] Invalid responses are handled

### ✅ Endpoint Configuration
- [ ] Custom endpoint works
- [ ] Relative paths work
- [ ] Full URLs work
- [ ] HTTPS endpoints work

### ✅ Integration Testing
- [ ] Events appear in your backend
- [ ] All fields are present in payload
- [ ] Data format is correct
- [ ] Events can be processed/stored

## Debugging Tips

### 1. Check Browser Console

Open browser DevTools (F12) and check the Console tab for:
- Event tracking logs
- Network requests
- Any errors

### 2. Check Network Tab

In DevTools → Network tab:
- Look for requests to your analytics endpoint
- Check the request payload
- Verify response status

### 3. Use Test Server

The included test server (`test/server.js`) will:
- Log all received events to console
- Show full event payload
- Display device, network, and location info

### 4. Verify Build

Make sure you build before testing:
```bash
npm run build
```

### 5. Check TypeScript

Run type checking:
```bash
npm run type-check
```

## Example Test Scenarios

### Scenario 1: E-commerce Flow

```javascript
// View product
AnalyticsService.logEvent('view_item', {
  item_id: 'SKU123',
  item_name: 'Product',
  price: 29.99
});

// Add to cart
AnalyticsService.logEvent('add_to_cart', {
  item_id: 'SKU123',
  quantity: 2
});

// Begin checkout
AnalyticsService.logEvent('begin_checkout', {
  value: 59.98,
  currency: 'USD'
});

// Purchase
AnalyticsService.logEvent('purchase', {
  transaction_id: 'T12345',
  value: 59.98,
  currency: 'USD'
});
```

### Scenario 2: User Engagement

```javascript
// Sign up
AnalyticsService.logEvent('sign_up', {
  method: 'email',
  plan: 'premium'
});

// Video play
AnalyticsService.logEvent('video_play', {
  video_id: 'vid123',
  video_title: 'Tutorial'
});

// Share
AnalyticsService.logEvent('share', {
  content_type: 'article',
  method: 'twitter'
});
```

### Scenario 3: Page Navigation

```javascript
// Track page views as user navigates  
AnalyticsService.trackPageView('/home');
AnalyticsService.trackPageView('/products');
AnalyticsService.trackPageView('/product/123', {
  product_id: '123',
  product_name: 'Product Name'
});
AnalyticsService.trackPageView('/checkout');
```

## Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Verify the endpoint is correct
3. Check CORS settings if using a different domain
4. Ensure the package is built (`npm run build`)
5. Review the test server logs

For more information, see the main [README.md](./README.md) and [docs/usage-guide.md](./docs/usage-guide.md). 


