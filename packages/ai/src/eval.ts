import type { EvalParams } from "./types"

export const Eval = async ({ data, task, scorers }: EvalParams) => {
    const results: { input: any, output: any, score: any }[] = []
    
    await data.forEach(({ input, expected }) => {
        const output = task(input)
        const score = scorers.map(scorer => scorer(output, expected))
        results.push({ input, output, score })
        console.log(results)
    })

    // TODO: send experiment results to Axiom
    console.log('TODO: send experiment results to Axiom')

    return results
}
