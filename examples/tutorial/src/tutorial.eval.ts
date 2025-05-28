import { Axiom } from '@axiomhq/ai'
import { Factuality } from 'autoevals'

const ai = new Axiom('API_KEY')

async function main() {
    const prompt = await ai.prompts.create('test', {
        name: 'email-summarizer',
        messages: [
            {
                role: 'system',
                content: 'Summarize emails concisely, highlighting action items.'
            },
            {
                role: 'user',
                content: '{{email_content}}'
            }
        ],
        model: 'gpt-4',
        temperature: 0.3
    })


    ai.eval(
        {
            project: 'test',
            prompt: prompt.name,
            data: [{ input: 'test', output: 'test' }],
            task: (input: string) => 'hi, ' + input,
            scorers: [Factuality]
        }
    )
}

main().then(() => {
    console.log('done')
})