import type { Command } from 'commander';
import { createDatasetsClient } from '../utils/axiom-client';
import { AxiomCLIError } from '../../util/errors';
import c from 'tinyrainbow';

export function loadDatasetTrimCommand(parent: Command): void {
  parent
    .command('trim')
    .description('Trim dataset by time duration (removes data older than specified duration)')
    .argument('<name>', 'dataset name or ID')
    .argument('<duration>', 'duration to keep (e.g., "30m", "24h", "7d")')
    .option('-t, --token <TOKEN>', 'axiom token')
    .option('-u, --url <AXIOM URL>', 'axiom url')
    .option('-o, --org-id <ORG ID>', 'axiom organization id')
    .option('-y, --yes', 'skip confirmation prompt', false)
    .action(async (name: string, duration: string, options) => {
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
              `\n⚠ Are you sure you want to trim dataset "${name}" to keep only the last ${duration}? This cannot be undone. (y/N): `,
            ),
          );
          rl.close();

          if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log(c.dim('\nTrim cancelled.'));
            return;
          }
        }

        const result = await client.trim(name, duration);

        console.log(
          c.green(`\n✓ Dataset "${name}" trimmed successfully to keep last ${duration}.\n`),
        );
        if (result) {
          console.log(c.dim(`  Trim result: ${JSON.stringify(result)}\n`));
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
