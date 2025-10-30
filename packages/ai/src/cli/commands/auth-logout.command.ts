import type { Command } from 'commander';
import { loadConfig, saveConfig } from '../auth/config';
import { AxiomCLIError } from '../errors';

export async function logoutCommand(alias?: string): Promise<void> {
  const config = await loadConfig();

  const deploymentToRemove = alias || config.active_deployment;

  if (!deploymentToRemove) {
    throw new AxiomCLIError(
      'No active deployment. Use --alias to specify which deployment to remove.',
    );
  }

  if (!config.deployments[deploymentToRemove]) {
    throw new AxiomCLIError(`Deployment "${deploymentToRemove}" not found`);
  }

  delete config.deployments[deploymentToRemove];

  if (config.active_deployment === deploymentToRemove) {
    const remainingDeployments = Object.keys(config.deployments);
    config.active_deployment =
      remainingDeployments.length > 0 ? remainingDeployments[0] : undefined;
  }

  await saveConfig(config);

  console.log(`✓ Logged out from ${deploymentToRemove}`);
  if (config.active_deployment) {
    console.log(`✓ Active deployment is now: ${config.active_deployment}`);
  } else {
    console.log('No active deployments remaining. Run "axiom auth login" to authenticate.');
  }
}

export function loadAuthLogoutCommand(program: Command): void {
  program
    .command('logout')
    .description('Remove authentication credentials')
    .option('-a, --alias <alias>', 'Deployment alias to remove')
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
}
