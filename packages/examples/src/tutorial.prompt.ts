import { Axiom, type Prompt } from "@axiomhq/ai";
import { z } from "zod";

const ai = new Axiom("API_KEY");

const samplePrompt = {
  name: "Email Summarizer",
  slug: "email-summarizer",
  messages: [
    {
      role: "system",
      content:
        "Summarize emails concisely, highlighting action items, the user is named {{ getUserName() }}",
    },
    {
      role: "user",
      content: "this is my {{ email_content }} and sdflsdfnbskdf",
    },
  ],
  // model: {
  //   id: "gpt-4",
  //   provider: "openai",
  //   params: {
  //     temperature: 0.3,
  //   },
  // },
  arguments: {
    email_content: z.string(),
    getUserName: z.function().returns(z.string()),
  },
  id: "email-summarizer",
  environment: "production",
  version: "1.0.0",
} satisfies Prompt;

async function promptInternal(ai: Axiom) {
  const prompt = await ai.prompts.create({
    name: "Email Summarizer",
    slug: "email-summarizer",
    messages: [
      {
        role: "system",
        content: "Summarize emails concisely, highlighting action items.",
      },
      {
        role: "user",
        content: "this is my {{email_content}} and sdflsdfnbskdf",
      },
    ],
    // model: {
    //   id: "gpt-4",
    //   provider: "openai",
    //   params: {
    //     temperature: 0.3,
    //   },
    // },
    arguments: {
      email_content: z.string(),
    },
  });

  // Deploy to production
  await ai.prompts.deploy(prompt.id, {
    environment: "production",
    version: prompt.version,
  });

  ai.run(prompt, {
    email_content: "Hello, how are you?",
  });
}

const promptUsage = async (ai: Axiom) => {
  const prompt = await ai.run(samplePrompt, {
    email_content: "Hello, how are you?",
    getUserName: () => "John Doe",
  });

  console.log(prompt);
};

promptInternal(ai)
  .then(() => {
    console.log("done");
  })
  .catch((error) => {
    console.error(error);
  });

promptUsage(ai)
  .then(() => {
    console.log("done");
  })
  .catch((error) => {
    console.error(error);
  });
