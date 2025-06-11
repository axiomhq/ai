import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'
import type { RunnerTestFile, Vitest, Reporter } from 'vitest/node'

// TODO: move reporter to sdk package
export class AxiomReporter implements Reporter {

  private vitest!: Vitest

  onInit(vitest: Vitest) {
    this.vitest = vitest
  }
  
  onCollected() {
    
  }

  onFinished(files: RunnerTestFile[]) {
    for (const file of files) {
      // note that the old task implementation uses "file" instead of "module"
      const testModule = this.vitest.state.getReportedEntity(file) as any
      for (const task of testModule.children) {
        console.log('finished', task.type, task.fullName)
      }
    }
  }
}

export default defineConfig({
    plugins: [dts()],
    test: {
        reporters: ['verbose', 'json', new AxiomReporter()],
        include: ["test/**/*.eval.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"]
    },
})