import type { Command } from 'commander';
import { loadGlobalConfig, getActiveProfile } from '../auth/config';
import { verifyToken } from '../auth/api';
import { AxiomCLIError } from '../../util/errors';

export async function statusCommand(): Promise<void> {
  const config = await loadGlobalConfig();

  if (Object.keys(config.profiles).length === 0) {
    console.log('No authenticated profiles found.');
    console.log('Run "axiom auth login" to authenticate.');
    return;
  }

  console.log('\nAuthentication Status:\n');

  for (const [alias, profile] of Object.entries(config.profiles)) {
    const isActive = config.active_profile === alias;
    const marker = isActive ? '→' : ' ';

    try {
      const isValid = await verifyToken(profile.token, profile.org_id, profile.url);
      const status = isValid ? '✓' : '✗';
      const statusText = isValid ? 'Valid' : 'Invalid';

      console.log(`${marker} ${status} ${alias}`);
      console.log(`    URL: ${profile.url}`);
      console.log(`    Org ID: ${profile.org_id}`);
      console.log(`    Status: ${statusText}`);
      if (isActive) {
        console.log(`    (Active)`);
      }
      console.log();
    } catch (error) {
      console.log(`${marker} ✗ ${alias}`);
      console.log(`    URL: ${profile.url}`);
      console.log(`    Org ID: ${profile.org_id}`);
      console.log(`    Status: Error - ${(error as Error).message}`);
      if (isActive) {
        console.log(`    (Active)`);
      }
      console.log();
    }
  }

  const activeProfile = getActiveProfile(config);
  if (process.env.AXIOM_TOKEN) {
    console.log('Note: Using AXIOM_TOKEN environment variable (overrides config file)\n');
  } else if (activeProfile && config.active_profile) {
    console.log(`Active profile: ${config.active_profile}\n`);
  }
}

export function loadAuthStatusCommand(auth: Command, program: Command): void {
  [auth, program].forEach((program) => {
    program
      .command('status')
      .description('Check authentication status for all profiles')
      .action(async () => {
        try {
          await statusCommand();
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
