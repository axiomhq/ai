import type { SerializedError } from 'vitest';
import type { Reporter, TestCase, TestModule, TestRunEndReason, TestSuite } from 'vitest/node.js';
import type { TaskMeta } from 'vitest/index.cjs';
import c from 'tinyrainbow';

import { findEvaluationCases } from './eval.service';
import type { EvalCaseReport, Evaluation, EvaluationReport, MetaWithEval } from './eval.types';

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function stringify(value: any): string {
  try {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Custom Vitest reporter for Axiom AI evaluations.
 *
 * This reporter collects evaluation results and scores from tests
 * and processes them for further analysis and reporting.
 *
 */
export class AxiomReporter implements Reporter {
  baseline: Evaluation | undefined | null;
  startTime: number = 0;
  start: number = 0;
  private _endOfRunConfigEnd: EvaluationReport['configEnd'] | undefined;

  onTestRunStart() {
    this.start = performance.now();
    this.startTime = new Date().getTime();
  }

  async onTestSuiteReady(_testSuite: TestSuite) {
    const meta = _testSuite.meta() as TaskMeta & { evaluation: EvaluationReport };
    if (_testSuite.state() === 'skipped') {
      return;
    }
    const baseline = meta.evaluation.baseline;
    if (baseline) {
      // load baseline data
      this.baseline = await findEvaluationCases(baseline.id);
    }
    const cwd = process.cwd();

    console.log(
      ' ',
      c.bgCyan(c.black(` ${_testSuite.project.name} `)),
      c.bgBlue(c.black(` ${meta.evaluation.name}-${meta.evaluation.version} `)),
      c.dim(`(${_testSuite.children.size} cases)`),
    );

    console.log(' ', c.dim(_testSuite.module.moduleId.replace(cwd, '')));

    // print baseline name and version if found
    if (meta.evaluation.baseline) {
      console.log(
        ' ',
        ' baseline ',
        c.bgMagenta(
          c.black(` ${meta.evaluation.baseline.name}-${meta.evaluation.baseline.version} `),
        ),
      );
    } else {
      console.log(' ', c.bgWhite(c.blackBright(' baseline: ')), 'none');
    }

    // capture end-of-run config snapshot (first non-empty wins)
    if (meta.evaluation.configEnd && !this._endOfRunConfigEnd) {
      this._endOfRunConfigEnd = meta.evaluation.configEnd;
    }

    console.log('');
  }

  onTestCaseReady(test: TestCase) {
    const meta = test.meta() as TaskMeta & { case: EvalCaseReport };

    // TODO: there seem to be some cases where `meta` is undefined
    // maybe we get here to early?
    if (!meta.case) return;

    console.log(c.blue(` \u2713 evaluating case ${meta.case.index}`));
  }

  onTestSuiteResult(testSuite: TestSuite) {
    // test suite won't have any meta because its skipped
    if (testSuite.state() === 'skipped') {
      return;
    }

    // calculate test duration in seconds
    const duration = Number((performance.now() - this.start) / 1000).toFixed(2);

    console.log(' ');
    console.log(' ', c.dim('Cases'), testSuite.children.size);
    console.log(' ', c.dim('Start at'), new Date(this.startTime).toTimeString());
    console.log(' ', c.dim('Duration'), `${duration}s`);

    const meta = testSuite.meta() as TaskMeta & { evaluation: EvaluationReport };
    const url = `https://app.axiom.co/evaluations/${meta.evaluation.name}/${meta.evaluation.id}`;

    for (const test of testSuite.children) {
      if (test.type !== 'test') return;
      this.printCaseResult(test);
    }

    console.log('');

    const DEBUG = process.env.AXIOM_DEBUG === 'true';
    if (!DEBUG) {
      console.log(
        ' ',
        `see results for ${meta.evaluation.name}-${meta.evaluation.version} at ${url}`,
      );
    }
    console.log(
      ' ',
      c.cyanBright('=== === === === === === === === === === === === === === === ==='),
    );
    console.log('');
  }

  async onTestRunEnd(
    _testModules: ReadonlyArray<TestModule>,
    _errors: ReadonlyArray<SerializedError>,
    _reason: TestRunEndReason,
  ) {
    // Print end-of-run config once
    const DEBUG = process.env.AXIOM_DEBUG === 'true';
    if (DEBUG && this._endOfRunConfigEnd) {
      this.printConfigEnd(this._endOfRunConfigEnd);
    }
  }

  private printCaseResult(test: TestCase) {
    const ok = test.ok();
    const testMeta = test.meta() as MetaWithEval;

    if (!testMeta || !testMeta.case) {
      return;
    }
    const index = testMeta.case.index;

    if (ok) {
      console.log(' ', c.yellow(` \u2714 case ${index}:`));
    } else {
      console.log(' ', c.red(` \u2716 case ${index}: failed`));
      for (const e of testMeta.case.errors ?? []) {
        console.log('', e.message);
      }
    }

    // print scores
    Object.keys(testMeta.case.scores).forEach((k) => {
      const v = testMeta.case.scores[k].score ? testMeta.case.scores[k].score : 0;
      const scoreValue = Number(v * 100).toFixed(2) + '%';

      if (this.baseline && this.baseline.cases[index] && this.baseline.cases[index].scores[k]) {
        const baselineScoreValue = this.baseline.cases[index].scores[k].value;
        const diff = v - baselineScoreValue;
        const diffText = Number(diff * 100).toFixed(2) + '%';
        const blScoreText = Number(baselineScoreValue * 100).toFixed(2) + '%';
        console.log(
          '   ',
          k,
          c.magentaBright(blScoreText),
          '->',
          c.blueBright(scoreValue),
          diff > 0 ? c.green('+' + diffText) : c.red(diffText),
        );
      } else {
        console.log('   ', k, c.blueBright(scoreValue));
      }

      return [k, scoreValue];
    });

    // Print runtime flags actually used for this case (up to 20 entries)
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

    // Print out-of-scope flags for this case
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

  /**
   * End-of-suite config summary (console only)
   */
  private printConfigEnd(configEnd: EvaluationReport['configEnd']) {
    if (configEnd) {
      const { overrides, flags } = configEnd;
      console.log('');
      console.log(' ', c.bgWhite(c.blackBright(' Config ')));
      if (overrides && Object.keys(overrides).length) {
        const entries = Object.entries(overrides).slice(0, 20);
        const formatted = entries.map(([k, v]) => `${k}=${truncate(stringify(v), 80)}`).join(', ');
        console.log('   ', c.dim('overrides'), formatted);
        if (Object.keys(overrides).length > entries.length) {
          console.log('   ', c.dim(`… +${Object.keys(overrides).length - entries.length} more`));
        }
      }
      if (flags && Object.keys(flags).length) {
        const formatted = JSON.stringify(flags, null, 2);
        const indented = formatted.replace(/\n/g, '\n    ');
        console.log(
          '   ',
          c.dim('flag defaults:'),
          '{',
          indented.slice(1), // remove first `{`
        );
      }
      console.log('');
    }
  }
}
