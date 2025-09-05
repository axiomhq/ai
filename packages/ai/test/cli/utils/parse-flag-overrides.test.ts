import { describe, it, expect } from 'vitest';
import { extractFlagOverrides } from 'src/cli/utils/parse-flag-overrides';

describe('extractFlagOverrides', () => {
  it('parses --flag.key=value syntax', () => {
    const argv = ['eval', '--flag.temperature=0.9', '--flag.model=gpt-4'];
    const result = extractFlagOverrides(argv);

    expect(result.cleanedArgv).toEqual(['eval']);
    expect(result.overrides).toEqual({
      temperature: 0.9,
      model: 'gpt-4',
    });
  });

  it('parses --flag.key value syntax (space-separated)', () => {
    // TODO: BEFORE MERGE - should we allow both `flag.key=value` AND `flag.key value` syntax?
    const argv = ['eval', '--flag.temperature', '0.7', '--flag.dryRun', 'true'];
    const result = extractFlagOverrides(argv);

    expect(result.cleanedArgv).toEqual(['eval']);
    expect(result.overrides).toEqual({
      temperature: 0.7,
      dryRun: true,
    });
  });

  it('treats bare flags as true', () => {
    const argv = ['--flag.enabled', '--flag.verbose'];
    const result = extractFlagOverrides(argv);

    expect(result.cleanedArgv).toEqual([]);
    expect(result.overrides).toEqual({
      enabled: true,
      verbose: true,
    });
  });

  it('coerces boolean strings', () => {
    const argv = ['--flag.enabled=true', '--flag.disabled=false'];
    const result = extractFlagOverrides(argv);

    expect(result.overrides).toEqual({
      enabled: true,
      disabled: false,
    });
  });

  it('coerces numbers', () => {
    // TODO: BEFORE MERGE - should we force strings to be in quotes to prevent coercion?
    const argv = ['--flag.count=42', '--flag.rate=0.5', '--flag.negative=-10'];
    const result = extractFlagOverrides(argv);

    expect(result.overrides).toEqual({
      count: 42,
      rate: 0.5,
      negative: -10,
    });
  });

  it('parses JSON objects', () => {
    const argv = ['--flag.config={"max":100,"enabled":true}'];
    const result = extractFlagOverrides(argv);

    expect(result.overrides).toEqual({
      config: { max: 100, enabled: true },
    });
  });

  it('keeps non-flag arguments in cleanedArgv', () => {
    const argv = ['eval', 'test.eval.ts', '--flag.temp=0.9', '--watch', '--flag.model=gpt-4'];
    const result = extractFlagOverrides(argv);

    expect(result.cleanedArgv).toEqual(['eval', 'test.eval.ts', '--watch']);
    expect(result.overrides).toEqual({
      temp: 0.9,
      model: 'gpt-4',
    });
  });

  it('handles last flag wins for duplicates', () => {
    // TODO: BEFORE MERGE - should we fail instead?
    const argv = ['--flag.temperature=0.7', '--flag.temperature=0.9'];
    const result = extractFlagOverrides(argv);

    expect(result.overrides).toEqual({
      temperature: 0.9,
    });
  });

  it('handles flag with no value followed by another flag', () => {
    const argv = ['--flag.enabled', '--flag.temperature=0.9'];
    const result = extractFlagOverrides(argv);

    expect(result.overrides).toEqual({
      enabled: true,
      temperature: 0.9,
    });
  });

  it('handles complex flag keys with hyphens', () => {
    const argv = ['--flag.max-tokens=1024', '--flag.dry-run=true'];
    const result = extractFlagOverrides(argv);

    expect(result.overrides).toEqual({
      'max-tokens': 1024,
      'dry-run': true,
    });
  });

  it('leaves invalid JSON as string', () => {
    const argv = ['--flag.config={invalid:json}'];
    const result = extractFlagOverrides(argv);

    expect(result.overrides).toEqual({
      config: '{invalid:json}',
    });
  });
});
