export const CONFIG_FILE_NOT_FOUND = 'CONFIG_FILE_NOT_FOUND';

export class ConfigNotFoundError extends Error {
  constructor() {
    super('Config file not found');
    this.name = 'ConfigNotFoundError';
  }
}
