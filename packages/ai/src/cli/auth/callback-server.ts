import http, { type IncomingMessage, type ServerResponse } from 'http';
import type { AddressInfo } from 'net';

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

const SUCCESS_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Login Successful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 3rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
    }
    h1 {
      color: #2563eb;
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
    }
    p {
      color: #666;
      margin: 0;
      line-height: 1.5;
    }
    .success {
      color: #16a34a;
      font-size: 3rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success">✓</div>
    <h1>Login Successful</h1>
    <p>You can close this page and return to your CLI.</p>
  </div>
</body>
</html>`;

const ERROR_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Login Failed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 3rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
    }
    h1 {
      color: #dc2626;
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
    }
    p {
      color: #666;
      margin: 0;
      line-height: 1.5;
    }
    .error {
      color: #dc2626;
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 4px;
      padding: 1rem;
      margin-top: 1rem;
      color: #991b1b;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error">✗</div>
    <h1>Login Failed</h1>
    <p>An error occurred during authentication.</p>
    <div class="error-message">{{ERROR}}</div>
  </div>
</body>
</html>`;

export interface CallbackServerResult {
  server: http.Server;
  port: number;
  url: string;
}

export async function startCallbackServer(): Promise<CallbackServerResult> {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo;
      resolve({
        server,
        port: address.port,
        url: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

export interface CallbackResult {
  code: string;
}

export async function waitForCallback(
  server: http.Server,
  expectedState: string
): Promise<CallbackResult> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('Authentication timeout after 5 minutes'));
    }, 5 * 60 * 1000); // 5 minute timeout

    server.on('request', (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');

      if (error) {
        const errorMsg = errorDescription || error;
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML.replace('{{ERROR}}', escapeHtml(errorMsg)));
        clearTimeout(timeout);
        server.close();
        reject(new Error(`OAuth error: ${errorMsg}`));
        return;
      }

      if (!code || !state) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML.replace('{{ERROR}}', escapeHtml('Missing code or state parameter')));
        return;
      }

      if (state !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML.replace('{{ERROR}}', escapeHtml('Invalid state parameter (CSRF protection)')));
        clearTimeout(timeout);
        server.close();
        reject(new Error('Invalid state parameter'));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(SUCCESS_HTML);

      clearTimeout(timeout);
      server.close();
      resolve({ code });
    });
  });
}
