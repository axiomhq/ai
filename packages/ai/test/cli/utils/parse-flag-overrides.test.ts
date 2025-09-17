import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractFlagOverrides, extractOverrides } from 'src/cli/utils/parse-flag-overrides';
import { readFileSync } from 'node:fs';

// Mock fs module
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}));

const mockReadFileSync = vi.mocked(readFileSync);

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

describe('extractOverrides', () => {
  // Mock console.error and process.exit for error handling tests
  let mockConsoleError: any;
  let mockProcessExit: any;

  beforeEach(() => {
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockProcessExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    mockReadFileSync.mockClear();
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  describe('CLI mode (existing behavior)', () => {
    it('works with CLI flags only', () => {
      const argv = ['eval', '--flag.temperature=0.9', '--flag.model=gpt-4'];
      const result = extractOverrides(argv);

      expect(result.cleanedArgv).toEqual(['eval']);
      expect(result.overrides).toEqual({
        temperature: 0.9,
        model: 'gpt-4',
      });
    });

    it('works with no flags', () => {
      const argv = ['eval', 'test.eval.ts', '--watch'];
      const result = extractOverrides(argv);

      expect(result.cleanedArgv).toEqual(['eval', 'test.eval.ts', '--watch']);
      expect(result.overrides).toEqual({});
    });
  });

  describe('Config mode', () => {
    it('loads config file with --flags-config=path syntax', () => {
      mockReadFileSync.mockReturnValue('{"temperature": 0.9, "model": "gpt-4o-mini"}');

      const argv = ['eval', '--flags-config=test-flags.json'];
      const result = extractOverrides(argv);

      expect(result.cleanedArgv).toEqual(['eval']);
      expect(result.overrides).toEqual({
        temperature: 0.9,
        model: 'gpt-4o-mini',
      });
      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test-flags.json'),
        'utf8',
      );
    });

    it('loads config file with --flags-config path syntax (space-separated)', () => {
      mockReadFileSync.mockReturnValue('{"temperature": 0.7}');

      const argv = ['eval', '--flags-config', 'config/flags.json'];
      const result = extractOverrides(argv);

      expect(result.cleanedArgv).toEqual(['eval']);
      expect(result.overrides).toEqual({
        temperature: 0.7,
      });
    });

    it('works with partial config (subset of flags)', () => {
      mockReadFileSync.mockReturnValue('{"temperature": 0.8}');

      const argv = ['--flags-config=partial.json'];
      const result = extractOverrides(argv);

      expect(result.overrides).toEqual({
        temperature: 0.8,
      });
    });

    it('works with empty config object', () => {
      mockReadFileSync.mockReturnValue('{}');

      const argv = ['--flags-config=empty.json'];
      const result = extractOverrides(argv);

      expect(result.overrides).toEqual({});
    });
  });

  describe('Exclusivity validation', () => {
    it('errors when both --flags-config and --flag.* are used', () => {
      mockReadFileSync.mockReturnValue('{"temperature": 0.8}');

      const argv = ['--flags-config=test.json', '--flag.model=gpt-4'];
      extractOverrides(argv);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Cannot use both --flags-config and --flag.* arguments together.',
      );
      expect(mockConsoleError).toHaveBeenCalledWith('Choose one approach:');
      expect(mockConsoleError).toHaveBeenCalledWith(
        '  • Config file: --flags-config=my-flags.json',
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        '  • CLI flags: --flag.temperature=0.9 --flag.model=gpt-4o',
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('errors with multiple --flags-config arguments', () => {
      const argv = ['--flags-config=first.json', '--flags-config=second.json'];
      extractOverrides(argv);

      expect(mockConsoleError).toHaveBeenCalledWith('❌ Only one --flags-config can be supplied.');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('errors when --flags-config has no path', () => {
      const argv = ['--flags-config'];
      extractOverrides(argv);

      expect(mockConsoleError).toHaveBeenCalledWith('❌ --flags-config requires a file path');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('File handling errors', () => {
    it('handles file read errors', () => {
      mockReadFileSync.mockImplementation(() => {
        const error = new Error('ENOENT: no such file or directory');
        (error as any).code = 'ENOENT';
        throw error;
      });

      const argv = ['--flags-config=missing.json'];
      extractOverrides(argv);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Could not read or parse flags config "missing.json": ENOENT: no such file or directory',
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('handles JSON parse errors', () => {
      mockReadFileSync.mockReturnValue('{ invalid json }');

      const argv = ['--flags-config=invalid.json'];
      extractOverrides(argv);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/❌ Could not read or parse flags config "invalid\.json": .*/),
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('rejects non-object JSON (array)', () => {
      mockReadFileSync.mockReturnValue('[1, 2, 3]');

      const argv = ['--flags-config=array.json'];
      extractOverrides(argv);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Flags config must be a JSON object, got array',
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('rejects non-object JSON (primitive)', () => {
      mockReadFileSync.mockReturnValue('"string value"');

      const argv = ['--flags-config=string.json'];
      extractOverrides(argv);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Flags config must be a JSON object, got string',
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('rejects null JSON', () => {
      mockReadFileSync.mockReturnValue('null');

      const argv = ['--flags-config=null.json'];
      extractOverrides(argv);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Flags config must be a JSON object, got object',
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Argument cleaning', () => {
    it('removes --flags-config from cleanedArgv', () => {
      mockReadFileSync.mockReturnValue('{"temp": 0.9}');

      const argv = ['eval', 'test.eval.ts', '--flags-config=config.json', '--watch'];
      const result = extractOverrides(argv);

      expect(result.cleanedArgv).toEqual(['eval', 'test.eval.ts', '--watch']);
    });

    it('removes space-separated --flags-config and path from cleanedArgv', () => {
      mockReadFileSync.mockReturnValue('{"temp": 0.9}');

      const argv = ['eval', '--flags-config', 'config.json', '--watch'];
      const result = extractOverrides(argv);

      expect(result.cleanedArgv).toEqual(['eval', '--watch']);
    });
  });
});
