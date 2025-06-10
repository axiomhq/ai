import { Command } from 'commander';
import { createObject } from '../apex';

export const loadPushCommand = (program: Command) => {
   const push =  new Command('push')
  .description('Push a new version of an object')
  .argument('<object>', 'The object to push, could be a prompt, en eval, a monitor, a dashboard, etc.')
  .action(async (path: string) => {
    const object = await createObject(path)
    console.log('Object created', object)
  });

  program.addCommand(push);
}
