import type { Command } from 'commander';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthUrl,
  exchangeCodeForToken,
} from '../auth/oauth';
import { startCallbackServer, waitForCallback } from '../auth/callback-server';
import { loadConfig, saveConfig } from '../auth/config';
import { fetchOrganizations, verifyToken } from '../auth/api';
import { AxiomCLIError } from '../errors';

async function promptSelect<T>(
  message: string,
  choices: Array<{ name: string; value: T }>,
): Promise<T> {
  console.log(`\n${message}`);
  choices.forEach((choice, index) => {
    console.log(`  ${index + 1}. ${choice.name}`);
  });

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const askQuestion = () => {
      rl.question(`\nSelect (1-${choices.length}): `, (answer) => {
        const index = parseInt(answer.trim(), 10) - 1;
        if (index >= 0 && index < choices.length) {
          rl.close();
          resolve(choices[index].value);
        } else {
          console.log('Invalid selection. Please try again.');
          askQuestion();
        }
      });
    };
    askQuestion();
  });
}

async function promptInput(message: string, defaultValue?: string): Promise<string> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const prompt = defaultValue ? `${message} (${defaultValue}): ` : `${message}: `;
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

async function openBrowser(url: string): Promise<void> {
  const { default: open } = await import('open');
  await open(url);
}

export async function loginCommand(): Promise<void> {
  try {
    console.log('🔐 Starting authentication flow...\n');

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    const { server, url: redirectUri } = await startCallbackServer();
    console.log(`✓ Started local callback server on ${redirectUri}\n`);

    const authUrl = buildAuthUrl({
      redirectUri,
      state,
      codeChallenge,
    });

    console.log('Opening browser for authentication...');
    console.log(`If the browser doesn't open, visit: ${authUrl}\n`);

    try {
      await openBrowser(authUrl);
    } catch {
      console.log('Could not open browser automatically.\n');
    }

    console.log('Waiting for authentication...');
    const { code } = await waitForCallback(server, state);

    console.log('✓ Authentication successful, exchanging code for token...\n');

    const accessToken = await exchangeCodeForToken({
      code,
      redirectUri,
      codeVerifier,
    });

    console.log('✓ Token received, fetching organizations...\n');

    const organizations = await fetchOrganizations(accessToken);

    if (organizations.length === 0) {
      throw new AxiomCLIError('No organizations found for this account');
    }

    let selectedOrgId: string;
    if (organizations.length === 1) {
      selectedOrgId = organizations[0].id;
      console.log(`✓ Using organization: ${organizations[0].name}\n`);
    } else {
      selectedOrgId = await promptSelect(
        'Select an organization:',
        organizations.map((org) => ({
          name: `${org.name} (${org.id})`,
          value: org.id,
        })),
      );
    }

    const selectedOrg = organizations.find((org) => org.id === selectedOrgId)!;
    const defaultAlias = selectedOrg.slug || selectedOrg.name.toLowerCase().replace(/\s+/g, '-');

    const alias = await promptInput('Enter deployment alias', defaultAlias);

    console.log('\n✓ Verifying credentials...\n');
    const isValid = await verifyToken(accessToken, selectedOrgId);

    if (!isValid) {
      throw new AxiomCLIError('Token verification failed');
    }

    const config = await loadConfig();
    config.active_deployment = alias;
    config.deployments[alias] = {
      url: 'https://api.axiom.co',
      token: accessToken,
      org_id: selectedOrgId,
    };

    await saveConfig(config);

    console.log(`✓ Successfully logged in as ${alias}`);
    console.log(`✓ Configuration saved to ~/.axiom.json\n`);
  } catch (error) {
    if (error instanceof AxiomCLIError) {
      throw error;
    }
    throw new AxiomCLIError(`Login failed: ${(error as Error).message}`);
  }
}

export function loadAuthLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with Axiom using OAuth2')
    .action(async () => {
      try {
        await loginCommand();
      } catch (error) {
        if (error instanceof AxiomCLIError) {
          console.error(`\n❌ Error: ${error.message}\n`);
        } else {
          console.error(`\n❌ Unexpected error: ${(error as Error).message}\n`);
        }
        process.exit(1);
      }
    });
}
