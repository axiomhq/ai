export interface Profile {
  url: string;
  token: string;
  org_id: string;
}

export interface Config {
  active_profile?: string;
  profiles: Record<string, Profile>;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug?: string;
}
