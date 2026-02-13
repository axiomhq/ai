import type { Command } from 'commander';
import { createDatasetsClient } from '../utils/axiom-client';
import { AxiomCLIError } from '../../util/errors';
import c from 'tinyrainbow';

export function loadDatasetDeleteCommand(parent: Command): void {
  parent
    .command('delete')
    .description('Delete a dataset')
    .argument('<name>', 'dataset name or ID')
    .option('-t, --token <TOKEN>', 'axiom token')
    .option('-u, --url <AXIOM URL>', 'axiom url')
    .option('-o, --org-id <ORG ID>', 'axiom organization id')
    .option('-y, --yes', 'skip confirmation prompt', false)
    .action(async (name: string, options) => {
      try {
        const client = createDatasetsClient({
          token: options.token,
          url: options.url,
          orgId: options.orgId,
        });

        // Confirmation prompt (unless --yes flag is provided)
        if (!options.yes) {
          const readline = await import('node:readline/promises');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          const answer = await rl.question(
            c.yellow(
              `\n⚠ Are you sure you want to delete dataset "${name}"? This cannot be undone. (y/N): `,
            ),
          );
          rl.close();

          if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log(c.dim('\nDeletion cancelled.'));
            return;
          }
        }

        const response = await client.delete(name);

        if (response.status === 204) {
          console.log(c.green(`\n✓ Dataset "${name}" deleted successfully.\n`));
        } else {
          throw new AxiomCLIError(`Failed to delete dataset. Status: ${response.status}`);
        }
      } catch (error) {
        if (error instanceof AxiomCLIError) {
          console.error(`\n${c.red('✗')} ${error.message}\n`);
          process.exit(1);
        }
        throw error;
      }
    });
}
