import { Text } from '@/components/text';
import type { SupportAgentResult } from '@/lib/capabilities/support-agent/support-agent';

type AgentInternalsProps = {
  result: SupportAgentResult;
};

function TriageSection({ category }: { category: SupportAgentResult['category'] }) {
  return (
    <section className="border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Step 1: Triage
      </h3>
      <div className="flex items-center gap-2">
        <span className="text-gray-700">Category:</span>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
          ${
            category === 'spam'
              ? 'bg-red-100 text-red-800'
              : category === 'support'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
          }`}
        >
          {category}
        </span>
      </div>
    </section>
  );
}

function TicketSection({ ticket }: { ticket: NonNullable<SupportAgentResult['ticket']> }) {
  return (
    <section className="border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Ticket State
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-xs text-gray-500 block">Intent</span>
          <span className="text-sm font-medium">{ticket.ticketInfo.intent || 'Unknown'}</span>
        </div>
        <div>
          <span className="text-xs text-gray-500 block">Product</span>
          <span className="text-sm font-medium">{ticket.ticketInfo.product || 'Unknown'}</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Status:</span>
          {ticket.status.isComplete ? (
            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
              ✓ Ready to file
            </span>
          ) : (
            <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
              ⚠ Needs Info: {ticket.status.missingFields.join(', ')}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export function AgentInternals({ result }: AgentInternalsProps) {
  return (
    <div className="flex flex-col gap-6 max-w-3xl border-t pt-6">
      <Text variant="subtitle" className="text-lg font-bold">
        Agent Internals (Latest Turn)
      </Text>
      <TriageSection category={result.category} />
      {result.ticket && <TicketSection ticket={result.ticket} />}
    </div>
  );
}
