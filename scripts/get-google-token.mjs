#!/usr/bin/env node

/**
 * One-time script to get a Google OAuth refresh token
 *
 * Usage: node scripts/get-google-token.mjs
 *
 * This will:
 * 1. Open your browser for Google authorization
 * 2. Handle the OAuth callback
 * 3. Print the refresh token to copy into .env.local
 */

import { createServer } from 'http';
import { URL } from 'url';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import open from 'open';

// Load environment variables from .env.local
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const CLIENT_ID = env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback';
const PORT = 3000;

// Scopes needed for Gmail and Drive
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local');
  process.exit(1);
}

console.log('🔐 Google OAuth Token Generator\n');
console.log('Client ID:', CLIENT_ID.substring(0, 20) + '...');
console.log('Redirect URI:', REDIRECT_URI);
console.log('Scopes:', SCOPES);
console.log('');

// Build authorization URL
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPES);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token

// Exchange authorization code for tokens
async function exchangeCodeForTokens(code) {
  const tokenUrl = 'https://oauth2.googleapis.com/token';

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

// Start local server to handle callback
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/auth/google/callback') {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<h1>Authorization Failed</h1><p>Error: ${error}</p>`);
      console.error('❌ Authorization denied:', error);
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>Error</h1><p>No authorization code received</p>');
      return;
    }

    try {
      console.log('📥 Received authorization code, exchanging for tokens...\n');
      const tokens = await exchangeCodeForTokens(code);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head>
            <title>Success!</title>
            <style>
              body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }
              h1 { color: #22C55E; }
              code { background: #f1f5f9; padding: 12px; display: block; border-radius: 8px; word-break: break-all; }
            </style>
          </head>
          <body>
            <h1>✅ Authorization Successful!</h1>
            <p>Your refresh token has been printed in the terminal.</p>
            <p>You can close this window.</p>
          </body>
        </html>
      `);

      // Save tokens to file
      const outputPath = resolve(process.cwd(), 'google-tokens.txt');
      const tokenOutput = `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}

Access Token (expires in ${tokens.expires_in}s):
${tokens.access_token}

Token Type: ${tokens.token_type}
Scope: ${tokens.scope}
`;
      writeFileSync(outputPath, tokenOutput);

      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ SUCCESS! Tokens saved to: google-tokens.txt');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('Copy the GOOGLE_REFRESH_TOKEN value to your .env.local file.');
      console.log('Then delete google-tokens.txt (contains sensitive data).');

      // Close server after a brief delay
      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1000);

    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error</h1><p>${err.message}</p>`);
      console.error('❌ Token exchange failed:', err.message);
      server.close();
      process.exit(1);
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, async () => {
  console.log(`🌐 Local server running at http://localhost:${PORT}`);
  console.log('🔗 Opening browser for authorization...\n');

  try {
    await open(authUrl.toString());
    console.log('👆 If browser didn\'t open, visit this URL manually:\n');
    console.log(authUrl.toString());
    console.log('\n⏳ Waiting for authorization...\n');
  } catch (err) {
    console.log('📋 Open this URL in your browser:\n');
    console.log(authUrl.toString());
    console.log('\n⏳ Waiting for authorization...\n');
  }
});
