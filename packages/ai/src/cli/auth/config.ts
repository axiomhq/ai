import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type { Config, Deployment } from './types';

const CONFIG_FILENAME = '.axiom.json';

export function getConfigPath(): string {
  return path.join(os.homedir(), CONFIG_FILENAME);
}

export async function loadConfig(): Promise<Config> {
  const configPath = getConfigPath();
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

export function loadConfigSync(): Config {
  const configPath = getConfigPath();
  try {
    const content = require('fs').readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { deployments: {} };
    }
    throw error;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const configPath = getConfigPath();
  const content = JSON.stringify(config, null, 2);
  await fs.writeFile(configPath, content, 'utf-8');
}

export function getActiveDeployment(config: Config): Deployment | null {
  const envToken = process.env.AXIOM_TOKEN;
  const envUrl = process.env.AXIOM_URL;
  const envOrgId = process.env.AXIOM_ORG_ID;
  const envDeployment = process.env.AXIOM_DEPLOYMENT;

  // Full override via env vars
  if (envToken || envUrl) {
    return {
      url: envUrl || 'https://api.axiom.co',
      token: envToken || '',
      org_id: envOrgId || '',
    };
  }

  // Get from config
  const deploymentName = envDeployment || config.active_deployment;
  if (!deploymentName) return null;

  const deployment = config.deployments[deploymentName];
  if (!deployment) return null;

  // Apply env overrides
  return {
    url: envUrl || deployment.url,
    token: envToken || deployment.token,
    org_id: envOrgId || deployment.org_id,
  };
}

export function getAxiomToken(): string {
  if (process.env.AXIOM_TOKEN) {
    return process.env.AXIOM_TOKEN;
  }

  const config = loadConfigSync();
  const deployment = getActiveDeployment(config);
  return deployment?.token || '';
}
