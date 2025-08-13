import { loadConfigAsync } from '../../src/config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { describe, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Temporarily override process.cwd to test config loading
// const originalCwd = process.cwd;
process.cwd = () => __dirname;

describe('load config from axiom.config.mjs', () => {
  it('load config from axiom.config.mjs', async () => {
    const config = await loadConfigAsync();
    console.log('Loaded config:', JSON.stringify(config, null, 2));
    if (config) {
      console.log('✅ Successfully loaded TypeScript config with esbuild!');
    } else {
      console.log('❌ Failed to load config');
    }
  });
});
