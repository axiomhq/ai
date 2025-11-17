import type { Command } from 'commander';
import { loadGlobalConfig, saveGlobalConfig } from '../auth/config';
import { AxiomCLIError } from '../errors';

export async function logoutCommand(alias?: string): Promise<void> {
  const config = await loadGlobalConfig();

  const profileToRemove = alias || config.active_profile;

  if (!profileToRemove) {
    throw new AxiomCLIError('No active profile. Use --alias to specify which profile to remove.');
  }

  if (!config.profiles[profileToRemove]) {
    throw new AxiomCLIError(`Profile "${profileToRemove}" not found`);
  }

  delete config.profiles[profileToRemove];

  if (config.active_profile === profileToRemove) {
    const remainingProfiles = Object.keys(config.profiles);
    config.active_profile = remainingProfiles.length > 0 ? remainingProfiles[0] : undefined;
  }

  await saveGlobalConfig(config);

  console.log(`✓ Logged out from ${profileToRemove}`);
  if (config.active_profile) {
    console.log(`✓ Active profile is now: ${config.active_profile}`);
  } else {
    console.log('No active profiles remaining. Run "axiom auth login" to authenticate.');
  }
}

export function loadAuthLogoutCommand(auth: Command, root: Command): void {
  [auth, root].forEach((program) => {
    program
      .command('logout')
      .description('Remove authentication credentials')
      .option('-a, --alias <alias>', 'Profile alias to remove')
      .action(async (options) => {
        try {
          await logoutCommand(options.alias);
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
