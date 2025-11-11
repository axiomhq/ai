import type { Organization } from './types';

export async function fetchOrganizations(
  token: string,
  apiBaseUrl: string,
): Promise<Organization[]> {
  const response = await fetch(`${apiBaseUrl}/v2/orgs`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch organizations: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as Organization[];
}

export async function verifyToken(
  token: string,
  orgId: string,
  apiBaseUrl: string,
): Promise<boolean> {
  const response = await fetch(`${apiBaseUrl}/v2/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Axiom-Org-Id': orgId,
      'Content-Type': 'application/json',
    },
  });

  return response.ok;
}
