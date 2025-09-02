const registry = new Map<string, { type: string; value: string }>();

export const defineConfig = (key: string, value: any) => {
  registry.set(key, { type: value.constructor.name, value: JSON.stringify(value) });
  return { key, value };
};

export const getValue = (key: string, defaultValue: any) => {
  const config = registry.get(key);
  if (!config) {
    return defaultValue;
  }

  return JSON.parse(config.value) as typeof defaultValue;
};

export const setValue = (key: string, value: any): void => {
  registry.set(key, value);
};
