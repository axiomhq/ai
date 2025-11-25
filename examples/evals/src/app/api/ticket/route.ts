import { classifyTicketStep } from '@/lib/capabilities/classify-ticket/prompts';
import { SupportTicketInputSchema } from '@/lib/capabilities/classify-ticket/schemas';

export async function POST(req: Request) {
  const body = await req.json();
  const input = SupportTicketInputSchema.parse(body);
  const result = await classifyTicketStep(input);
  return Response.json(result);
}
