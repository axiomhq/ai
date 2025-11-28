import type { SerializedError } from 'vitest';
import type { Reporter, TestCase, TestModule, TestRunEndReason, TestSuite } from 'vitest/node';

import { getAxiomConfig } from './context/storage';
import type { EvaluationReport, MetaWithCase, MetaWithEval, Case } from './eval.types';
import {
  printBaselineNameAndVersion,
  printEvalNameAndFileName,
  printFinalReport,
  printGlobalFlagOverrides,
  printTestCaseCountStartDuration,
  type SuiteData,
  printOrphanedBaselineCases,
  getCaseFingerprint,
  printCaseResult,
} from './reporter.console-utils';
import { resolveAxiomConnection, type AxiomConnectionResolvedConfig } from '../config/resolver';
import { getConsoleUrl } from '../cli/commands/eval.command';
import { dotNotationToNested, flattenObject } from '../util/dot-path';

/**
 * Custom Vitest reporter for Axiom AI evaluations.
 *
 * This reporter collects evaluation results and scores from tests
 * and processes them for further analysis and reporting.
 *
 */
export class AxiomReporter implements Reporter {
  startTime: number = 0;
  start: number = 0;
  private _endOfRunConfigEnd: EvaluationReport['configEnd'] | undefined;
  private _suiteData: SuiteData[] = [];
  private _printedFlagOverrides = false;
  private _config: AxiomConnectionResolvedConfig | undefined;

  onTestRunStart() {
    this.start = performance.now();
    this.startTime = new Date().getTime();

    // Store resourcesUrl from config
    const config = getAxiomConfig();
    if (config) {
      this._config = resolveAxiomConnection(config, getConsoleUrl());
    }
  }

  async onTestSuiteReady(_testSuite: TestSuite) {
    const meta = _testSuite.meta() as MetaWithEval;
    if (_testSuite.state() === 'skipped' || !meta?.evaluation) {
      return;
    }

    // Print flag overrides once when defaults become available
    // (we don't have them in `onTestRunStart`)
    if (!this._printedFlagOverrides) {
      const defaultsFromConfigEnd = meta.evaluation.configEnd?.flags ?? {};
      const overridesFromConfigEnd = meta.evaluation.configEnd?.overrides ?? {};

      if (Object.keys(overridesFromConfigEnd).length > 0) {
        printGlobalFlagOverrides(overridesFromConfigEnd, defaultsFromConfigEnd);
      }
      this._printedFlagOverrides = true;
    }

    // capture end-of-run config snapshot (first non-empty wins)
    if (meta.evaluation.configEnd && !this._endOfRunConfigEnd) {
      this._endOfRunConfigEnd = meta.evaluation.configEnd;
    }
  }

  onTestCaseReady(test: TestCase) {
    const meta = test.meta() as MetaWithCase;

    // TODO: there seem to be some cases where `meta` is undefined
    // maybe we get here to early?
    if (!meta.case) return;
  }

  async onTestSuiteResult(testSuite: TestSuite) {
    const meta = testSuite.meta() as MetaWithEval;
    // test suite won't have any meta because its skipped or failed before setup
    if (testSuite.state() === 'skipped' || !meta?.evaluation) {
      return;
    }

    // capture end-of-run config snapshot (first non-empty wins)
    if (meta.evaluation.configEnd && !this._endOfRunConfigEnd) {
      this._endOfRunConfigEnd = meta.evaluation.configEnd;
    }

    const durationSeconds = Number((performance.now() - this.start) / 1000).toFixed(2);

    const cases: SuiteData['cases'] = [];
    for (const test of testSuite.children) {
      if (test.type !== 'test') continue;

      const testMeta = test.meta() as MetaWithCase;
      if (!testMeta?.case) continue;

      cases.push({
        index: testMeta.case.index,
        scores: testMeta.case.scores,
        outOfScopeFlags: testMeta.case.outOfScopeFlags,
        errors: testMeta.case.errors,
        runtimeFlags: testMeta.case.runtimeFlags,
      });
    }

    const cwd = process.cwd();
    const relativePath = testSuite.module.moduleId.replace(cwd, '').replace(/^\//, '');

    // Collect suite data for final report
    let suiteBaseline = meta.evaluation.baseline;

    let flagConfig = meta.evaluation.flagConfig;
    if (meta.evaluation.configEnd) {
      const defaults = meta.evaluation.configEnd.flags ?? {};
      const overrides = meta.evaluation.configEnd.overrides ?? {};
      const defaultsFlat = flattenObject(defaults);
      const overridesFlat = flattenObject(overrides);
      flagConfig = dotNotationToNested({ ...defaultsFlat, ...overridesFlat });
    }

    this._suiteData.push({
      name: meta.evaluation.name,
      file: relativePath,
      duration: durationSeconds + 's',
      baseline: suiteBaseline || null,
      configFlags: meta.evaluation.configFlags,
      flagConfig,
      runId: meta.evaluation.runId,
      orgId: meta.evaluation.orgId,
      cases,
      outOfScopeFlags: meta.evaluation.outOfScopeFlags,
      registrationStatus: meta.evaluation.registrationStatus,
    });

    printEvalNameAndFileName(testSuite, meta);
    printBaselineNameAndVersion(meta);

    printTestCaseCountStartDuration(testSuite, this.startTime, durationSeconds);

    const matchedBaselineIndices = new Set<number>();
    const baselineCasesByFingerprint = new Map<string, Case[]>();

    if (suiteBaseline) {
      for (const c of suiteBaseline.cases) {
        const fp = getCaseFingerprint(c.input, c.expected);
        const cases = baselineCasesByFingerprint.get(fp) || [];
        cases.push(c);
        baselineCasesByFingerprint.set(fp, cases);
      }
    }

    for (const test of testSuite.children) {
      if (test.type !== 'test') continue;
      printCaseResult(test, baselineCasesByFingerprint, matchedBaselineIndices);
    }

    if (suiteBaseline) {
      printOrphanedBaselineCases(suiteBaseline, matchedBaselineIndices);
    }

    console.log('');
  }

  async onTestRunEnd(
    _testModules: ReadonlyArray<TestModule>,
    _errors: ReadonlyArray<SerializedError>,
    _reason: TestRunEndReason,
  ) {
    const shouldClear = !process.env.CI && process.stdout.isTTY !== false;

    if (shouldClear) {
      process.stdout.write('\x1b[2J\x1b[0f'); // Clear screen and move cursor to top
    }

    const registrationStatus = this._suiteData.map((suite) => ({
      name: suite.name,
      registered: suite.registrationStatus?.status === 'success',
      error:
        suite.registrationStatus?.status === 'failed' ? suite.registrationStatus.error : undefined,
    }));

    const isDebug = process.env.AXIOM_DEBUG === 'true';

    printFinalReport({
      suiteData: this._suiteData,
      config: this._config,
      registrationStatus,
      isDebug,
    });
  }
}
