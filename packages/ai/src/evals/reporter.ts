import type { SerializedError } from 'vitest';
import type { Reporter, TestCase, TestModule, TestRunEndReason, TestSuite } from 'vitest/node.js';
import type { TaskMeta } from 'vitest/index.cjs';
import c from 'tinyrainbow';

import type { Score } from './scorers';
import { findEvaluationCases, type Evaluation } from './eval.service';

/**
 * Complete report for a single evaluation case including results and metadata.
 *
 * Generated for each test case when running {@link Eval} with {@link EvalParams}.
 * Contains all {@link Score} results and execution metadata.
 *
 * @experimental This API is experimental and may change in future versions.
 */
export type EvalCaseReport = {
  /** Order/index of this case in the evaluation suite */
  index: number;
  /** Name of the evaluation */
  name: string;
  /** Input data that was provided to the {@link EvalTask} */
  input: string | Record<string, any>;
  /** Output produced by the {@link EvalTask} */
  output: string | Record<string, any>;
  /** Expected output for comparison */
  expected: string | Record<string, any>;
  /** Array of {@link Score} results from all scorers that were run */
  scores: Record<string, Score>;
  /** Any errors that occurred during evaluation */
  errors: Error[] | null;
  /** Status of the evaluation case */
  status: 'success' | 'fail' | 'pending';
  /** Duration in milliseconds for the entire case */
  duration: number | undefined;
  /** Timestamp when the case started */
  startedAt: number | undefined;
  /** Flags accessed outside of the picked flags scope for this case */
  outOfScopeFlags?: { flagPath: string; accessedAt: number; stackTrace: string[] }[];
  /** Flags that are in scope for this evaluation */
  pickedFlags?: string[];
};

export type EvaluationReport = {
  id: string;
  name: string;
  version: string;
  baseline: Evaluation | undefined;
  /** Summary of all flags accessed outside of picked flags scope across all cases */
  outOfScopeFlags?: {
    flagPath: string;
    count: number;
    firstAccessedAt: number;
    lastAccessedAt: number;
  }[];
};

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

  // Cache the current evaluation built from traces to compare against baseline
  private currentEval: Evaluation | null | undefined;

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

    // TODO: BEFORE MERGE - agent removed this
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

    console.log('');
    // TODO: BEFORE MERGE - agent added this comments after deleting the above
    // If we have a baseline, defer fancy summary until results step where we can
    // also fetch the current evaluation. Keep this early hook minimal.
  }

  onTestCaseReady(test: TestCase) {
    const meta = test.meta() as TaskMeta & { case: EvalCaseReport };

    // TODO: there seem to be some cases where `meta` is undefined
    // maybe we get here to early?
    if (!meta.case) return;

    console.log(c.blue(` \u2713 evaluating case ${meta.case.index}`));
  }

  async onTestSuiteResult(testSuite: TestSuite) {
    // test suite won't have any meta because its skipped
    if (testSuite.state() === 'skipped') {
      return;
    }

    const meta = testSuite.meta() as TaskMeta & { evaluation: EvaluationReport };

    // If a baseline exists, build current evaluation now and render fancy report
    if (meta.evaluation.baseline) {
      // Build current evaluation tree from traces for this run
      this.currentEval = await findEvaluationCases(meta.evaluation.id);
      console.log('tktk this.currentEval1', this.currentEval);
      // Fallback to in-memory results if remote fetch failed (e.g., missing env)
      if (!this.currentEval) {
        this.currentEval = buildEvalFromSuite(meta, testSuite);
      }
      console.log('tktk this.currentEval2', this.currentEval);

      this.printFancyReport(testSuite, meta);
      return;
    }

    // Fallback to simple summary for runs without a baseline
    // calculate test duration in seconds
    const duration = Number((performance.now() - this.start) / 1000).toFixed(2);

    console.log(' ');
    console.log(' ', c.dim('Cases'), testSuite.children.size);
    console.log(' ', c.dim('Start at'), new Date(this.startTime).toTimeString());
    console.log(' ', c.dim('Duration'), `${duration}s`);

    const url = `https://app.axiom.co/evaluations/${meta.evaluation.name}/${meta.evaluation.id}`;

    for (const test of testSuite.children) {
      if (test.type !== 'test') continue;
      this.printCaseResult(test);
    }

    console.log('');
    console.log(
      ' ',
      `see results for ${meta.evaluation.name}-${meta.evaluation.version} at ${url}`,
    );
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
  ) {}

  private printCaseResult(test: TestCase) {
    const ok = test.ok();
    const testMeta = test.meta() as TaskMeta & { case: EvalCaseReport };

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

      if (!this.baseline) {
        console.log(c.blueBright('NO BASELINE'));
      }

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

  private printFancyReport(
    testSuite: TestSuite,
    meta: TaskMeta & { evaluation: EvaluationReport },
  ) {
    console.log('tktk printFancyReport', JSON.stringify({ testSuite, meta }, null, 2));
    const evalName = `${meta.evaluation.name} ${meta.evaluation.version}`;
    const runTimeUTC = new Date(this.startTime).toUTCString().replace('GMT', 'GMT');

    const url = `https://app.axiom.co/evaluations/${meta.evaluation.name}/${meta.evaluation.id}`;

    // Header banner
    const bannerLine = '='.repeat(80);
    console.log(bannerLine);
    console.log(centerText(evalName.toUpperCase(), 80));
    console.log(bannerLine);

    const judgeModel = this.currentEval?.prompt?.model || this.baseline?.prompt?.model || 'UNKNOWN';
    const runLine = `RUN TIME: ${runTimeUTC}          CASES: ${testSuite.children.size}    JUDGE: ${judgeModel}`;
    console.log(runLine);
    console.log('-'.repeat(80));

    // Config differential
    console.log('CONFIG DIFFERENTIAL ANALYSIS:');
    console.log('-'.repeat(80));

    const baseConfig = buildConfigObject(this.baseline);
    const currentConfig = buildConfigObject(this.currentEval);

    const diff = diffConfigs(baseConfig, currentConfig);
    printTwoColumnDiff('configBase', 'configComparison', diff.left, diff.right);

    console.log('');
    console.log(
      `SUMMARY: ${diff.additions} ADDITIONS, ${diff.modifications} MODIFICATIONS, ${diff.deletions} DELETIONS`,
    );
    console.log('');

    // Detailed score breakdown
    console.log('='.repeat(80));
    console.log(centerText('DETAILED SCORE BREAKDOWN', 80));
    console.log('='.repeat(80));

    printScoreBreakdown(this.baseline, this.currentEval);

    console.log('');
    console.log(
      ' ',
      `see results for ${meta.evaluation.name}-${meta.evaluation.version} at ${url}`,
    );
    console.log(
      ' ',
      c.cyanBright('=== === === === === === === === === === === === === === === ==='),
    );
    console.log('');
  }
}

// ---------- helpers ---------- //

function centerText(text: string, width: number) {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(pad) + text;
}

function buildConfigObject(ev?: Evaluation | null) {
  if (!ev) return {} as Record<string, unknown>;
  return {
    modelId: ev.prompt?.model ?? undefined,
    ...(ev.prompt?.params ?? {}),
  } as Record<string, unknown>;
}

function flatten(obj: any, prefix = ''): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function formatVal(v: any): string {
  if (v === undefined) return 'NULL';
  if (v === null) return 'NULL';
  if (typeof v === 'string') return v.length > 30 ? `${v.slice(0, 27)}...` : v;
  try {
    const s = JSON.stringify(v);
    return s.length > 30 ? `${s.slice(0, 27)}...` : s;
  } catch {
    return String(v);
  }
}

function diffConfigs(base: Record<string, unknown>, comp: Record<string, unknown>) {
  const leftFlat = flatten(base);
  const rightFlat = flatten(comp);

  const keys = Array.from(new Set([...Object.keys(leftFlat), ...Object.keys(rightFlat)])).sort();

  const leftLines: string[] = [];
  const rightLines: string[] = [];

  let additions = 0;
  let deletions = 0;
  let modifications = 0;

  for (const k of keys) {
    const lv = leftFlat[k];
    const rv = rightFlat[k];

    const equal = JSON.stringify(lv) === JSON.stringify(rv);

    if (lv !== undefined && rv !== undefined) {
      if (equal) {
        const line = `  ${k}: <SAME>`;
        leftLines.push(line);
        rightLines.push(line);
      } else {
        leftLines.push(`- ${k}: ${formatVal(lv)}`);
        rightLines.push(`+ ${k}: ${formatVal(rv)}`);
        modifications++;
      }
    } else if (lv !== undefined) {
      leftLines.push(`- ${k}: ${formatVal(lv)}`);
      rightLines.push('');
      deletions++;
    } else if (rv !== undefined) {
      leftLines.push('');
      rightLines.push(`+ ${k}: ${formatVal(rv)}`);
      additions++;
    }
  }

  return { left: leftLines, right: rightLines, additions, deletions, modifications };
}

function printTwoColumnDiff(
  leftHeader: string,
  rightHeader: string,
  leftLines: string[],
  rightLines: string[],
) {
  const rows = Math.max(leftLines.length, rightLines.length);
  const leftWidth = Math.max(leftHeader.length, ...leftLines.map((s) => s.length), 31);
  const rightWidth = Math.max(rightHeader.length, ...rightLines.map((s) => s.length), 38);

  const sep = `|${'-'.repeat(leftWidth + 2)}|${'-'.repeat(rightWidth + 2)}|`;
  console.log(`| ${pad(leftHeader, leftWidth)} | ${pad(rightHeader, rightWidth)} |`);
  console.log(sep);

  for (let i = 0; i < rows; i++) {
    const l = leftLines[i] ?? '';
    const r = rightLines[i] ?? '';
    console.log(`| ${pad(l, leftWidth)} | ${pad(r, rightWidth)} |`);
  }
}

function pad(s: string, w: number) {
  if (s.length >= w) return s.padEnd(w, ' ');
  return s + ' '.repeat(w - s.length);
}

function printScoreBreakdown(base?: Evaluation | null, comp?: Evaluation | null) {
  const indices = Array.from(
    new Set([
      ...(base?.cases ?? []).map((c) => c.index),
      ...(comp?.cases ?? []).map((c) => c.index),
    ]),
  ).sort((a, b) => a - b);

  const scorerNames = Array.from(
    new Set([
      ...((base?.cases ?? []).flatMap((c) => Object.keys(c.scores)) ?? []),
      ...((comp?.cases ?? []).flatMap((c) => Object.keys(c.scores)) ?? []),
    ]),
  ).sort();

  const colWidths: number[] = [];
  const header = ['Case', ...scorerNames];

  // Compute widths based on cell contents
  for (let i = 0; i < header.length; i++) {
    colWidths[i] = header[i].length;
  }

  const cellVal = (idx: number, scorer: string) => {
    const b = base?.cases.find((c) => c.index === idx)?.scores?.[scorer]?.value;
    const cval = comp?.cases.find((c) => c.index === idx)?.scores?.[scorer]?.value;
    return `${formatScore(b)} -> ${formatScore(cval)}`.trim();
  };

  // Update widths
  for (const idx of indices) {
    colWidths[0] = Math.max(colWidths[0], String(idx).length);
    for (let j = 0; j < scorerNames.length; j++) {
      const v = cellVal(idx, scorerNames[j]);
      colWidths[j + 1] = Math.max(colWidths[j + 1] ?? 0, v.length);
    }
  }

  // Print header and separator
  const sep = `|${colWidths.map((w) => '-'.repeat(w + 2)).join('|')}|`;
  console.log(`| ${header.map((h, i) => pad(h, colWidths[i])).join(' | ')} |`);
  console.log(sep);

  // Rows
  for (const idx of indices) {
    const row = [pad(String(idx), colWidths[0])];
    for (const s of scorerNames) {
      row.push(pad(cellVal(idx, s), colWidths[row.length]));
    }
    console.log(`| ${row.join(' | ')} |`);
  }

  // Footer separator
  console.log(sep);
}

function formatScore(v?: number) {
  if (v === undefined || v === null) return '-';
  if (v >= 0 && v <= 1) return `${Math.round(v * 100)}%`;
  // show one decimal place for non-percentage values
  return Number(v).toFixed(1);
}

function buildEvalFromSuite(
  meta: TaskMeta & { evaluation: EvaluationReport },
  suite: TestSuite,
): Evaluation {
  const cases: Evaluation['cases'] = [];
  let maxIndex = -1;
  for (const child of suite.children) {
    if (child.type !== 'test') continue;
    const m = child.meta() as TaskMeta & { case: EvalCaseReport };
    if (!m || !m.case) continue;
    const scoreEntries: Record<
      string,
      { name: string; value: number; metadata: Record<string, any> }
    > = {};
    for (const [name, s] of Object.entries(m.case.scores ?? {})) {
      scoreEntries[name] = { name, value: Number(s.score ?? 0), metadata: s.metadata ?? {} };
    }
    cases.push({
      index: m.case.index,
      input: typeof m.case.input === 'string' ? m.case.input : JSON.stringify(m.case.input),
      output: typeof m.case.output === 'string' ? m.case.output : JSON.stringify(m.case.output),
      expected:
        typeof m.case.expected === 'string' ? m.case.expected : JSON.stringify(m.case.expected),
      duration: m.case.duration ? `${(m.case.duration / 1000).toFixed(2)}s` : '-',
      status: m.case.status,
      scores: scoreEntries,
      runAt: new Date(m.case.startedAt ?? Date.now()).toISOString(),
      spanId: '',
      traceId: meta.evaluation.id,
    });
    maxIndex = Math.max(maxIndex, m.case.index);
  }
  cases.sort((a, b) => a.index - b.index);
  return {
    id: meta.evaluation.id,
    name: meta.evaluation.name,
    type: 'regression',
    version: meta.evaluation.version,
    baseline: { id: undefined, name: undefined },
    collection: { name: 'custom', size: maxIndex + 1 },
    prompt: { model: 'UNKNOWN', params: {} },
    duration: 0,
    status: 'OK',
    traceId: meta.evaluation.id,
    runAt: new Date().toISOString(),
    tags: [],
    user: { name: undefined, email: undefined },
    cases,
  };
}
