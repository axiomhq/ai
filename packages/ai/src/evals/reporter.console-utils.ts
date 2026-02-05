import c from 'tinyrainbow';

import type {
  Case,
  Evaluation,
  FlagDiff,
  MetaWithCase,
  MetaWithEval,
  OutOfScopeFlag,
  RegistrationStatus,
  OutOfScopeFlagAccess,
} from './eval.types';
import type { TestSuite, TestCase } from 'vitest/node';
import type { Score } from './scorers';
import { flattenObject } from '../util/dot-path';
import type { AxiomConnectionResolvedConfig } from '../config/resolver';

/** Convert score value to number (handles boolean scores from normalizeScore) */
function scoreToNumber(score: Score['score']): number {
  if (typeof score === 'boolean') return score ? 1 : 0;
  return score ?? 0;
}

export type SuiteData = {
  version: string;
  name: string;
  file: string;
  duration: string;
  baseline: Evaluation | undefined | null;
  configFlags?: string[];
  flagConfig?: Record<string, any>;
  defaultFlagConfig?: Record<string, any>;
  runId: string;
  orgId?: string;
  cases: Array<{
    index: number;
    scores: Record<string, Score>;
    outOfScopeFlags?: OutOfScopeFlagAccess[];
    errors?: Error[] | null;
    runtimeFlags?: any;
  }>;
  outOfScopeFlags?: OutOfScopeFlag[];
  registrationStatus?: RegistrationStatus;
};

export type Logger = (message?: string, ...optionalParams: any[]) => void;

export function formatPercentage(value: number): string {
  if (!Number.isFinite(value)) {
    return 'N/A';
  }
  return Number(value * 100).toFixed(2) + '%';
}

export function formatDiff(current: number, baseline: number) {
  if (!Number.isFinite(current) || !Number.isFinite(baseline)) {
    return { text: 'N/A', color: c.dim };
  }
  const diff = current - baseline;
  const diffText = (diff >= 0 ? '+' : '') + formatPercentage(diff);
  const color = diff > 0 ? c.green : diff < 0 ? c.red : c.dim;
  return { text: diffText, color };
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function stringify(value: any): string {
  try {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function getCaseFingerprint(
  input: string | Record<string, any>,
  expected: string | Record<string, any>,
): string {
  const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
  const expectedStr = typeof expected === 'string' ? expected : JSON.stringify(expected);
  return JSON.stringify({ input: inputStr, expected: expectedStr });
}

export function printEvalNameAndFileName(
  testSuite: TestSuite,
  meta: MetaWithEval,
  logger: Logger = console.log,
) {
  const cwd = process.cwd();

  logger(
    ' ',
    c.bgCyan(c.black(` ${testSuite.project.name} `)),
    c.bgBlue(c.black(` ${meta.evaluation.name}-${meta.evaluation.version} `)),
    c.dim(`(${testSuite.children.size} cases)`),
  );

  logger(' ', c.dim(testSuite.module.moduleId.replace(cwd, '')));
}

export function printBaselineNameAndVersion(testMeta: MetaWithEval, logger: Logger = console.log) {
  if (testMeta.evaluation.baseline) {
    logger(
      ' ',
      ' baseline ',
      c.bgMagenta(
        c.black(` ${testMeta.evaluation.baseline.name}-${testMeta.evaluation.baseline.version} `),
      ),
    );
  } else {
    logger(' ', c.bgWhite(c.blackBright(' baseline: ')), 'none');
  }

  logger('');
}

export function printRuntimeFlags(testMeta: MetaWithCase, logger: Logger = console.log) {
  if (testMeta.case.runtimeFlags && Object.keys(testMeta.case.runtimeFlags).length > 0) {
    const entries = Object.entries(testMeta.case.runtimeFlags);
    logger('   ', c.dim('runtime flags'));
    for (const [k, v] of entries) {
      switch (v.kind) {
        case 'replaced': {
          const valText = truncate(stringify(v.value), 80);
          const defText = truncate(stringify(v.default), 80);
          logger('     ', `${k}: ${valText} (default: ${defText})`);
          break;
        }
        case 'introduced': {
          const valText = truncate(stringify(v.value), 80);
          logger('     ', `${k}: ${valText} (no default)`);
          break;
        }
      }
    }
  }
}

export function printTestCaseCountStartDuration(
  testSuite: TestSuite,
  startTime: number,
  duration: string,
  trials?: number,
  logger: Logger = console.log,
) {
  logger(' ');
  const trialsLabel = trials && trials > 1 ? ` (${trials} trials each)` : '';
  logger(' ', c.dim('Cases'), `${testSuite.children.size}${trialsLabel}`);
  logger(' ', c.dim('Start at'), new Date(startTime).toTimeString());
  logger(' ', c.dim('Duration'), `${duration}s`);
}

export function printTestCaseSuccessOrFailed(
  testMeta: MetaWithCase,
  ok: boolean,
  logger: Logger = console.log,
) {
  const index = testMeta.case.index;

  if (ok) {
    logger(' ', c.yellow(` \u2714 case ${index}:`));
  } else {
    logger(' ', c.red(` \u2716 case ${index}: failed`));
    for (const e of testMeta.case.errors ?? []) {
      logger('', e.message);
    }
  }
}

export function printTestCaseScores(
  testMeta: MetaWithCase,
  baselineCase: Case | null | undefined,
  logger: Logger = console.log,
) {
  const scores = testMeta.case.scores;
  const keys = Object.keys(scores);

  if (keys.length === 0) {
    return;
  }

  const maxNameLength = Math.max(...keys.map((k) => k.length));

  keys.forEach((k) => {
    const scoreData = scores[k];
    const hasError = scoreData.metadata?.error;
    const v = scoreToNumber(scoreData.score);

    const rawCurrent = hasError ? 'N/A' : formatPercentage(v);
    const paddedCurrent = rawCurrent.padStart(7);
    const coloredCurrent = hasError ? c.dim(paddedCurrent) : c.magentaBright(paddedCurrent);

    const paddedName = k.padEnd(maxNameLength);

    if (baselineCase?.scores[k]) {
      const baselineScoreValue = baselineCase.scores[k].value;
      const rawBaseline = formatPercentage(baselineScoreValue);
      const paddedBaseline = rawBaseline === 'N/A' ? rawBaseline : rawBaseline.padStart(7);
      const coloredBaseline =
        rawBaseline === 'N/A' ? c.dim(paddedBaseline) : c.blueBright(paddedBaseline);

      const { text: diffText, color: diffColor } = formatDiff(v, baselineScoreValue);
      const paddedDiff = diffText.padStart(8);

      logger(
        `    ${paddedName}  ${coloredBaseline} → ${coloredCurrent}  ${
          hasError ? c.dim('(scorer not run)') : c.dim('(') + diffColor(paddedDiff) + c.dim(')')
        }`,
      );
    } else {
      logger(`    ${paddedName}  ${coloredCurrent} ${hasError ? c.dim('(scorer not run)') : ''}`);
    }
  });
}

export function printOutOfScopeFlags(testMeta: MetaWithCase, logger: Logger = console.log) {
  if (testMeta.case.outOfScopeFlags && testMeta.case.outOfScopeFlags.length > 0) {
    const pickedFlagsText = testMeta.case.pickedFlags
      ? `(picked: ${testMeta.case.pickedFlags.map((f) => `'${f}'`).join(', ')})`
      : '(none)';
    logger('   ', c.yellow(`⚠ Out-of-scope flags: ${pickedFlagsText}`));
    testMeta.case.outOfScopeFlags.forEach((flag) => {
      const timeStr = new Date(flag.accessedAt).toLocaleTimeString();
      logger('     ', `${flag.flagPath} (at ${timeStr})`);

      // Show top stack trace frames
      if (flag.stackTrace && flag.stackTrace.length > 0) {
        flag.stackTrace.forEach((frame, i) => {
          const prefix = i === flag.stackTrace.length - 1 ? ' └─' : ' ├─';
          logger('     ', c.dim(`${prefix} ${frame}`));
        });
      }
    });
  }
}

export function printCaseResult(
  test: TestCase,
  baselineCasesByFingerprint: Map<string, Case[]>,
  matchedIndices: Set<number>,
  logger: Logger = console.log,
) {
  const ok = test.ok();
  const testMeta = test.meta() as MetaWithCase;

  if (!testMeta?.case) {
    return;
  }

  printTestCaseSuccessOrFailed(testMeta, ok, logger);

  const fingerprint = getCaseFingerprint(testMeta.case.input, testMeta.case.expected);
  const baselineCases = baselineCasesByFingerprint.get(fingerprint);
  const baselineCase = baselineCases?.shift();

  if (baselineCase) {
    matchedIndices.add(baselineCase.index);
  }

  printTestCaseScores(testMeta, baselineCase, logger);

  printRuntimeFlags(testMeta, logger);

  printOutOfScopeFlags(testMeta, logger);
}

export function printOrphanedBaselineCases(
  baseline: Evaluation,
  matchedIndices: Set<number>,
  logger: Logger = console.log,
) {
  const orphanedCases = baseline.cases.filter((c) => !matchedIndices.has(c.index));

  if (orphanedCases.length === 0) {
    return;
  }

  logger('');
  logger(' ', c.yellow('Orphaned baseline cases:'));

  for (const orphanedCase of orphanedCases) {
    logger(
      ' ',
      c.dim(
        `case ${orphanedCase.index}: ${truncate(orphanedCase.input, 50)} (score: ${truncate(
          JSON.stringify(orphanedCase.scores),
          50,
        )})`,
      ),
    );
    // We could print detailed scores here if we want, similar to printTestCaseScores
    // But just listing them is probably enough for now, or using a simplified format
    const keys = Object.keys(orphanedCase.scores);
    if (keys.length > 0) {
      const maxNameLength = Math.max(...keys.map((k) => k.length));

      keys.forEach((k) => {
        const scoreData = orphanedCase.scores[k];
        const rawScore = formatPercentage(scoreData.value);
        const paddedName = k.padEnd(maxNameLength);
        const paddedScore = rawScore.padStart(7);

        logger(`    ${paddedName}  ${c.blueBright(paddedScore)}`);
      });
    }
  }
}

export function printConfigHeader(logger: Logger = console.log) {
  logger('');
  logger(' ', c.bgWhite(c.blackBright(' Config ')));
}

export function printResultLink(
  testMeta: MetaWithCase,
  axiomUrl: string,
  logger: Logger = console.log,
) {
  const url = `${axiomUrl}/evaluations/${testMeta.evaluation.name}/${testMeta.evaluation.id}`;
  logger(
    ' ',
    `see results for ${testMeta.evaluation.name}-${testMeta.evaluation.version} at ${url}`,
  );
}

export const reporterDate = (d: Date) => {
  const date = d.toISOString().slice(0, 10); // "2025-10-03"
  const hours = d.getUTCHours().toString().padStart(2, '0');
  const minutes = d.getUTCMinutes().toString().padStart(2, '0');
  return `${date}, ${hours}:${minutes} UTC`;
};

export function printGlobalFlagOverrides(
  overrides: Record<string, any>,
  defaults: Record<string, any>,
  logger: Logger = console.log,
) {
  if (Object.keys(overrides).length === 0) {
    logger('');
    logger(c.dim('Flag overrides: (none)'));
    logger('');
    return;
  }

  logger('');
  logger('Flag overrides:');
  for (const [key, value] of Object.entries(overrides)) {
    const defaultValue = defaults[key];
    const valueStr = JSON.stringify(value);
    const defaultStr = defaultValue !== undefined ? JSON.stringify(defaultValue) : 'none';
    logger(`  • ${key}: ${valueStr} ${c.dim(`(default: ${defaultStr})`)}`);
  }
  logger('');
}

export function printSuiteBox({
  suite,
  scorerAverages,
  calculateBaselineScorerAverage,
  flagDiff,
  logger = console.log,
}: {
  suite: SuiteData;
  scorerAverages: Record<string, number>;
  calculateBaselineScorerAverage: (baseline: Evaluation, scorerName: string) => number | null;
  flagDiff: Array<FlagDiff>;
  logger?: Logger;
}) {
  const filename = suite.file.split('/').pop();

  logger('┌─');
  logger(`│  ${c.blue(suite.name)} ${c.gray(`(${filename})`)}`);
  logger('├─');

  const scorerNames = Object.keys(scorerAverages);
  const maxNameLength = Math.max(...scorerNames.map((name) => name.length));

  const allCasesErrored = (scorerName: string) => {
    return suite.cases.every((caseData) => caseData.scores[scorerName]?.metadata?.error);
  };

  for (const scorerName of scorerNames) {
    const avg = scorerAverages[scorerName];
    const paddedName = scorerName.padEnd(maxNameLength);
    const hasAllErrors = allCasesErrored(scorerName);

    const baselineAvg = suite.baseline
      ? calculateBaselineScorerAverage(suite.baseline, scorerName)
      : null;

    if (baselineAvg !== null) {
      const currentPercent = hasAllErrors ? c.dim('N/A') : formatPercentage(avg);
      const baselinePercent = formatPercentage(baselineAvg);
      const { text: diffText, color: diffColor } = formatDiff(avg, baselineAvg);

      const paddedBaseline = baselinePercent.padStart(7);
      const paddedCurrent = hasAllErrors ? currentPercent : currentPercent.padStart(7);
      const diffDisplay = hasAllErrors
        ? c.dim('all cases failed')
        : diffColor(diffText.padStart(8));

      logger(
        `│  ${paddedName}  ${c.blueBright(paddedBaseline)} → ${hasAllErrors ? paddedCurrent : c.magentaBright(paddedCurrent)}  (${diffDisplay})`,
      );
    } else {
      const currentPercent = hasAllErrors ? c.red('N/A (all cases failed)') : formatPercentage(avg);
      logger(`│   • ${paddedName}  ${currentPercent}`);
    }
  }

  logger('├─');

  if (suite.baseline) {
    const baselineTimestamp = suite.baseline.runAt
      ? reporterDate(new Date(suite.baseline.runAt))
      : 'unknown time';
    logger(
      `│  Baseline: ${suite.baseline.name}-${suite.baseline.version} ${c.gray(`(${baselineTimestamp})`)}`,
    );
  } else {
    logger(`│  Baseline: ${c.gray('(none)')}`);
  }

  const hasConfigChanges = flagDiff.length > 0;

  logger('│  Config changes:', hasConfigChanges ? '' : c.gray('(none)'));
  if (hasConfigChanges) {
    for (const { flag, current, baseline, default: defaultVal } of flagDiff) {
      logger(`│   • ${flag}: ${current ?? '<not set>'}`);
      if (defaultVal !== undefined) {
        logger(`│       ${c.gray(`default: ${defaultVal}`)}`);
      }
      if (suite.baseline) {
        logger(`│       ${c.gray(`baseline: ${baseline ?? '<not set>'}`)}`);
      }
    }
  }

  if (suite.outOfScopeFlags && suite.outOfScopeFlags.length > 0) {
    const pickedFlagsText =
      suite.configFlags && suite.configFlags.length > 0
        ? suite.configFlags.map((f) => `'${f}'`).join(', ')
        : 'none';
    logger('│');
    logger(`│  ${c.yellow('⚠ Out-of-scope flags')} ${c.gray(`(picked: ${pickedFlagsText})`)}:`);
    for (const flag of suite.outOfScopeFlags) {
      const lastStackTraceFrame = flag.stackTrace[0];
      const lastStackTraceFnName = lastStackTraceFrame.split(' ').shift();
      const lastStackTraceFile = lastStackTraceFrame.split('/').pop()?.slice(0, -1);
      logger(
        `│   • ${flag.flagPath} ${c.gray(`at ${lastStackTraceFnName} (${lastStackTraceFile})`)}`,
      );
    }
  }

  logger('└─');
}

/**
 * Calculate average scores per scorer for a suite
 */
export function calculateScorerAverages(suite: SuiteData): Record<string, number> {
  const scorerTotals: Record<string, { sum: number; count: number }> = {};

  for (const caseData of suite.cases) {
    for (const [scorerName, score] of Object.entries(caseData.scores)) {
      if (!scorerTotals[scorerName]) {
        scorerTotals[scorerName] = { sum: 0, count: 0 };
      }
      if (!score.metadata?.error) {
        scorerTotals[scorerName].sum += scoreToNumber(score.score);
        scorerTotals[scorerName].count += 1;
      }
    }
  }

  const averages: Record<string, number> = {};
  for (const [scorerName, totals] of Object.entries(scorerTotals)) {
    averages[scorerName] = totals.count > 0 ? totals.sum / totals.count : 0;
  }

  return averages;
}

/**
 * Calculate average score for a specific scorer from baseline data
 */
export function calculateBaselineScorerAverage(
  baseline: Evaluation,
  scorerName: string,
): number | null {
  const scores: number[] = [];

  for (const caseData of baseline.cases) {
    if (caseData.scores[scorerName]) {
      scores.push(caseData.scores[scorerName].value);
    }
  }

  if (scores.length === 0) return null;

  const sum = scores.reduce((acc, val) => acc + val, 0);
  return sum / scores.length;
}

/**
 * Calculate flag diff between current run vs baseline and defaults (filtered by configFlags).
 * Shows a diff if current differs from at least one of baseline or default.
 */
export function calculateFlagDiff(suite: SuiteData): Array<FlagDiff> {
  if (!suite.configFlags || suite.configFlags.length === 0) {
    return [];
  }

  const diffs: Array<FlagDiff> = [];

  const currentConfig = suite.flagConfig || {};
  const baselineConfig = suite.baseline?.flagConfig || {};
  const defaultConfig = suite.defaultFlagConfig || {};

  const currentFlat = flattenObject(currentConfig);
  const baselineFlat = flattenObject(baselineConfig);
  const defaultFlat = flattenObject(defaultConfig);

  const allKeys = new Set([
    ...Object.keys(currentFlat),
    ...Object.keys(baselineFlat),
    ...Object.keys(defaultFlat),
  ]);

  for (const key of allKeys) {
    const isInScope = suite.configFlags.some((pattern) => key.startsWith(pattern));
    if (!isInScope) continue;

    const currentValue = currentFlat[key];
    const baselineValue = baselineFlat[key];
    const defaultValue = defaultFlat[key];

    const currentStr = currentValue !== undefined ? JSON.stringify(currentValue) : undefined;
    const baselineStr = baselineValue !== undefined ? JSON.stringify(baselineValue) : undefined;
    const defaultStr = defaultValue !== undefined ? JSON.stringify(defaultValue) : undefined;

    const diffFromBaseline = suite.baseline && currentStr !== baselineStr;
    const diffFromDefault = currentStr !== defaultStr;

    if (diffFromBaseline || diffFromDefault) {
      diffs.push({
        flag: key,
        current: currentStr,
        baseline: suite.baseline ? baselineStr : undefined,
        default: defaultStr,
      });
    }
  }

  return diffs;
}

export function printFinalReport({
  suiteData,
  config,
  registrationStatus,
  isDebug,
  logger = console.log,
}: {
  suiteData: SuiteData[];
  config?: AxiomConnectionResolvedConfig;
  registrationStatus: Array<{ name: string; registered: boolean; error?: string }>;
  isDebug?: boolean;
  logger?: Logger;
}) {
  logger('');
  logger(c.bgBlue(c.white(' FINAL EVALUATION REPORT ')));
  logger('');

  for (const suite of suiteData) {
    const scorerAverages = calculateScorerAverages(suite);
    const flagDiff = calculateFlagDiff(suite);
    printSuiteBox({ suite, scorerAverages, calculateBaselineScorerAverage, flagDiff, logger });
    logger('');
  }

  const runId = suiteData[0]?.runId;
  const orgId = suiteData[0]?.orgId;

  const anyRegistered = registrationStatus.some((s) => s.registered);
  const anyFailed = registrationStatus.some((s) => !s.registered);

  if (anyRegistered && orgId && config?.consoleEndpointUrl) {
    if (suiteData.length === 1) {
      const suite = suiteData[0];
      const baselineParam = suite.baseline?.traceId ? `?baselineId=${suite.baseline.traceId}` : '';
      logger('View eval result:');
      logger(
        `${config.consoleEndpointUrl}/${orgId}/ai-engineering/evaluations/${suite.name}/${suite.version}${baselineParam}`,
      );
    } else {
      logger('View full report:');
      logger(`${config.consoleEndpointUrl}/${orgId}/ai-engineering/evaluations?runId=${runId}`);
    }
  } else if (isDebug) {
    logger(c.dim('Results not uploaded to Axiom (debug mode)'));
  } else {
    logger('Results not available in Axiom UI (registration failed)');
  }

  if (anyFailed) {
    logger('');
    for (const status of registrationStatus) {
      if (!status.registered) {
        logger(c.yellow(`⚠️  Warning: Failed to register "${status.name}" with Axiom`));
        if (status.error) {
          logger(c.dim(`   Error: ${status.error}`));
        }
        logger(c.dim(`   Results for this evaluation will not be available in the Axiom UI.`));
      }
    }
  }
}
