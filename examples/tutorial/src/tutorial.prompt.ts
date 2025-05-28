import { Axiom } from '@axiomhq/ai'

const ai = new Axiom('API_KEY')

async function main() {
    const project = await ai.projects.create('finetune-email-summary')

    const prompt = await ai.prompts.create(project.name, {
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

    // Deploy to production
    await ai.prompts.deploy(prompt.id, {
        environment: 'production',
        version: prompt.version
    });

    ai.run(
        {
            project: project.name,
            prompt: 'email-summarizer',
            inputs: {
                email_content: 'Hello, how are you?'
            }
        }
    )
}

main().then(() => {
    console.log('done')
})