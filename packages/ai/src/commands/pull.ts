import { Command } from 'commander';
import { generatePromptFileFromApiResponse } from '../transpiler';
import * as fs from 'fs/promises';
import * as path from 'path';

export const loadPullCommand = (program: Command) => {
  const pull = new Command('pull')
    .description('Pull a version of an object')
    .argument(
      '<slug>',
      'The object to pull, could be a prompt, en eval, a monitor, a dashboard, etc.',
    )
    .option('--version <version>', 'The version to pull, default: latest', 'latest')
    .option('--output <path>', 'Output file path (optional, defaults to <slug>.prompt.ts)')
    .action(async (slug: string, options: { version: string; output?: string }) => {
      try {
        console.log(`Pulling prompt: ${slug} (version: ${options.version})`);

        const url = `${process.env.AXIOM_URL}/v1/prompts/${slug}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
            'Content-Type': 'application/json',
            'x-axiom-client': 'axiom-ai-cli',
            'x-axiom-check': 'good',
          },
        });

        if (!response.ok) {
          try {
            const errorText = await response.clone().json();
            console.error(`Failed to fetch prompt: ${response.status} ${response.statusText}`);
            console.error(JSON.stringify(errorText, null, 2));
            process.exit(1);
          } catch (error) {
            const errorText = await response.clone().text();
            console.error(`Failed to fetch prompt: ${response.status} ${response.statusText}`);
            console.error(errorText);
            process.exit(1);
          }
        }

        const apiResponse = await response.json();

        const tsContent = generatePromptFileFromApiResponse(apiResponse);

        const outputPath = options.output || `${slug}.prompt.ts`;
        const fullPath = path.resolve(outputPath);

        await fs.writeFile(fullPath, tsContent, 'utf-8');

        console.log(`Successfully generated prompt file: ${fullPath}`);
        console.log(`Prompt: ${apiResponse.prompt.name} (${apiResponse.prompt.slug})`);
        console.log(`Version: ${apiResponse.version.version}`);
      } catch (error) {
        console.error('Failed to pull prompt:', error);
        process.exit(1);
      }
    });

  program.addCommand(pull);
};
