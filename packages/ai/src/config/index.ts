import { join } from 'path';
import { z } from 'zod/v4';
import { existsSync } from 'fs';
import { CONFIG_FILE_NOT_FOUND } from './errors';
import { AxiomConfigSchema } from './schema';

export type AxiomConfig = z.infer<typeof AxiomConfigSchema>;

/**
 * Define a typed configuration for Axiom.
 * This function provides TypeScript autocomplete and validation for your config.
 *
 * @param config - The configuration object
 * @returns The same configuration object with proper typing
 *
 * @example
 * ```typescript
 * import { defineConfig } from 'axiom/ai';
 *
 * export default defineConfig({
 *   url: "https://api.axiom.co",
 *   ai: {
 *     evals: {
 *       dataset: "my-dataset",
 *       token: "xaat-..."
 *     }
 *   }
 * });
 * ```
 */
export function defineConfig(config: AxiomConfig): AxiomConfig {
  return AxiomConfigSchema.parse(config);
}

// TODO: support TS files
const CONFIG_FILE_NAMES = ['axiom.config.mjs', 'axiom.config.js'];

export async function loadConfigAsync(): Promise<
  | {
      config: AxiomConfig;
      error: null;
    }
  | {
      config: null;
      error: string;
    }
> {
  const cwd = process.cwd();

  for (const configFileName of CONFIG_FILE_NAMES) {
    const configPath = join(cwd, configFileName);

    try {
      if (!existsSync(configPath)) {
        continue;
      }

      let config: AxiomConfig;

      // Use dynamic import for JavaScript files
      const configModule = await import(configPath);
      config = configModule.default || (configModule as AxiomConfig);
      console.debug({ config });

      const { data, error } = AxiomConfigSchema.safeParse(config);
      if (data && !error) {
        return { config: data, error: null };
      }

      return { error: z.prettifyError(error), config: null };
    } catch (error) {
      console.error(error);
      // File doesn't exist or can't be loaded, try next filename
      continue;
    }
  }

  return { error: CONFIG_FILE_NOT_FOUND, config: null };
}

export function printConfigWarning(): void {
  console.error(`
⚠️  Config file not found!

Create an axiom.config.js or axiom.config.mjs file in your project root.

For JavaScript:

import { defineConfig } from 'axiom/config';

export default defineConfig({
  url: "https://api.axiom.co",
  ai: {
    evals: {
      dataset: "your-dataset-name",
      token: "your-axiom-token"
    }
  }
});
`);
}
