import { Axiom } from '@axiomhq/ai'
import { z } from 'zod'

const ai = new Axiom('API_KEY')

async function main() {
    const prompt = await ai.prompts.create({
        name: 'Email Summarizer',
        slug: 'email-summarizer',
        messages: [
            {
                role: 'system',
                content: 'Summarize emails concisely, highlighting action items.'
            },
            {
                role: 'user',
                content: 'this is my {{email_content}} and sdflsdfnbskdf'
            }
        ],
        model: {
            id: 'gpt-4',
            provider: 'openai',
            params: {
                temperature: 0.3
            }
        },
        arguments: {
            email_content: z.string()
        }
    })

    // Deploy to production
    await ai.prompts.deploy(prompt.id, {
        environment: 'production',
        version: prompt.version
    });

    ai.run(
        prompt,
        {
            email_content: 'Hello, how are you?'
        }
    )
}

main().then(() => {
    console.log('done')
})