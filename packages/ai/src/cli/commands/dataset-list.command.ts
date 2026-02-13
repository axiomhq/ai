import type { Command } from 'commander';
import { createDatasetsClient } from '../utils/axiom-client';
import { AxiomCLIError } from '../../util/errors';
import c from 'tinyrainbow';

export function loadDatasetListCommand(parent: Command): void {
  parent
    .command('list')
    .description('List all datasets')
    .option('-t, --token <TOKEN>', 'axiom token')
    .option('-u, --url <AXIOM URL>', 'axiom url')
    .option('-o, --org-id <ORG ID>', 'axiom organization id')
    .action(async (options) => {
      try {
        const client = createDatasetsClient({
          token: options.token,
          url: options.url,
          orgId: options.orgId,
        });

        const datasets = await client.list();

        if (datasets.length === 0) {
          console.log(c.yellow('No datasets found.'));
          return;
        }

        console.log(
          c.green(`\n✓ Found ${datasets.length} dataset${datasets.length > 1 ? 's' : ''}:\n`),
        );

        for (const dataset of datasets) {
          console.log(c.bold(`  ${dataset.name}`));
          if (dataset.description) {
            console.log(c.dim(`    ${dataset.description}`));
          }
          console.log(c.dim(`    ID: ${dataset.id} | Created: ${dataset.created}`));
          if (dataset.region) {
            console.log(c.dim(`    Region: ${dataset.region}`));
          }
          console.log('');
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
