import type { Command } from 'commander';
import { loadConfig, getActiveDeployment } from '../auth/config';
import { verifyToken } from '../auth/api';
import { AxiomCLIError } from '../errors';

export async function statusCommand(): Promise<void> {
  const config = await loadConfig();

  if (Object.keys(config.deployments).length === 0) {
    console.log('No authenticated deployments found.');
    console.log('Run "axiom auth login" to authenticate.');
    return;
  }

  console.log('\nAuthentication Status:\n');

  for (const [alias, deployment] of Object.entries(config.deployments)) {
    const isActive = config.active_deployment === alias;
    const marker = isActive ? '→' : ' ';

    try {
      const isValid = await verifyToken(deployment.token, deployment.org_id);
      const status = isValid ? '✓' : '✗';
      const statusText = isValid ? 'Valid' : 'Invalid';

      console.log(`${marker} ${status} ${alias}`);
      console.log(`    URL: ${deployment.url}`);
      console.log(`    Org ID: ${deployment.org_id}`);
      console.log(`    Status: ${statusText}`);
      if (isActive) {
        console.log(`    (Active)`);
      }
      console.log();
    } catch (error) {
      console.log(`${marker} ✗ ${alias}`);
      console.log(`    URL: ${deployment.url}`);
      console.log(`    Org ID: ${deployment.org_id}`);
      console.log(`    Status: Error - ${(error as Error).message}`);
      if (isActive) {
        console.log(`    (Active)`);
      }
      console.log();
    }
  }

  const activeDeployment = getActiveDeployment(config);
  if (process.env.AXIOM_TOKEN) {
    console.log('Note: Using AXIOM_TOKEN environment variable (overrides config file)\n');
  } else if (activeDeployment && config.active_deployment) {
    console.log(`Active deployment: ${config.active_deployment}\n`);
  }
}

export function loadAuthStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Check authentication status for all deployments')
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
}
