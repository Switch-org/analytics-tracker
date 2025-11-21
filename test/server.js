#!/usr/bin/env node

/**
 * Simple test server to receive and log analytics events
 * Usage: node test/server.js [port]
 * 
 * Then open test/index.html in your browser and set the endpoint to:
 * http://localhost:3000/api/analytics (or your custom port)
 */

const http = require('http');
const url = require('url');

// Parse port from command line, environment variable, or use default
const portArg = process.argv[2] || process.env.PORT || '3000';
const PORT = parseInt(portArg, 10);

// Validate port number
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`\n❌ Error: Invalid port number: ${portArg}`);
  console.log('💡 Port must be a number between 1 and 65535');
  console.log('💡 Usage: node test/server.js [port]\n');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // Enable CORS for browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  
  // Only handle /api/analytics endpoint
  if (parsedUrl.pathname === '/api/analytics' && req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        
        // Pretty print the event
        console.log('\n' + '='.repeat(80));
        console.log(`📊 EVENT RECEIVED: ${event.eventName || 'page_view'}`);
        console.log('='.repeat(80));
        console.log('Timestamp:', event.timestamp);
        console.log('Event ID:', event.eventId);
        console.log('Session ID:', event.sessionId);
        console.log('User ID:', event.userId);
        console.log('Page URL:', event.pageUrl);
        
        if (event.eventName) {
          console.log('Event Name:', event.eventName);
        }
        
        if (event.eventParameters && Object.keys(event.eventParameters).length > 0) {
          console.log('\n📋 Event Parameters:');
          console.log(JSON.stringify(event.eventParameters, null, 2));
        }
        
        if (event.customData && Object.keys(event.customData).length > 0) {
          console.log('\n📦 Custom Data:');
          console.log(JSON.stringify(event.customData, null, 2));
        }
        
        if (event.deviceInfo) {
          console.log('\n📱 Device Info:');
          console.log(`  Type: ${event.deviceInfo.type}`);
          console.log(`  OS: ${event.deviceInfo.os} ${event.deviceInfo.osVersion}`);
          console.log(`  Browser: ${event.deviceInfo.browser} ${event.deviceInfo.browserVersion}`);
          console.log(`  Screen: ${event.deviceInfo.screenResolution}`);
        }
        
        if (event.networkInfo) {
          console.log('\n🌐 Network Info:');
          console.log(`  Type: ${event.networkInfo.type}`);
          if (event.networkInfo.effectiveType) {
            console.log(`  Effective Type: ${event.networkInfo.effectiveType}`);
          }
        }
        
        if (event.location) {
          console.log('\n📍 Location Info:');
          console.log(`  Source: ${event.location.source}`);
          if (event.location.lat && event.location.lon) {
            console.log(`  Coordinates: ${event.location.lat}, ${event.location.lon}`);
          }
        }
        
        if (event.attribution) {
          console.log('\n🔗 Attribution Info:');
          if (event.attribution.utm_source) {
            console.log(`  UTM Source: ${event.attribution.utm_source}`);
          }
          if (event.attribution.referrerDomain) {
            console.log(`  Referrer: ${event.attribution.referrerDomain}`);
          }
        }
        
        console.log('='.repeat(80) + '\n');

        // Send success response
        res.writeHead(200);
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Event received',
          eventId: event.eventId 
        }));
      } catch (error) {
        console.error('Error parsing event:', error);
        res.writeHead(400);
        res.end(JSON.stringify({ 
          success: false, 
          error: error.message 
        }));
      }
    });
  } else if (parsedUrl.pathname === '/health') {
    // Health check endpoint
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', port: PORT }));
  } else {
    // 404 for other routes
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log('\n🚀 Analytics Test Server Started!');
  console.log('='.repeat(80));
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📥 Endpoint: http://localhost:${PORT}/api/analytics`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log('='.repeat(80));
  console.log('\n💡 Open test/index.html in your browser to start testing!');
  console.log('💡 Or use webhook.site to get a test endpoint URL\n');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use!\n`);
    console.log('💡 Solutions:');
    console.log(`   1. Use a different port: node test/server.js 3001`);
    console.log(`   2. Kill the process using port ${PORT}:`);
    console.log(`      On Mac/Linux: lsof -ti:${PORT} | xargs kill -9`);
    console.log(`      Or: kill $(lsof -t -i:${PORT})`);
    console.log(`   3. Use environment variable: PORT=3001 node test/server.js\n`);
    process.exit(1);
  } else {
    console.error('\n❌ Server error:', err);
    process.exit(1);
  }
});

