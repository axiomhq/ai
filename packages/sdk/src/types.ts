export type PromptInput = {
    name: string
    slug: string // e.g: 'my-prompt'
    messages: {role: string, content: string}[]
    model: {
        id: string // e.g: 'gpt-4'
        provider: string // e.g: 'openai'
        params: {
            temperature: number, // e.g: 0.5
            max_tokens?: number // e.g: 150
        }
    }
    /* map of key-value pairs that are passed to the prompt */
    arguments: Record<string, any>
}

export type Prompt = PromptInput & {
    id: string
    environment: 'production' | 'staging' | 'development' | null
    version: string;
}

export type LibraryInput = {
    name: string
    description: string | null
    messages: {role: string, content: string}[]
    model: string
    temperature: number
}