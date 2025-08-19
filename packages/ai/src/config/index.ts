import { z } from 'zod/v4';
// intentionally import `unconfig` dynamically in loader to work in CJS
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

// Using `unconfig` supports multiple file extensions out of the box

export async function loadConfigAsync(path?: string): Promise<
  | {
      config: AxiomConfig;
      error: null;
    }
  | {
      config: null;
      error: string;
    }
> {
  try {
    const { loadConfig } = await import('unconfig');
    const { config: loadedConfig, sources } = await loadConfig<AxiomConfig>({
      sources: [
        {
          files: 'axiom.config',
          extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json', ''],
        },
        {
          files: 'package.json',
          extensions: [],
          rewrite(pkg: any) {
            return pkg?.axiom;
          },
        },
      ],
      merge: false,
      cwd: path || process.cwd(),
    });

    if (!sources.length) {
      return { error: CONFIG_FILE_NOT_FOUND, config: null };
    }

    const { data, error: validationError } = AxiomConfigSchema.safeParse(loadedConfig);
    if (data && !validationError) {
      return { config: data, error: null };
    }

    return { error: z.prettifyError(validationError), config: null };
  } catch (error) {
    console.error(error);
    return { error: CONFIG_FILE_NOT_FOUND, config: null };
  }
}

export const printConfigWarning = () => {
  console.error(`
⚠️  Config file not found!

Create an axiom.config.{ts,mts,cts,js,mjs,cjs,json} file in your project root, or add an "axiom" field to your package.json.

For JavaScript:

import { defineConfig } from 'axiom/config';

export default defineConfig({
  url: "https://api.axiom.co",
  ai: {
    evals: {
      dataset: "my-dataset",
      token: "xaat-..."
    }
  }
});
`);
};
