import type { Command } from 'commander';
import { loadAuthLoginCommand } from './auth-login.command';
import { loadAuthLogoutCommand } from './auth-logout.command';
import { loadAuthStatusCommand } from './auth-status.command';
import { loadAuthSwitchCommand } from './auth-switch.command';

export function loadAuthCommand(program: Command): void {
  const auth = program.command('auth').description('Manage authentication with Axiom');

  loadAuthLoginCommand(auth);
  loadAuthLogoutCommand(auth);
  loadAuthStatusCommand(auth);
  loadAuthSwitchCommand(auth);
}
