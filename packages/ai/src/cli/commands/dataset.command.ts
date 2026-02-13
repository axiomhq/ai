import type { Command } from 'commander';
import { loadDatasetListCommand } from './dataset-list.command';
import { loadDatasetCreateCommand } from './dataset-create.command';
import { loadDatasetGetCommand } from './dataset-get.command';
import { loadDatasetUpdateCommand } from './dataset-update.command';
import { loadDatasetDeleteCommand } from './dataset-delete.command';
import { loadDatasetTrimCommand } from './dataset-trim.command';

export function loadDatasetCommand(program: Command): void {
  const dataset = program.command('dataset').alias('datasets').description('Manage Axiom datasets');

  loadDatasetListCommand(dataset);
  loadDatasetCreateCommand(dataset);
  loadDatasetGetCommand(dataset);
  loadDatasetUpdateCommand(dataset);
  loadDatasetDeleteCommand(dataset);
  loadDatasetTrimCommand(dataset);
}
