import { Command } from 'commander';
import {
  loadPromptModule,
  extractPromptFromModule,
  generatePromptFileFromApiResponse,
} from '../transpiler';
import { loadConfigAsync, printConfigWarning } from '../config';
import type { Prompt } from '../types';
import fs from 'node:fs/promises';
import readline from 'node:readline';

async function askConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

export const loadPushCommand = (program: Command) => {
  const push = new Command('push')
    .description('Push a new version of an object')
    .argument(
      '<object>',
      'The object to push, could be a prompt, en eval, a monitor, a dashboard, etc.',
    )
    .option('--prod', 'Adds the production tag to the prompt')
    .option('--yes', 'Automatically confirm overwriting the file with server response')
    .action(async (filePath: string, options: { yes?: boolean; prod?: boolean }) => {
      const { config, error } = await loadConfigAsync();

      if (error) {
        console.error(error);
        return;
      }

      if (!config) {
        printConfigWarning();
        return;
      }

      let content: Prompt | null = null;
      if (!filePath.endsWith('.prompt.ts')) {
        console.error('Prompt files must end with .prompt.ts');
        process.exit(1);
      }

      try {
        const moduleContent = await loadPromptModule(filePath);
        const promptData = extractPromptFromModule(moduleContent, filePath);

        content = promptData;

        console.log(`Transpiled prompt: ${promptData.name} (${promptData.slug})`);
      } catch (error) {
        console.error('Failed to transpile prompt file:', error);
        process.exit(1);
      }

      if (!content) {
        console.error('No content found');
        process.exit(1);
      }

      let shouldProceed = options.yes;
      if (!shouldProceed) {
        shouldProceed = await askConfirmation(
          `This will push "${content.name}" to Axiom and overwrite ${filePath}, are you sure you want to continue?`,
        );
      }

      if (!shouldProceed) {
        console.log('Push operation cancelled.');
        process.exit(0);
      }

      try {
        const response = await fetch(`${config.url}/v1/prompts`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.ai.evals.token}`,
            'Content-Type': 'application/json',
            'x-axiom-client': 'axiom-ai-cli',
            'x-axiom-check': 'good',
          },
          body: JSON.stringify({
            ...content,
            tags: options.yes ? ['production'] : [],
          }),
        });

        if (!response.ok) {
          try {
            const errorText = await response.clone().json();
            console.error(`Failed to fetch prompt: ${response.status} ${response.statusText}`);
            console.error(JSON.stringify(errorText, null, 2));
            process.exit(1);
          } catch (_error) {
            const errorText = await response.clone().text();
            console.error(`Failed to fetch prompt: ${response.status} ${response.statusText}`);
            console.error(errorText);
            process.exit(1);
          }
        }

        const apiResponse = await response.json();
        console.log(
          `Successfully pushed prompt: ${apiResponse.prompt.name} (${apiResponse.prompt.slug})`,
        );
        console.log(`Version: ${apiResponse.version.version}`);

        const updatedTsContent = generatePromptFileFromApiResponse(apiResponse);

        await fs.writeFile(filePath, updatedTsContent, 'utf-8');

        console.log(`Successfully updated ${filePath}`);
      } catch (error) {
        console.error('Failed to push prompt:', error);
        process.exit(1);
      }
    });

  program.addCommand(push);
};
