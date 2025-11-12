import type { Command } from 'commander';
import { OAuth } from '../auth/oauth';
import { startCallbackServer, waitForCallback } from '../auth/callback-server';
import { getGlobalConfigPath, loadGlobalConfig, saveGlobalConfig } from '../auth/config';
import { fetchOrganizations, verifyToken } from '../auth/api';
import { AxiomCLIError } from '../errors';

const BASE_HOSTNAME = 'axiom.co';

const getApiUrl = (hostname: string) => {
  return `https://api.${hostname}`;
};

const getOauthUrl = (hostname: string) => {
  return `https://login.${hostname}`;
};

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

export async function loginCommand(hostname: string): Promise<void> {
  try {
    console.log('🔐 Starting authentication flow...\n');

    const codeVerifier = OAuth.generateCodeVerifier();
    const codeChallenge = OAuth.generateCodeChallenge(codeVerifier);
    const state = OAuth.generateState();
    const oauth = new OAuth(getOauthUrl(hostname));

    const { server, url: redirectUri } = await startCallbackServer();
    console.log(`✓ Started local callback server on ${redirectUri}\n`);

    const authUrl = oauth.buildAuthUrl({
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

    const accessToken = await oauth.exchangeCodeForToken({
      code,
      redirectUri,
      codeVerifier,
    });

    console.log('✓ Token received, fetching organizations...\n');

    const organizations = await fetchOrganizations(accessToken, getApiUrl(hostname));

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

    const alias = await promptInput('Enter profile alias', defaultAlias);

    console.log('\n✓ Verifying credentials...\n');
    const isValid = await verifyToken(accessToken, selectedOrgId, getApiUrl(hostname));

    if (!isValid) {
      throw new AxiomCLIError('Token verification failed');
    }

    const config = await loadGlobalConfig();
    config.active_profile = alias;
    config.profiles[alias] = {
      url: getApiUrl(hostname),
      token: accessToken,
      org_id: selectedOrgId,
    };

    await saveGlobalConfig(config);

    console.log(`✓ Successfully logged in as ${alias}`);
    console.log(`✓ Configuration saved to ${getGlobalConfigPath()}\n`);
  } catch (error) {
    if (error instanceof AxiomCLIError) {
      throw error;
    }
    throw new AxiomCLIError(`Login failed: ${(error as Error).message}`);
  }
}

export function loadAuthLoginCommand(auth: Command, root: Command): void {
  [auth, root].forEach((program) => {
    program
      .command('login')
      .description('Authenticate with Axiom')
      .option('--hostname <hostname>', 'Axiom hostname (default: axiom.co)')
      .action(async (options) => {
        try {
          await loginCommand(options.hostname ?? BASE_HOSTNAME);
        } catch (error) {
          if (error instanceof AxiomCLIError) {
            console.error(`\n❌ Error: ${error.message}\n`);
          } else {
            console.error(`\n❌ Unexpected error: ${(error as Error).message}\n`);
          }
          process.exit(1);
        }
      });
  });
}
