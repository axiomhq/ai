import path from 'path';
import fs from 'fs/promises';
import { build } from 'esbuild';
import glob from 'fast-glob';
import { pathToFileURL } from 'url';
import type { CapabilityDefinition, StepDefinition } from 'src/capabilities';
import type { EvalDefinition } from 'src/evals';
import { resetRegistry } from './registry';

export type Definition = {
  type: 'step' | 'eval' | 'capability';
  name: string;
  capability?: string;
  step?: string;
  file: string;
  def: StepDefinition | CapabilityDefinition | EvalDefinition;
};

async function loadTsConfigPaths(rootDir: string): Promise<Record<string, string[]> | null> {
  try {
    const tsconfigPath = path.join(rootDir, 'tsconfig.json');
    const tsconfigContent = await fs.readFile(tsconfigPath, 'utf-8');
    const tsconfig = JSON.parse(tsconfigContent);

    if (tsconfig.compilerOptions?.paths) {
      return tsconfig.compilerOptions.paths;
    }
  } catch {
    // Ignore errors, just return null if tsconfig is not found or invalid
  }
  return null;
}

async function findFilesWithDefinitions(files: string[]): Promise<string[]> {
  const targetFunctions = ['defineCapability', 'defineStep', 'defineConfig', 'defineEval'];

  const matchingFiles: string[] = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');

      // Check if file contains any of our target function calls
      const hasDefinitions = targetFunctions.some((fn) => content.includes(fn));

      if (hasDefinitions) {
        matchingFiles.push(file);
      }
    } catch (err) {
      // Skip files we can't read
      console.warn(`Could not read ${file}:`, err);
    }
  }

  return matchingFiles;
}

export async function collect(rootDir: string): Promise<Definition[]> {
  const allFiles = await glob(['**/*.{ts,js}'], {
    cwd: rootDir,
    ignore: ['node_modules'],
    absolute: true,
  });

  // Filter to only files that contain our target definitions
  const files = await findFilesWithDefinitions(allFiles);
  console.log(`Found ${files.length} files with definitions out of ${allFiles.length} total files`);
  console.log(
    'Files with definitions:',
    files.map((f) => path.relative(rootDir, f)),
  );

  const defs: Definition[] = [];
  const tsconfigPaths = await loadTsConfigPaths(rootDir);

  for (const file of files) {
    // resetRegistry();
    const outfile = path.join(rootDir, `.axiom/collector/tmp-${path.basename(file)}.mjs`);

    await build({
      entryPoints: [file],
      outfile,
      bundle: true,
      platform: 'node',
      format: 'esm',
      sourcemap: false,
      target: 'node22',
      // packages: 'external',
      external: ['node_modules/*'],
      // external: [ // ✅ skip bundling these
      //   ...Object.keys(require("./package.json").dependencies || {}),
      // ],
      // external: [
      //   // Node.js built-ins
      //   'fs',
      //   'fs/promises',
      //   'node:fs',
      //   'node:fs/promises',
      //   'readline',
      //   'node:readline',
      //   'path',
      //   'node:path',
      //   'os',
      //   'node:os',
      //   'url',
      //   'node:url',
      //   'util',
      //   'node:util',
      //   'crypto',
      //   'node:crypto',
      //   'events',
      //   'node:events',
      //   'stream',
      //   'node:stream',
      //   'buffer',
      //   'node:buffer',
      //   'process',
      //   'node:process',
      //   'http',
      //   'node:http',
      //   'https',
      //   'node:https',
      //   'querystring',
      //   'node:querystring',
      //   'zlib',
      //   'node:zlib',
      // ],
      // plugins: [
      //   {
      //     name: 'path-mapping-resolver',
      //     setup(build) {
      //       // Handle TypeScript path mappings
      //       if (tsconfigPaths) {
      //         build.onResolve({ filter: /./ }, ({ path: importPath, resolveDir }) => {
      //           for (const [pathMapping, targets] of Object.entries(tsconfigPaths)) {
      //             const pattern = pathMapping.replace('*', '(.*)');
      //             const regex = new RegExp(`^${pattern}$`);
      //             const match = importPath.match(regex);

      //             if (match) {
      //               // Use the first target and resolve the wildcard
      //               const target = targets[0].replace('*', match[1] || '');
      //               const resolvedPath = path.resolve(rootDir, target);

      //               // Try different extensions
      //               for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
      //                 const fullPath = resolvedPath + ext;
      //                 try {
      //                   // Don't need to actually check file existence, let esbuild handle it
      //                   return { path: fullPath };
      //                 } catch {
      //                   // Continue trying
      //                 }
      //               }

      //               return { path: resolvedPath };
      //             }
      //           }
      //           return undefined; // Let other plugins or default resolver handle it
      //         });
      //       }

      //       // Externalize npm packages
      //       build.onResolve({ filter: /^[^.\/]/ }, ({ path: importPath }) => {
      //         // Skip if this looks like a path mapping (already handled above)
      //         if (tsconfigPaths) {
      //           for (const pathMapping of Object.keys(tsconfigPaths)) {
      //             const pattern = pathMapping.replace('*', '(.*)');
      //             const regex = new RegExp(`^${pattern}$`);
      //             if (regex.test(importPath)) {
      //               return undefined; // Already handled by path mapping resolver
      //             }
      //           }
      //         }

      //         return { path: importPath, external: true };
      //       });
      //     },
      //   },
      // ],
    });

    try {
      // Change working directory to the target project so external modules resolve correctly
      const originalCwd = process.cwd();
      process.chdir(rootDir);
      const registry = globalThis.__axiom_registry;

      try {
        await import(pathToFileURL(outfile).href);

        for (const cap of registry.capabilities) {
          defs.push({ type: 'capability', name: cap.name, file, def: cap });
        }
        for (const step of registry.steps) {
          defs.push({ type: 'step', name: step.name, file, def: step });
        }
        for (const ev of registry.evals) {
          defs.push({
            type: 'eval',
            name: `${ev.capability}:${ev.step}`,
            capability: ev.capability,
            step: ev.step,
            file,
            def: ev,
          });
        }
      } finally {
        // Always restore the original working directory
        process.chdir(originalCwd);
      }
    } catch (err) {
      console.error(`Failed to import ${file}`, err);
    }
  }

  return defs;
}

export const groupByCapability = (definitions: Definition[]) => {
  // group capability steps and evals
  type Cap = {
    capability: string;
    file: string;
    steps: {
      name: string;
      capability: string;
      file: string;
      evals: { name: string; file: string }[];
    }[];
  };

  const result: Record<string, Cap> = {};
  // loop over registry
  for (const def of definitions) {
    // lookup steps
    if (def.type === 'capability') {
      if (!result[def.name]) {
        result[def.name] = {
          capability: def.name,
          file: def.file,
          steps: [],
        };
      }
    }

    if (def.type === 'step') {
      const step = def;
      if (step.capability) {
        if (!result[step.capability]) {
          result[def.name] = {
            capability: def.name,
            file: def.file,
            steps: [],
          };
        }
        result[step.capability].steps.push({
          name: step.name,
          capability: step.capability,
          file: step.file,
          evals: [],
        });
      }
    }

    if (def.type === 'eval') {
      const ev = def;
      if (ev.capability) {
        result[ev.capability].steps.map((step) => {
          if (step.name === ev.step) {
            step.evals.push({
              name: ev.name,
              file: ev.file,
            });
          }

          return step;
        });
      }
    }
  }
  return result;
};
