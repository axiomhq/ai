import { Eval, type EvalParams } from './eval'
import HTTPClient from './httpClient'
import type { LibraryInput, Prompt, PromptInput } from './types'

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

    library = {
        create: async (project: string, input: LibraryInput): Promise<Prompt> => {
            return await this.client.post<Prompt>(`/projects/${project}/library`, {
                body: JSON.stringify(input)
            })
        }
    }

    /*
     * Wraps a function in a span and attaches the scope to the span then calls the model function.
     *
     * @param scope - The scope to attach to the span.
     * @param fn - The function to wrap.
     * @returns The result of the function.
     */
    async withAxiom(scope: { workflow: string, task: string }, fn: () => Promise<any>) {
        // TODO: create a span and attach scope
        // TODO: add a trace to the span
        return await fn()
    }

    eval({ project, data, task, scorers }: EvalParams) {
        return Eval({ project, data, task, scorers })
    }
}
