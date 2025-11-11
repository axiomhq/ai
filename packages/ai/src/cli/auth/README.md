# Authentication Module

This module implements OAuth2 Authorization Code Flow with PKCE (Proof Key for Code Exchange) for authenticating with Axiom.

## Architecture

The authentication flow follows the same pattern as `axiomhq/cli` but adapted for TypeScript:

1. **OAuth2 PKCE Flow** (`oauth.ts`)
   - Generates PKCE code verifier and S256 challenge
   - Builds authorization URL
   - Exchanges authorization code for access token

2. **Local Callback Server** (`callback-server.ts`)
   - Starts HTTP server on `127.0.0.1` (random port)
   - Handles OAuth callback with HTML success/error pages
   - Validates state parameter for CSRF protection

3. **Configuration Management** (`config.ts`)
   - Stores credentials in JSON in `~/.axiom.json` (on Linux/Unix) or `%APPDATA%\axiom\config.json` (on Windows)
   - Supports environment variable overrides
   - Manages multiple deployments

4. **API Client** (`api.ts`)
   - Fetches organizations
   - Verifies tokens

## Configuration File

**Location:** `~/.axiom.json` (on Linux/Unix) or `%APPDATA%\axiom\config.json` (on Windows)

**Format:**
\`\`\`json
{
  "active_deployment": "axiom",
  "deployments": {
    "axiom": {
      "url": "https://api.axiom.co",
      "token": "xapt-...",
      "org_id": "fancy-horse-1234"
    }
  }
}
\`\`\`

## Environment Variables

Override configuration via `axiom.config.ts` file.

```ts
export default defineConfig({
  eval: {
    url: process.env.AXIOM_URL,
    token: process.env.AXIOM_TOKEN,
    dataset: process.env.AXIOM_DATASET,
  },
});
```

## Commands

### `axiom auth login`

Authenticate using OAuth2 flow:

1. Starts local callback server
2. Opens browser to authorization URL
3. Waits for user to authenticate
4. Exchanges code for token
5. Fetches organizations
6. Prompts for organization selection (if multiple)
7. Prompts for deployment alias
8. Verifies credentials
9. Saves to config file

### `axiom auth logout`

Remove authentication credentials:

\`\`\`bash
axiom auth logout              # Remove active deployment
axiom auth logout --alias dev  # Remove specific deployment
\`\`\`

### `axiom auth status`

Check authentication status for all deployments:

- Shows all configured deployments
- Verifies each token is valid
- Indicates which deployment is active
- Shows if environment variables are being used

## OAuth2 Configuration

- **Client ID:** `264d906a404efc209b027f6595e6b616`
- **Authorization Endpoint:** `https://login.axiom.co/oauth/authorize`
- **Token Endpoint:** `https://login.axiom.co/oauth/token`
- **PKCE Method:** S256
- **Scope:** `*`

## Dependencies

- `open` - Cross-platform browser opening
- Native Node.js modules:
  - `crypto` - PKCE generation
  - `http` - Callback server
  - `fs/promises` - Config file I/O

