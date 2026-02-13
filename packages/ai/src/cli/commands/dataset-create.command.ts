import type { Command } from 'commander';
import { createDatasetsClient } from '../utils/axiom-client';
import { AxiomCLIError } from '../../util/errors';
import c from 'tinyrainbow';

export function loadDatasetCreateCommand(parent: Command): void {
  parent
    .command('create')
    .description('Create a new dataset')
    .argument('<name>', 'dataset name')
    .option('-d, --description <DESCRIPTION>', 'dataset description')
    .option('-r, --region <REGION>', 'dataset region')
    .option('-t, --token <TOKEN>', 'axiom token')
    .option('-u, --url <AXIOM URL>', 'axiom url')
    .option('-o, --org-id <ORG ID>', 'axiom organization id')
    .action(async (name: string, options) => {
      try {
        const client = createDatasetsClient({
          token: options.token,
          url: options.url,
          orgId: options.orgId,
        });

        const dataset = await client.create({
          name,
          description: options.description,
          region: options.region,
        });

        console.log(c.green(`\n✓ Dataset created successfully:\n`));
        console.log(c.bold(`  Name: ${dataset.name}`));
        if (dataset.description) {
          console.log(c.dim(`  Description: ${dataset.description}`));
        }
        console.log(c.dim(`  ID: ${dataset.id}`));
        console.log(c.dim(`  Created: ${dataset.created}`));
        if (dataset.region) {
          console.log(c.dim(`  Region: ${dataset.region}`));
        }
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
