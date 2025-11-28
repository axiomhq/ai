import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractOverrides,
  validateFlagOverrides,
} from '../../../src/cli/utils/parse-flag-overrides';
import { readFileSync } from 'node:fs';
import { z } from 'zod';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}));

const mockReadFileSync = vi.mocked(readFileSync);

describe('extractOverrides', () => {
  it('parses --flag.key=value syntax', () => {
    const argv = ['eval', '--flag.temperature=0.9', '--flag.model=gpt-4'];
    const result = extractOverrides(argv);

    expect(result.cleanedArgv).toEqual(['eval']);
    expect(result.overrides).toEqual({
      temperature: 0.9,
      model: 'gpt-4',
    });
  });

  it('errors on space-separated syntax', () => {
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    const argv = ['eval', '--flag.temperature', '0.7'];
    extractOverrides(argv);

    expect(mockConsoleError).toHaveBeenCalledWith('❌ Invalid syntax: --flag.temperature 0.7');
    expect(mockConsoleError).toHaveBeenCalledWith('💡 Use: --flag.temperature=0.7');
    expect(mockProcessExit).toHaveBeenCalledWith(1);

    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  it('treats bare flags as true', () => {
    const argv = ['--flag.enabled', '--flag.verbose'];
    const result = extractOverrides(argv);

    expect(result.cleanedArgv).toEqual([]);
    expect(result.overrides).toEqual({
      enabled: true,
      verbose: true,
    });
  });

  it('coerces boolean strings', () => {
    const argv = ['--flag.enabled=true', '--flag.disabled=false'];
    const result = extractOverrides(argv);

    expect(result.overrides).toEqual({
      enabled: true,
      disabled: false,
    });
  });

  it('coerces numbers', () => {
    const argv = ['--flag.count=42', '--flag.rate=0.5', '--flag.negative=-10'];
    const result = extractOverrides(argv);

    expect(result.overrides).toEqual({
      count: 42,
      rate: 0.5,
      negative: -10,
    });
  });

  it('parses JSON objects', () => {
    const argv = ['--flag.config={"max":100,"enabled":true}'];
    const result = extractOverrides(argv);

    expect(result.overrides).toEqual({
      config: { max: 100, enabled: true },
    });
  });

  it('keeps non-flag arguments in cleanedArgv', () => {
    const argv = ['eval', 'test.eval.ts', '--flag.temp=0.9', '--watch', '--flag.model=gpt-4'];
    const result = extractOverrides(argv);

    expect(result.cleanedArgv).toEqual(['eval', 'test.eval.ts', '--watch']);
    expect(result.overrides).toEqual({
      temp: 0.9,
      model: 'gpt-4',
    });
  });

  it('handles last flag wins for duplicates', () => {
    const argv = ['--flag.temperature=0.7', '--flag.temperature=0.9'];
    const result = extractOverrides(argv);

    expect(result.overrides).toEqual({
      temperature: 0.9,
    });
  });

  it('handles flag with no value followed by another flag', () => {
    const argv = ['--flag.enabled', '--flag.temperature=0.9'];
    const result = extractOverrides(argv);

    expect(result.overrides).toEqual({
      enabled: true,
      temperature: 0.9,
    });
  });

  it('handles complex flag keys with hyphens', () => {
    const argv = ['--flag.max-tokens=1024', '--flag.dry-run=true'];
    const result = extractOverrides(argv);

    expect(result.overrides).toEqual({
      'max-tokens': 1024,
      'dry-run': true,
    });
  });

  it('leaves invalid JSON as string', () => {
    const argv = ['--flag.config={invalid:json}'];
    const result = extractOverrides(argv);

    expect(result.overrides).toEqual({
      config: '{invalid:json}',
    });
  });

  it('handles negative numbers correctly', () => {
    const argv = ['--flag.threshold=-0.5', '--flag.offset=-10'];
    const result = extractOverrides(argv);

    expect(result.overrides).toEqual({
      threshold: -0.5,
      offset: -10,
    });
  });

  it('handles values starting with dashes', () => {
    const argv = ['--flag.prefix=--something', '--flag.option=--verbose'];
    const result = extractOverrides(argv);

    expect(result.overrides).toEqual({
      prefix: '--something',
      option: '--verbose',
    });
  });

  it('allows bare flags with true/false values following them', () => {
    const argv = ['--flag.enabled', 'true', '--flag.disabled', 'false'];
    const result = extractOverrides(argv);

    expect(result.cleanedArgv).toEqual(['true', 'false']);
    expect(result.overrides).toEqual({
      enabled: true,
      disabled: true,
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

    it('errors on deprecated space-separated --flags-config syntax', () => {
      const argv = ['eval', '--flags-config', 'config/flags.json'];
      extractOverrides(argv);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Invalid syntax: --flags-config config/flags.json',
      );
      expect(mockConsoleError).toHaveBeenCalledWith('💡 Use: --flags-config=config/flags.json');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
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
      expect(mockConsoleError).toHaveBeenCalledWith('💡 Use: --flags-config=path/to/config.json');
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
  });
});

describe('validateFlagOverrides', () => {
  let mockConsoleError: any;
  let mockProcessExit: any;

  beforeEach(() => {
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockProcessExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  const testSchema = z.object({
    model: z.object({
      temperature: z.number().min(0).max(2).default(0.7),
      name: z.string().default('gpt-4o'),
    }),
    debug: z.boolean().default(false),
  });

  it('passes validation for valid flags', () => {
    const overrides = {
      'model.temperature': 0.9,
      'model.name': 'gpt-4',
      debug: true,
    };

    validateFlagOverrides(overrides, testSchema);

    expect(mockProcessExit).not.toHaveBeenCalled();
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('passes for empty overrides', () => {
    validateFlagOverrides({}, testSchema);

    expect(mockProcessExit).not.toHaveBeenCalled();
  });

  it('errors on invalid flag path', () => {
    const overrides = {
      'model.unknown': 'value',
    };

    validateFlagOverrides(overrides, testSchema);

    expect(mockConsoleError).toHaveBeenCalledWith('❌ Invalid CLI flags:');
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining("flag 'model.unknown': Invalid flag path"),
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('errors on completely unknown namespace', () => {
    const overrides = {
      'unknown.flag': 'value',
    };

    validateFlagOverrides(overrides, testSchema);

    expect(mockConsoleError).toHaveBeenCalledWith('❌ Invalid CLI flags:');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('errors on invalid value type', () => {
    const overrides = {
      'model.temperature': 'not-a-number',
    };

    validateFlagOverrides(overrides, testSchema);

    expect(mockConsoleError).toHaveBeenCalledWith('❌ Invalid CLI flags:');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('errors on value out of range', () => {
    const overrides = {
      'model.temperature': 5, // max is 2
    };

    validateFlagOverrides(overrides, testSchema);

    expect(mockConsoleError).toHaveBeenCalledWith('❌ Invalid CLI flags:');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
