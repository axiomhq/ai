export function getCustomOrRegularAttribute(obj: unknown, accessKey: string): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }

  const keyParts = accessKey.split('.');
  const custom = (obj as Record<string, any>).custom;

  // Try `obj.custom['foo.bar']`
  if (custom && typeof custom === 'object' && custom !== null && accessKey in custom) {
    return custom[accessKey];
  }

  // Try `obj.foo.bar`
  let current: any = obj;
  for (const part of keyParts) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

export function getCustomOrRegularString(obj: unknown, key: string): string | undefined {
  const value = getCustomOrRegularAttribute(obj, key);

  return typeof value === 'string' ? value : undefined;
}

export function getCustomOrRegularNumber(obj: unknown, key: string): number | undefined {
  const value = getCustomOrRegularAttribute(obj, key);

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
}
