import c from 'tinyrainbow';

import type { Evaluation, EvaluationReport, MetaWithCase, MetaWithEval } from './eval.types';
import type { TestSuite } from 'vitest/node.js';
import { deepEqual } from 'src/util/deep-equal';

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
  // print baseline name and version if found
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

// Print runtime flags actually used for this case (up to 20 entries)
export function printRuntimeFlags(testMeta: MetaWithCase) {
  if (testMeta.case.runtimeFlags && Object.keys(testMeta.case.runtimeFlags).length > 0) {
    const entries = Object.entries(testMeta.case.runtimeFlags);
    const shown = entries.slice(0, 20);
    console.log('   ', c.dim('runtime flags'));
    for (const [k, v] of shown) {
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
    if (entries.length > shown.length) {
      console.log('     ', c.dim(`… +${entries.length - shown.length} more`));
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

export function printDivider() {
  console.log(' ', c.cyanBright('=== === === === === === === === === === === === === === === ==='));
  console.log('');
}
