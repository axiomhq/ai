import { Axiom } from '@axiomhq/ai'
// import { Factuality } from 'autoevals'

const ai = new Axiom('API_KEY')

async function main() {
    ai.eval(
        {
            project: 'test',
            data: [{ input: 'test', expected: 'hi, test' }],
            task: (input: string) => 'hi, ' + input,
            // scorers: [Factuality]
            scorers: []
        }
    )
}

main().then(() => {
    console.log('done')
})