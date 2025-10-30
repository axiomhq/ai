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
   - Stores credentials in `~/.axiom.json` (JSON format)
   - Supports environment variable overrides
   - Manages multiple deployments

4. **API Client** (`api.ts`)
   - Fetches organizations
   - Verifies tokens

## Configuration File

**Location:** `~/.axiom.json`

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

Override configuration via environment variables (precedence: env > config file):

- `AXIOM_TOKEN` - Access token
- `AXIOM_URL` - API URL (default: https://api.axiom.co)
- `AXIOM_ORG_ID` - Organization ID
- `AXIOM_DEPLOYMENT` - Active deployment name

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

- **Client ID:** `13c885a8-f46a-4424-82d2-883cf7ccfe49`
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

## Backward Compatibility

The authentication module maintains backward compatibility with existing environment variable usage:

- If `AXIOM_TOKEN` is set, it takes precedence
- Existing code using `process.env.AXIOM_TOKEN` continues to work
- Use `getAxiomToken()` helper to get token from env or config
