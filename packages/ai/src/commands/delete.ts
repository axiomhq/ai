import { Command } from 'commander';
import { deleteObject } from '../apex';

export const loadDeleteCommand = (program: Command) => {
  const deleteCmd = new Command('delete')
    .description('Delete an object')
    .argument(
      '<objectId>',
      'The object id to delete, could be a prompt, en eval, a monitor, a dashboard, etc.',
    )
    .action(async (objectId: string) => {
      // TODO: ask for confirmation?
      await deleteObject(objectId);
    });

  program.addCommand(deleteCmd);
};
