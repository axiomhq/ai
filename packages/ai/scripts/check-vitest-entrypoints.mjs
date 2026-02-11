#!/usr/bin/env node
// @ts-check

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(packageDir, 'package.json');
const distDir = path.join(packageDir, 'dist');

/**
 * 🚨🚨🚨🚨🚨🚨🚨🚨 The list of entrypoints that we expect to include vitest in the bundle
 * The check fails if actual vitest-bearing exports differ from this list.
 * @type {ReadonlySet<string>}
 */
const EXPECTED_VITEST_ENTRYPOINTS = new Set(['./ai/evals']);
const RUNTIME_EXTENSIONS = ['.js', '.cjs', '.mjs'];

/**
 * @typedef {{ specifier: string; file: string }} VitestHit
 * @typedef {{ from: string; specifier: string }} MissingLocalImport
 * @typedef {{
 *   entrypoint: string;
 *   vitestHits: VitestHit[];
 *   missingLocalImports: MissingLocalImport[];
 * }} EntrypointResult
 */

/** @param {string} value */
function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

/** @param {string} specifier */
function isVitestSpecifier(specifier) {
  return (
    specifier === 'vitest' || specifier.startsWith('vitest/') || specifier.startsWith('@vitest/')
  );
}

/**
 * @param {unknown} value
 * @returns {string | undefined}
 */
function getDefaultTarget(value) {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const defaultTarget = /** @type {Record<string, unknown>} */ (value).default;
  return typeof defaultTarget === 'string' ? defaultTarget : undefined;
}

function assertBuildOutput() {
  if (!fs.existsSync(distDir)) {
    console.error(
      `[check-vitest-entrypoints] Missing build output at ${toPosixPath(distDir)}. Run "pnpm -C packages/ai build" first.`,
    );
    process.exit(1);
  }
}

function readPackageJson() {
  try {
    return /** @type {{ exports?: Record<string, unknown> }} */ (
      JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    );
  } catch (error) {
    console.error(
      `[check-vitest-entrypoints] Failed to read ${toPosixPath(packageJsonPath)}: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

/** @param {unknown} exportTarget */
function collectRuntimeTargets(exportTarget) {
  /** @type {Set<string>} */
  const targets = new Set();
  if (!exportTarget || typeof exportTarget !== 'object') {
    return targets;
  }

  const exportTargetObj = /** @type {{ [key: string]: unknown }} */ (exportTarget);

  const importTarget = exportTargetObj.import;
  if (typeof importTarget === 'string') {
    targets.add(importTarget);
  } else {
    const importDefaultTarget = getDefaultTarget(importTarget);
    if (importDefaultTarget) {
      targets.add(importDefaultTarget);
    }
  }

  const requireTarget = exportTargetObj.require;
  if (typeof requireTarget === 'string') {
    targets.add(requireTarget);
  } else {
    const requireDefaultTarget = getDefaultTarget(requireTarget);
    if (requireDefaultTarget) {
      targets.add(requireDefaultTarget);
    }
  }

  if (typeof exportTargetObj.default === 'string') {
    targets.add(exportTargetObj.default);
  }

  if (typeof exportTargetObj.node === 'string') {
    targets.add(exportTargetObj.node);
  } else {
    const nodeDefaultTarget = getDefaultTarget(exportTargetObj.node);
    if (nodeDefaultTarget) {
      targets.add(nodeDefaultTarget);
    }
  }

  return new Set(
    [...targets]
      .filter((target) => target.startsWith('./dist/'))
      .filter((target) => RUNTIME_EXTENSIONS.some((ext) => target.endsWith(ext))),
  );
}

/** @param {{ exports?: Record<string, unknown> }} pkgJson */
function readEntrypointFiles(pkgJson) {
  /** @type {Map<string, Set<string>>} */
  const entrypoints = new Map();
  const exportsField = pkgJson.exports;
  if (!exportsField || typeof exportsField !== 'object') {
    console.error('[check-vitest-entrypoints] package.json exports field is missing or invalid.');
    process.exit(1);
  }

  for (const [subpath, target] of Object.entries(exportsField)) {
    if (!subpath.startsWith('./')) {
      continue;
    }
    const runtimeTargets = collectRuntimeTargets(target);
    if (runtimeTargets.size > 0) {
      entrypoints.set(subpath, runtimeTargets);
    }
  }

  if (entrypoints.size === 0) {
    console.error(
      '[check-vitest-entrypoints] No runtime entrypoints found in package.json exports.',
    );
    process.exit(1);
  }

  return entrypoints;
}

/** @param {string} fileContent */
function extractSpecifiers(fileContent) {
  /** @type {Set<string>} */
  const specifiers = new Set();

  const importExportPattern = /\b(?:import|export)\s+(?:[^"'`]*?\bfrom\s*)?["']([^"'`]+)["']/g;
  const dynamicImportPattern = /\bimport\s*\(\s*["']([^"'`]+)["']\s*\)/g;
  const requirePattern = /\brequire\s*\(\s*["']([^"'`]+)["']\s*\)/g;

  let match;
  while ((match = importExportPattern.exec(fileContent)) !== null) {
    specifiers.add(match[1]);
  }
  while ((match = dynamicImportPattern.exec(fileContent)) !== null) {
    specifiers.add(match[1]);
  }
  while ((match = requirePattern.exec(fileContent)) !== null) {
    specifiers.add(match[1]);
  }

  return specifiers;
}

/**
 * @param {string} fromFile
 * @param {string} specifier
 */
function resolveLocalImport(fromFile, specifier) {
  const [cleanSpecifier] = specifier.split(/[?#]/, 1);
  const resolvedBase = path.resolve(path.dirname(fromFile), cleanSpecifier);

  if (path.extname(resolvedBase)) {
    return fs.existsSync(resolvedBase) ? resolvedBase : null;
  }

  for (const extension of RUNTIME_EXTENSIONS) {
    const withExtension = `${resolvedBase}${extension}`;
    if (fs.existsSync(withExtension)) {
      return withExtension;
    }
  }

  for (const extension of RUNTIME_EXTENSIONS) {
    const indexPath = path.join(resolvedBase, `index${extension}`);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }

  return null;
}

/** @param {string[]} entrypointFiles */
function scanEntrypoint(entrypointFiles) {
  /** @type {Set<string>} */
  const visitedFiles = new Set();
  const filesToVisit = [...entrypointFiles];
  /** @type {VitestHit[]} */
  const vitestHits = [];
  /** @type {MissingLocalImport[]} */
  const missingLocalImports = [];

  while (filesToVisit.length > 0) {
    const currentFile = filesToVisit.pop();
    if (!currentFile || visitedFiles.has(currentFile)) {
      continue;
    }

    visitedFiles.add(currentFile);
    if (!fs.existsSync(currentFile)) {
      missingLocalImports.push({
        from: currentFile,
        specifier: '(entrypoint file missing)',
      });
      continue;
    }

    const content = fs.readFileSync(currentFile, 'utf8');
    const specifiers = extractSpecifiers(content);

    for (const specifier of specifiers) {
      if (specifier.startsWith('.')) {
        const resolved = resolveLocalImport(currentFile, specifier);
        if (resolved) {
          filesToVisit.push(resolved);
        } else {
          missingLocalImports.push({
            from: currentFile,
            specifier,
          });
        }
        continue;
      }

      if (isVitestSpecifier(specifier)) {
        vitestHits.push({
          specifier,
          file: currentFile,
        });
      }
    }
  }

  return { vitestHits, missingLocalImports };
}

/** @param {string} absolutePath */
function formatRelativePath(absolutePath) {
  return toPosixPath(path.relative(packageDir, absolutePath) || absolutePath);
}

/** @param {VitestHit[]} hits */
function uniqueVitestHits(hits) {
  /** @type {Map<string, VitestHit>} */
  const uniq = new Map();
  for (const hit of hits) {
    const key = `${hit.specifier}::${hit.file}`;
    if (!uniq.has(key)) {
      uniq.set(key, hit);
    }
  }
  return [...uniq.values()];
}

function main() {
  assertBuildOutput();

  const pkgJson = readPackageJson();
  const entrypoints = readEntrypointFiles(pkgJson);
  const configuredEntrypoints = new Set(entrypoints.keys());

  const unknownAllowedEntrypoints = [...EXPECTED_VITEST_ENTRYPOINTS].filter(
    (entrypoint) => !configuredEntrypoints.has(entrypoint),
  );
  if (unknownAllowedEntrypoints.length > 0) {
    console.error('[check-vitest-entrypoints] Allowed list includes unknown exports:');
    for (const entrypoint of unknownAllowedEntrypoints) {
      console.error(`  - ${entrypoint}`);
    }
    process.exit(1);
  }

  /** @type {EntrypointResult[]} */
  const entrypointResults = [];
  for (const [entrypoint, runtimeTargets] of entrypoints.entries()) {
    const absoluteTargets = [...runtimeTargets].map((runtimeTarget) =>
      path.resolve(packageDir, runtimeTarget.replace(/^\.\//, '')),
    );
    const { vitestHits, missingLocalImports } = scanEntrypoint(absoluteTargets);
    entrypointResults.push({
      entrypoint,
      vitestHits: uniqueVitestHits(vitestHits),
      missingLocalImports,
    });
  }

  const entrypointsWithVitest = new Set(
    entrypointResults
      .filter((result) => result.vitestHits.length > 0)
      .map((result) => result.entrypoint),
  );

  const unexpectedEntrypoints = [...entrypointsWithVitest]
    .filter((entrypoint) => !EXPECTED_VITEST_ENTRYPOINTS.has(entrypoint))
    .sort();
  const staleAllowedEntrypoints = [...EXPECTED_VITEST_ENTRYPOINTS]
    .filter((entrypoint) => !entrypointsWithVitest.has(entrypoint))
    .sort();

  const allMissingImports = entrypointResults.flatMap((result) =>
    result.missingLocalImports.map((missing) => ({ ...missing, entrypoint: result.entrypoint })),
  );

  console.log('[check-vitest-entrypoints] Entrypoint vitest scan results:');
  for (const result of entrypointResults.sort((a, b) => a.entrypoint.localeCompare(b.entrypoint))) {
    if (result.vitestHits.length === 0) {
      console.log(`  - ${result.entrypoint}: no vitest imports`);
      continue;
    }
    const descriptions = result.vitestHits
      .map((hit) => `${hit.specifier} (${formatRelativePath(hit.file)})`)
      .sort();
    console.log(`  - ${result.entrypoint}: ${descriptions.join(', ')}`);
  }

  if (allMissingImports.length > 0) {
    console.error('[check-vitest-entrypoints] Found unresolved local imports while scanning dist:');
    for (const missing of allMissingImports) {
      console.error(
        `  - ${missing.entrypoint}: "${missing.specifier}" from ${formatRelativePath(missing.from)}`,
      );
    }
    process.exit(1);
  }

  if (unexpectedEntrypoints.length > 0) {
    console.error(
      '[check-vitest-entrypoints] Unexpected vitest imports in disallowed entrypoints:',
    );
    for (const entrypoint of unexpectedEntrypoints) {
      const details = entrypointResults.find((result) => result.entrypoint === entrypoint);
      if (!details) {
        continue;
      }
      for (const hit of details.vitestHits.sort((a, b) => a.file.localeCompare(b.file))) {
        console.error(`  - ${entrypoint}: ${hit.specifier} from ${formatRelativePath(hit.file)}`);
      }
    }
    process.exit(1);
  }

  if (staleAllowedEntrypoints.length > 0) {
    console.error('[check-vitest-entrypoints] Allowed entrypoints no longer import vitest:');
    for (const entrypoint of staleAllowedEntrypoints) {
      console.error(`  - ${entrypoint}`);
    }
    console.error(
      '[check-vitest-entrypoints] Update VITEST_ALLOWED_ENTRYPOINTS to keep this policy explicit.',
    );
    process.exit(1);
  }

  console.log('[check-vitest-entrypoints] Policy check passed.');
}

main();
