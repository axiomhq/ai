import type { Command } from 'commander';
import { loadGlobalConfig, saveGlobalConfig } from '../auth/config';
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

export async function switchCommand(alias?: string): Promise<void> {
  const config = await loadGlobalConfig();

  if (Object.keys(config.deployments).length === 0) {
    throw new AxiomCLIError(
      'No authenticated deployments found. Run "axiom auth login" to authenticate.',
    );
  }

  let selectedAlias: string;

  if (alias) {
    // Use provided alias
    if (!config.deployments[alias]) {
      throw new AxiomCLIError(`Deployment "${alias}" not found`);
    }
    selectedAlias = alias;
  } else {
    // Prompt for selection
    const deployments = Object.entries(config.deployments).map(([alias, deployment]) => ({
      name: `${alias} (${deployment.url})`,
      value: alias,
    }));

    if (deployments.length === 1) {
      selectedAlias = deployments[0].value;
      console.log(`✓ Using deployment: ${selectedAlias}\n`);
    } else {
      selectedAlias = await promptSelect('Select a deployment to switch to:', deployments);
    }
  }

  // Check if already active
  if (config.active_deployment === selectedAlias) {
    console.log(`✓ Deployment "${selectedAlias}" is already active\n`);
    return;
  }

  // Set as active
  config.active_deployment = selectedAlias;
  await saveGlobalConfig(config);

  console.log(`✓ Switched to deployment: ${selectedAlias}\n`);
}

export function loadAuthSwitchCommand(program: Command): void {
  program
    .command('switch')
    .description('Switch to a different deployment')
    .argument('[alias]', 'Deployment alias to switch to')
    .action(async (alias?: string) => {
      try {
        await switchCommand(alias);
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

