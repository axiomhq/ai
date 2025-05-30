import { Eval, type EvalParams } from './eval'
import HTTPClient from './httpClient'
import type { LibraryInput, Project, Prompt, PromptInput } from './types'

export type ClientOptions = {
    onError?: (error: Error) => void
}

export class Axiom extends HTTPClient {

    constructor(apiKey: string, private opts: ClientOptions = {}) {
        super({ apiKey })

        // default options
        if (!this.opts.onError) {
            this.opts.onError = (error) => {
                console.error(error)
            }
        }
    }

    prompts = {
        create: async (project: string, input: PromptInput): Promise<Prompt> => {
            return await this.client.post<Prompt>(`/projects/${project}/prompts`, {
                body: JSON.stringify(input)
            })
        },

        deploy: async (project: string, promptId: string, { environment, version }: { environment: 'production' | 'staging' | 'development', version: string }) => {
            return await this.client.put<Prompt>(`/projects/${project}/prompts/${promptId}/deploy`, {
                body: JSON.stringify({ promptId, environment, version })
            })
        }
    }

    projects = {
        create: async (name: string): Promise<Project> => {
            return await this.client.post<Project>('/projects', { body: JSON.stringify({ name }) })
        }
    }

    library = {
        create: async (project: string, input: LibraryInput): Promise<Prompt> => {
            return await this.client.post<Prompt>(`/projects/${project}/library`, {
                body: JSON.stringify(input)
            })
        }
    }

    run({ project, prompt, inputs }: { project: string, prompt: string, inputs: Record<string, any> }) {
        console.log(project, prompt, inputs)
    }

    eval({ project, data, task, scorers }: EvalParams) {
        return Eval({ project, data, task, scorers })
    }
}
