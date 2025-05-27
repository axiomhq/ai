# Axiom AI

This repo contains all the SDKs and libraries needed for AI models obsverability.

## Information Architecture 

    Projects > Prompts >  
             > Library > Input / Output
             > Scorers > 
             > Tools   >
             > Functions? >

## CLI usage

    `npx axiom --project PROJECT_ID exec PROMPT_SLUG`

#### Push Function

```bash
npx axiom --project PROJECT_ID push function.ts
```


3. SDK usage

```ts
import AxiomClient from '@axiomhq/ai'


const axiom = new AxiomClient({
    projectId: '',
    token: ''
})

const result = await axiom.exec('PROMPT_SLUG')
const result = await axiom.eval('')
```