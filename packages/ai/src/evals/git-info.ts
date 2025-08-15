import { execSync } from 'node:child_process';

export function getGitUserInfo() {
  try {
    const name = execSync('git config --get user.name').toString().trim();
    const email = execSync('git config --get user.email').toString().trim();
    return { name, email };
  } catch {
    return null; // Git not installed or not configured
  }
}
