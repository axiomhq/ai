export type EvalParams = {
    project: string
    prompt: string
    data: { input: any, output: any }[],
    task: (input: any) => any,
    scorers: Function[]
}


export const Eval = ({ project, prompt, data, task, scorers }: EvalParams) => {
    console.log(project, prompt, data, task, scorers)
    return { output: 'NOT_IMPLEMENTED' }
}
