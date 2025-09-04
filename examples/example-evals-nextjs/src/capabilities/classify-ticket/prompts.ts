import {
    experimental_Prompt as Prompt,
    experimental_Type as Type,
  } from "axiom/ai";
  import { SupportTicketCategorySchema } from "./schemas";
  
  // TODO: We should incorporate structured output support here.
  export const classifyTicketPrompt = {
    name: "Classify ticket",
    slug: "classify-ticket",
    messages: [
      {
        role: "system",
        content: `You are technical customer support engineer responsible for classifying inbound tickets into one of the following categories: ${SupportTicketCategorySchema.options.join(
          ", "
        )}.
        
        If the ticket is spam, return a polite response that explains why the ticket has been automatically closed. Avoid using the word spam, since it could be inflammatory.
        If the ticket is not spam, return a polite response that explains a team member will be in touch with the user shortly.`,
      },
      {
        role: "user",
        content:
          "{{#if subject}}Subject: {{subject}} {{/if}}Content: {{content}}",
      },
    ],
    model: "gpt-4o-mini",
    options: {},
    arguments: {
      subject: Type.Optional(Type.String()),
      content: Type.String(),
    },
    version: "1.0.0",
  } satisfies Prompt;