import c from 'tinyrainbow';

import type {
  Evaluation,
  EvaluationReport,
  FlagDiff,
  MetaWithCase,
  MetaWithEval,
  OutOfScopeFlag,
  RegistrationStatus,
} from './eval.types';
import type { TestSuite } from 'vitest/node.js';
import type { Score } from './scorers';
import { deepEqual } from '../util/deep-equal';

export type SuiteData = {
  name: string;
  file: string;
  duration: string;
  baseline: Evaluation | undefined | null;
  configFlags?: string[];
  flagConfig?: Record<string, any>;
  cases: Array<{
    index: number;
    scores: Record<string, Score>;
    outOfScopeFlags?: { flagPath: string; accessedAt: number; stackTrace: string[] }[];
    errors?: Error[] | null;
    runtimeFlags?: any;
  }>;
  outOfScopeFlags?: OutOfScopeFlag[];
  registrationStatus?: RegistrationStatus;
};

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

export function printEvalNameAndFileName(testSuite: TestSuite, meta: MetaWithEval) {
  const cwd = process.cwd();

  console.log(
    ' ',
    c.bgCyan(c.black(` ${testSuite.project.name} `)),
    c.bgBlue(c.black(` ${meta.evaluation.name}-${meta.evaluation.version} `)),
    c.dim(`(${testSuite.children.size} cases)`),
  );

  console.log(' ', c.dim(testSuite.module.moduleId.replace(cwd, '')));
}

export function printBaselineNameAndVersion(testMeta: MetaWithEval) {
  if (testMeta.evaluation.baseline) {
    console.log(
      ' ',
      ' baseline ',
      c.bgMagenta(
        c.black(` ${testMeta.evaluation.baseline.name}-${testMeta.evaluation.baseline.version} `),
      ),
    );
  } else {
    console.log(' ', c.bgWhite(c.blackBright(' baseline: ')), 'none');
  }

  console.log('');
}

export function printRuntimeFlags(testMeta: MetaWithCase) {
  if (testMeta.case.runtimeFlags && Object.keys(testMeta.case.runtimeFlags).length > 0) {
    const entries = Object.entries(testMeta.case.runtimeFlags);
    console.log('   ', c.dim('runtime flags'));
    for (const [k, v] of entries) {
      switch (v.kind) {
        case 'replaced': {
          const valText = truncate(stringify(v.value), 80);
          const defText = truncate(stringify(v.default), 80);
          console.log('     ', `${k}: ${valText} (default: ${defText})`);
          break;
        }
        case 'introduced': {
          const valText = truncate(stringify(v.value), 80);
          console.log('     ', `${k}: ${valText} (no default)`);
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
) {
  console.log(' ');
  console.log(' ', c.dim('Cases'), testSuite.children.size);
  console.log(' ', c.dim('Start at'), new Date(startTime).toTimeString());
  console.log(' ', c.dim('Duration'), `${duration}s`);
}

export function printTestCaseSuccessOrFailed(testMeta: MetaWithCase, ok: boolean) {
  const index = testMeta.case.index;

  if (ok) {
    console.log(' ', c.yellow(` \u2714 case ${index}:`));
  } else {
    console.log(' ', c.red(` \u2716 case ${index}: failed`));
    for (const e of testMeta.case.errors ?? []) {
      console.log('', e.message);
    }
  }
}

export function printTestCaseScores(
  testMeta: MetaWithCase,
  baseline: Evaluation | null | undefined,
) {
  const index = testMeta.case.index;

  Object.keys(testMeta.case.scores).forEach((k) => {
    const v = testMeta.case.scores[k].score ? testMeta.case.scores[k].score : 0;
    const scoreValue = Number(v * 100).toFixed(2) + '%';

    if (baseline?.cases[index]?.scores[k]) {
      const baselineScoreValue = baseline.cases[index].scores[k].value;
      const diff = v - baselineScoreValue;
      const diffText = Number(diff * 100).toFixed(2) + '%';
      const blScoreText = Number(baselineScoreValue * 100).toFixed(2) + '%';
      console.log(
        '   ',
        k,
        c.magentaBright(blScoreText),
        '->',
        c.blueBright(scoreValue),
        diff > 0 ? c.green('+' + diffText) : diff < 0 ? c.red(diffText) : diffText,
      );
    } else {
      console.log('   ', k, c.blueBright(scoreValue));
    }

    return [k, scoreValue];
  });
}

export function printOutOfScopeFlags(testMeta: MetaWithCase) {
  if (testMeta.case.outOfScopeFlags && testMeta.case.outOfScopeFlags.length > 0) {
    const pickedFlagsText = testMeta.case.pickedFlags
      ? `(picked: ${testMeta.case.pickedFlags.map((f) => `'${f}'`).join(', ')})`
      : '(none)';
    console.log('   ', c.yellow(`⚠ Out-of-scope flags: ${pickedFlagsText}`));
    testMeta.case.outOfScopeFlags.forEach((flag) => {
      const timeStr = new Date(flag.accessedAt).toLocaleTimeString();
      console.log('     ', `${flag.flagPath} (at ${timeStr})`);

      // Show top stack trace frames
      if (flag.stackTrace && flag.stackTrace.length > 0) {
        flag.stackTrace.forEach((frame, i) => {
          const prefix = i === flag.stackTrace.length - 1 ? ' └─' : ' ├─';
          console.log('     ', c.dim(`${prefix} ${frame}`));
        });
      }
    });
  }
}

export function printConfigHeader() {
  console.log('');
  console.log(' ', c.bgWhite(c.blackBright(' Config ')));
}

export function maybePrintFlags(configEnd: EvaluationReport['configEnd']) {
  const defaults = configEnd?.flags ?? {};
  const overrides = configEnd?.overrides ?? {};

  const defaultKeys = Object.keys(defaults);
  const overrideKeys = Object.keys(overrides);

  const allKeys = Array.from(new Set([...defaultKeys, ...overrideKeys])).sort();
  if (allKeys.length === 0) {
    return;
  }

  for (const key of allKeys) {
    const hasDefault = key in defaults;
    const hasOverride = key in overrides;

    if (hasDefault && hasOverride) {
      const defVal = defaults[key];
      const ovVal = overrides[key];
      const changed = !deepEqual(ovVal, defVal);
      const ovText = truncate(stringify(ovVal), 80);
      const defText = truncate(stringify(defVal), 80);
      if (changed) {
        console.log(
          '   ',
          `${key}: ${ovText} ${c.dim(`(overridden by CLI, original: ${defText})`)}`,
        );
      } else {
        console.log('   ', `${key}: ${defText}`);
      }
    } else if (hasOverride) {
      const ovText = truncate(stringify(overrides[key]), 80);
      console.log('   ', `${key}: ${ovText} ${c.dim('(added by CLI)')}`);
    } else if (hasDefault) {
      const defText = truncate(stringify(defaults[key]), 80);
      console.log('   ', `${key}: ${defText}`);
    }
  }

  console.log('');
}

export function printResultLink(testMeta: MetaWithCase, axiomUrl: string) {
  const url = `${axiomUrl}/evaluations/${testMeta.evaluation.name}/${testMeta.evaluation.id}`;
  console.log(
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
) {
  if (Object.keys(overrides).length === 0) {
    console.log('');
    console.log(c.dim('Flag overrides: (none)'));
    console.log('');
    return;
  }

  console.log('');
  console.log('Flag overrides:');
  for (const [key, value] of Object.entries(overrides)) {
    const defaultValue = defaults[key];
    const valueStr = JSON.stringify(value);
    const defaultStr = defaultValue !== undefined ? JSON.stringify(defaultValue) : 'none';
    console.log(`  • ${key}: ${valueStr} ${c.dim(`(default: ${defaultStr})`)}`);
  }
  console.log('');
}

export function printSuiteBox({
  suite,
  scorerAverages,
  calculateBaselineScorerAverage,
  flagDiff,
}: {
  suite: SuiteData;
  scorerAverages: Record<string, number>;
  calculateBaselineScorerAverage: (baseline: Evaluation, scorerName: string) => number | null;
  flagDiff: Array<FlagDiff>;
}) {
  const filename = suite.file.split('/').pop();

  console.log('┌─');
  console.log(`│  ${c.blue(suite.name)} ${c.gray(`(${filename})`)}`);
  console.log('├─');

  const scorerNames = Object.keys(scorerAverages);
  const maxNameLength = Math.max(...scorerNames.map((name) => name.length));

  for (const scorerName of scorerNames) {
    const avg = scorerAverages[scorerName];
    const paddedName = scorerName.padEnd(maxNameLength);

    if (suite.baseline) {
      const baselineAvg = calculateBaselineScorerAverage(suite.baseline, scorerName);
      if (baselineAvg !== null) {
        const currentPercent = (avg * 100).toFixed(2) + '%';
        const baselinePercent = (baselineAvg * 100).toFixed(2) + '%';
        const diff = avg - baselineAvg;
        const diffText = (diff >= 0 ? '+' : '') + (diff * 100).toFixed(2) + '%';
        const diffColor = diff > 0 ? c.green : diff < 0 ? c.red : c.dim;

        const paddedBaseline = baselinePercent.padStart(7);
        const paddedCurrent = currentPercent.padStart(7);
        const paddedDiff = diffText.padStart(8);

        console.log(
          `│  ${paddedName}  ${c.blueBright(paddedBaseline)} → ${c.magentaBright(paddedCurrent)}  (${diffColor(paddedDiff)})`,
        );
      } else {
        const currentPercent = (avg * 100).toFixed(2) + '%';
        console.log(`│   • ${paddedName}  ${currentPercent}`);
      }
    } else {
      const currentPercent = (avg * 100).toFixed(2) + '%';
      console.log(`│   • ${paddedName}  ${currentPercent}`);
    }
  }

  console.log('├─');

  if (suite.baseline) {
    const baselineTimestamp = suite.baseline.runAt
      ? reporterDate(new Date(suite.baseline.runAt))
      : 'unknown time';
    console.log(
      `│  Baseline: ${suite.baseline.name}-${suite.baseline.version} ${c.gray(`(${baselineTimestamp})`)}`,
    );
  } else {
    console.log(`│  Baseline: ${c.gray('(none)')}`);
  }

  if (suite.baseline) {
    const hasConfigChanges = flagDiff.length > 0;

    console.log('│  Config changes:', hasConfigChanges ? '' : c.gray('(none)'));
    if (hasConfigChanges) {
      for (const { flag, current, baseline } of flagDiff) {
        console.log(
          `│   • ${flag}: ${current ?? '<not set>'} ${c.gray(`(baseline: ${baseline ?? '<not set>'})`)}`,
        );
      }
    }
  }

  if (suite.outOfScopeFlags && suite.outOfScopeFlags.length > 0) {
    const pickedFlagsText =
      suite.configFlags && suite.configFlags.length > 0
        ? suite.configFlags.map((f) => `'${f}'`).join(', ')
        : 'none';
    console.log('│');
    console.log(
      `│  ${c.yellow('⚠ Out-of-scope flags')} ${c.gray(`(picked: ${pickedFlagsText})`)}:`,
    );
    for (const flag of suite.outOfScopeFlags) {
      const lastStackTraceFrame = flag.stackTrace[0];
      const lastStackTraceFnName = lastStackTraceFrame.split(' ').shift();
      const lastStackTraceFile = lastStackTraceFrame.split('/').pop()?.slice(0, -1);
      console.log(
        `│   • ${flag.flagPath} ${c.gray(`at ${lastStackTraceFnName} (${lastStackTraceFile})`)}`,
      );
    }
  }

  console.log('└─');
}

export function printFinalReport({
  suiteData,
  calculateScorerAverages,
  calculateBaselineScorerAverage,
  calculateFlagDiff,
  registrationStatus,
}: {
  suiteData: SuiteData[];
  calculateScorerAverages: (suite: SuiteData) => Record<string, number>;
  calculateBaselineScorerAverage: (baseline: Evaluation, scorerName: string) => number | null;
  calculateFlagDiff: (suite: SuiteData) => Array<FlagDiff>;
  registrationStatus: Array<{ name: string; registered: boolean; error?: string }>;
}) {
  console.log('');
  console.log(c.bgBlue(c.white(' FINAL EVALUATION REPORT ')));
  console.log('');

  for (const suite of suiteData) {
    const scorerAverages = calculateScorerAverages(suite);
    const flagDiff = suite.baseline ? calculateFlagDiff(suite) : [];
    printSuiteBox({ suite, scorerAverages, calculateBaselineScorerAverage, flagDiff });
    console.log('');
  }

  const anyRegistered = registrationStatus.some((s) => s.registered);
  const anyFailed = registrationStatus.some((s) => !s.registered);

  if (anyRegistered) {
    console.log('View full report:');
    console.log('https://app.axiom.co/evaluations/run/<run-id>');
  } else {
    console.log('Results not available in Axiom UI (registration failed)');
  }

  if (anyFailed) {
    console.log('');
    for (const status of registrationStatus) {
      if (!status.registered) {
        console.log(c.yellow(`⚠️  Warning: Failed to register "${status.name}" with Axiom`));
        if (status.error) {
          console.log(c.dim(`   Error: ${status.error}`));
        }
        console.log(c.dim(`   Results for this evaluation will not be available in the Axiom UI.`));
      }
    }
  }
}
