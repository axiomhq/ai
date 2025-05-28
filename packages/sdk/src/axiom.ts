import { Eval, type EvalParams } from './eval'
import { createProject } from './projects'
import { createPrompt, deployPrompt } from './prompts'
import type { PromptInput } from './types'

export class Axiom {
    constructor(private readonly apiKey: string) { }

    prompts = {
        create: (project: string, input: PromptInput) => {
            console.log(this.apiKey)
            return createPrompt(project, input)
        },

        deploy: (prompt: string, { environment, version }: { environment: 'production' | 'staging' | 'development', version: string }) => {
            return deployPrompt(prompt, { environment, version })
        }
    }

    projects = {
        create: (name: string) => {
            return createProject(name)
        }
    }

    run({ project, prompt, inputs }: { project: string, prompt: string, inputs: Record<string, any> }) {
        console.log(project, prompt, inputs)
    }

    eval({ project, prompt, data, task, scorers }: EvalParams) {
        Eval({ project, prompt, data, task, scorers })
    }
}
