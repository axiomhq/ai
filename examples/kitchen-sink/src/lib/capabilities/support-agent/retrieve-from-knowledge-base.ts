import { flag } from '@/lib/app-scope';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { wrapAISDKModel } from 'axiom/ai';

const veryBadKnowledgeBase = [
  {
    id: 'kb_reset_pw',
    title: 'Resetting your password',
    body: 'To reset your password, go to Settings > Security > Reset Password and follow the email link...',
  },
  {
    id: 'kb_cancel',
    title: 'Cancel your subscription',
    body: 'You can cancel any time from Settings > Billing > Cancel subscription. Your current period remains active until the end date...',
  },
  {
    id: 'kb_invoice',
    title: 'Download past invoices',
    body: 'To download past invoices, navigate to Settings > Billing > Invoices and click the download icon next to the invoice...',
  },
];

export const veryBadRAG = async (topic: string) => {
  const modelName = flag('supportAgent.retrieveFromKnowledgeBase.model');
  const maxDocuments = flag('supportAgent.retrieveFromKnowledgeBase.maxDocuments');

  const model = wrapAISDKModel(openai(modelName));

  const res = await generateText({
    model: model,
    messages: [
      {
        role: 'system',
        content: `You are a retrieval system.
Your goal is to help find documents that are relevant for the user's query.
Please retrieve exactly ${maxDocuments} document(s).
If there are no valid documents, you may return the string "NONE"
If there are one or more relevant documents, return their ids separated by commas
(example: "kb_cancel, kb-invoice")
`,
      },
      {
        role: 'system',
        content: `Your knowledge base is:
${veryBadKnowledgeBase.map((item) => `- id: ${item.id} - ${item.title}`).join('\n')}`,
      },
      { role: 'user', content: `I would like to know about: ${topic}` },
    ],
  });

  if (res.text === 'NONE') {
    return { status: 'success', documents: [] };
  }

  const elements = res.text.split(',').map((i) => i.trim().toLowerCase());

  let status = 'success';
  const documents = [];
  for (const element of elements) {
    const doc = veryBadKnowledgeBase.find((item) => item.id === element);
    if (doc) {
      documents.push(doc);
    } else {
      status = 'error_suggested_nonexistent_document';
    }
  }

  if (documents.length === 0) {
    return { status: 'success', documents: [] };
  }

  return { status, documents };
};
