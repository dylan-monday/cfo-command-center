/**
 * Google OAuth Refresh Token Generator
 *
 * Run this locally to get a refresh token with full Drive access.
 *
 * Usage:
 *   node scripts/get-google-token.js
 *
 * Then follow the prompts.
 */

const http = require('http');
const { URL } = require('url');

// Load from .env.local
require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local');
  process.exit(1);
}

const REDIRECT_URI = 'http://localhost:3333/callback';
const SCOPES = [
  'https://www.googleapis.com/auth/drive',  // Full Drive access
  'https://www.googleapis.com/auth/gmail.send',  // Send emails
];

// Build the authorization URL
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPES.join(' '));
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');  // Force refresh token generation

console.log('\n=== Google OAuth Token Generator ===\n');
console.log('1. First, add this redirect URI to your Google Cloud Console:');
console.log('   APIs & Services → Credentials → Your OAuth Client → Authorized redirect URIs');
console.log(`   Add: ${REDIRECT_URI}`);
console.log('\n2. Then open this URL in your browser:\n');
console.log(authUrl.toString());
console.log('\n3. Sign in and authorize the app.\n');
console.log('Waiting for callback on http://localhost:3333 ...\n');

// Start local server to catch the callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error: ${error}</h1><p>Check your OAuth configuration.</p>`);
      console.error('OAuth error:', error);
      server.close();
      process.exit(1);
    }

    if (code) {
      // Exchange code for tokens
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
          }),
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>Token Error</h1><pre>${JSON.stringify(tokens, null, 2)}</pre>`);
          console.error('Token error:', tokens);
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <h1>Success!</h1>
            <p>Copy the refresh token below and update your Vercel environment variables.</p>
            <h2>GOOGLE_REFRESH_TOKEN:</h2>
            <textarea style="width:100%;height:100px;font-family:monospace;">${tokens.refresh_token}</textarea>
            <p>You can close this window now.</p>
          `);

          console.log('\n=== SUCCESS ===\n');
          console.log('GOOGLE_REFRESH_TOKEN:');
          console.log(tokens.refresh_token);
          console.log('\nUpdate this in Vercel: Settings → Environment Variables → GOOGLE_REFRESH_TOKEN');
          console.log('\nThen redeploy your app.\n');
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>Error exchanging code</h1><pre>${err.message}</pre>`);
        console.error('Exchange error:', err);
      }

      server.close();
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3333, () => {
  console.log('Server listening on http://localhost:3333');
});
