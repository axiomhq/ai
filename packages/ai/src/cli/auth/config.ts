import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type { Config, Profile } from './types';

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
      return { profiles: {} };
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

export function getActiveProfile(config: Config): Profile | null {
  // Get from config
  const profileName = config.active_profile;
  if (!profileName) return null;

  const profile = config.profiles[profileName];
  if (!profile) return null;

  return profile;
}
