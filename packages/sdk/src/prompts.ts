import type { Prompt, PromptInput } from "./types"

export const createPrompt = (project: string, input: PromptInput): Prompt => {
    console.log(project, input)
    return { id: 'NOT_IMPLEMENTED', version: 'NOT_IMPLEMENTED', environment: 'development', ...input }
}

export const deployPrompt = (promptId: string, { environment, version }: { environment: 'production' | 'staging' | 'development', version: string }) => {
    console.log(promptId, environment, version)
}