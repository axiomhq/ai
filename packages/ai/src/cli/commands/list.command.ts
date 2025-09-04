import { Command } from 'commander';

globalThis.__axiom_registry = {
  capabilities: [],
  steps: [],
  evals: []
}

__axiom_registry = {
  capabilities: [],
  steps: [],
  evals: []
}
import { collect, groupByCapability } from 'src/collector/collector.esbuild';

console.log(globalThis.__axiom_registry)

export const registerListCommand = (program: Command) => {
  const capsCmd = new Command('capabilities')
    .description('list all capabilites')
    .action(async () => {
      const registry = await collect('.');
      // const caps = groupByCapability(registry);

      // console.log('');
      // console.log('Capabilities:');
      // for (const key of Object.keys(caps)) {
      //   const cap = caps[key];
      //   console.log(' '.repeat(2), cap.capability + ':');
      //   for (const step of cap.steps) {
      //     console.log(' '.repeat(4), '-', step.name);
      //   }
      // }
      console.log(registry)
    });

  return program.addCommand(
    new Command('list').description('list resources locally').addCommand(capsCmd),
  );
};
