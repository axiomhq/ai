import type { Command } from 'commander';
import { createDatasetsClient } from '../utils/axiom-client';
import { AxiomCLIError } from '../../util/errors';
import c from 'tinyrainbow';

export function loadDatasetUpdateCommand(parent: Command): void {
  parent
    .command('update')
    .description('Update dataset description')
    .argument('<name>', 'dataset name or ID')
    .option('-d, --description <DESCRIPTION>', 'new dataset description', '')
    .option('-t, --token <TOKEN>', 'axiom token')
    .option('-u, --url <AXIOM URL>', 'axiom url')
    .option('-o, --org-id <ORG ID>', 'axiom organization id')
    .action(async (name: string, options) => {
      try {
        if (options.description === undefined) {
          throw new AxiomCLIError('Description is required. Use --description flag.');
        }

        const client = createDatasetsClient({
          token: options.token,
          url: options.url,
          orgId: options.orgId,
        });

        const dataset = await client.update(name, {
          description: options.description,
        });

        console.log(c.green(`\n✓ Dataset updated successfully:\n`));
        console.log(c.bold(`  Name: ${dataset.name}`));
        console.log(c.dim(`  Description: ${dataset.description}`));
        console.log('');
      } catch (error) {
        if (error instanceof AxiomCLIError) {
          console.error(`\n${c.red('✗')} ${error.message}\n`);
          process.exit(1);
        }
        throw error;
      }
    });
}
