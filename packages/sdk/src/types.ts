export type PromptInput = {
    name: string
    messages: {role: string, content: string}[]
    model: string
    temperature: number
}

export type Prompt = PromptInput & {
    id: string
    environment: 'production' | 'staging' | 'development' | null
    version: string;
}

export type Project = {
    name: string
}
