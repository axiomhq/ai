import { randomBytes, createHash } from 'crypto';
import type { OAuthTokenResponse } from './types';

const OAUTH_CLIENT_ID = '264d906a404efc209b027f6595e6b616';
const OAUTH_AUTH_PATH = '/oauth/authorize';
const OAUTH_TOKEN_PATH = '/oauth/token';

export interface BuildAuthUrlParams {
  redirectUri: string;
  state: string;
  codeChallenge: string;
}

export interface ExchangeCodeParams {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}

export class OAuth {
  constructor(private readonly oauthBaseUrl: string) {}

  static generateCodeVerifier(): string {
    return randomBytes(32).toString('base64url');
  }

  static generateCodeChallenge(verifier: string): string {
    return createHash('sha256').update(verifier).digest('base64url');
  }

  static generateState(): string {
    return randomBytes(16).toString('hex');
  }

  public buildAuthUrl(params: BuildAuthUrlParams): string {
    const url = new URL(OAUTH_AUTH_PATH, this.oauthBaseUrl);
    url.searchParams.set('client_id', OAUTH_CLIENT_ID);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', params.state);
    url.searchParams.set('code_challenge', params.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('scope', '*');
    return url.toString();
  }

  public async exchangeCodeForToken(params: ExchangeCodeParams): Promise<string> {
    const tokenUrl = new URL(OAUTH_TOKEN_PATH, this.oauthBaseUrl);

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: OAUTH_CLIENT_ID,
      code: params.code,
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier,
    });

    const response = await fetch(tokenUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    const data: OAuthTokenResponse = await response.json();
    return data.access_token;
  }
}
