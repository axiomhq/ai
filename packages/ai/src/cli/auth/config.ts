import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type { Config, Deployment } from './types';

const CONFIG_FILENAME = 'config.json';
const CONFIG_DIR_NAME = 'axiom';

/**
 * Gets the OS-appropriate config directory path.
 * - Linux/Unix: ~/.config/axiom
 * - macOS: ~/Library/Application Support/axiom
 * - Windows: %APPDATA%\axiom
 */
export function getConfigDir(): string {
  const platform = process.platform;
  const homeDir = os.homedir();

  // Linux/Unix: ~/.config/axiom (or $XDG_CONFIG_HOME/axiom if set)
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  if (xdgConfigHome) {
    return path.join(xdgConfigHome, CONFIG_DIR_NAME);
  }

  if (platform === 'win32') {
    // Windows: %APPDATA%\axiom
    const appData = process.env.APPDATA;
    if (appData) {
      return path.join(appData, CONFIG_DIR_NAME);
    }
    // Fallback to home directory if APPDATA is not set
    return path.join(homeDir, 'AppData', 'Roaming', CONFIG_DIR_NAME);
  }

  return path.join(homeDir, '.config', CONFIG_DIR_NAME);
}

/**
 * Gets the full path to the config file.
 */
export function getGlobalConfigPath(): string {
  return path.join(getConfigDir(), CONFIG_FILENAME);
}

export async function loadGlobalConfig(): Promise<Config> {
  const configPath = getGlobalConfigPath();
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { deployments: {} };
    }
    throw error;
  }
}

export function loadGlobalConfigSync(): Config {
  const configPath = getGlobalConfigPath();
  const fsSync = require('fs');

  try {
    const content = fsSync.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { deployments: {} };
    }
    throw error;
  }
}

export async function saveGlobalConfig(config: Config): Promise<void> {
  const configPath = getGlobalConfigPath();
  const configDir = path.dirname(configPath);
  const content = JSON.stringify(config, null, 2);

  // Ensure config directory exists
  await fs.mkdir(configDir, { recursive: true, mode: 0o700 });

  // Write config file
  await fs.writeFile(configPath, content, 'utf-8');

  // Set restrictive permissions (read/write for owner only)
  // Note: chmod is a no-op on Windows, but that's fine
  await fs.chmod(configPath, 0o600);
}

export function getActiveDeployment(config: Config): Deployment | null {
  // Get from config
  const deploymentName = config.active_deployment;
  if (!deploymentName) return null;

  const deployment = config.deployments[deploymentName];
  if (!deployment) return null;

  return deployment;
}

export function getAxiomToken(): string {
  if (process.env.AXIOM_TOKEN) {
    return process.env.AXIOM_TOKEN;
  }

  const config = loadGlobalConfigSync();
  const deployment = getActiveDeployment(config);
  return deployment?.token || '';
}
