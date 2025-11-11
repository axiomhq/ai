import http, { type IncomingMessage, type ServerResponse } from 'http';
import type { AddressInfo } from 'net';

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '`': '&#96;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

function renderCallbackPage(error?: string): string {
  const errorClass = error ? ' class="error"' : '';
  const errorMessage = error ? escapeHtml(error) : '';

  return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Axiom</title>
    <link rel="icon" href="https://app.axiom.co/static/favicon.ico">
    <meta name="description" content="Axiom CLI">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
        html,
        body,
        .root {
            width: 100%;
            height: 100%;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
        }
        body {
            color: #334155;
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji;
            font-size: 14px;
            font-weight: 500;
            font-variant: tabular-nums;
            line-height: 1.5;
            background-color: #fff;
            font-feature-settings: "tnum";
            margin: 0;
        }
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
            margin-top: 0;
            margin-bottom: .5em;
            font-weight: 500;
        }
        p {
            margin-top: 0;
            margin-bottom: 1em;
        }
        h2 {
            font-size: 16px;
            font-weight: 600;
        }
        .root {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .logo {
            width: 92px;
            float: left;
            position: absolute;
            top: 16px;
            left: 16px;
        }
        .center p {
            padding: 8px 0;
        }
        .error .center {
            color: #bf0e08;
        }
    </style>
</head>
<body${errorClass}>
    <div class="root">
        <a class="" target="_blank" rel="noopener noreferrer" href="https://axiom.co">
            <img src="https://app.axiom.co/static/media/axiom-black.svg" alt="Axiom logo" class="logo">
        </a>
        <div class="center">
            ${
              error
                ? `<h2 id="msg">Login failed</h2>
            <p id="details">${errorMessage}</p>`
                : `<h2 id="msg">Login successful</h2>
            <p id="details">You can close this page and return to your CLI.</p>`
            }
        </div>
    </div>
    <script>
        window.history.replaceState({}, '', \`\${window.location.pathname}\`);
    </script>
</body>
</html>`;
}

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
  expectedState: string,
): Promise<CallbackResult> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => {
        server.close();
        reject(new Error('Authentication timeout after 5 minutes'));
      },
      5 * 60 * 1000,
    ); // 5 minute timeout

    server.on('request', (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');

      if (error) {
        const errorMsg = errorDescription || error;
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(renderCallbackPage(errorMsg));
        clearTimeout(timeout);
        server.close();
        reject(new Error(`OAuth error: ${errorMsg}`));
        return;
      }

      if (!code || !state) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(renderCallbackPage('Missing code or state parameter'));
        return;
      }

      if (state !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(renderCallbackPage('Invalid state parameter (CSRF protection)'));
        clearTimeout(timeout);
        server.close();
        reject(new Error('Invalid state parameter'));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(renderCallbackPage());

      clearTimeout(timeout);
      server.close();
      resolve({ code });
    });
  });
}
