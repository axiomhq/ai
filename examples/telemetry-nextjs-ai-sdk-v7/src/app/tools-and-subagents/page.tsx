import { createSupportAgents } from '@/shared/support-agents';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const requestId = crypto.randomUUID();
  const { mainAgent } = createSupportAgents({
    requestId,
    tenant: 'demo-tenant',
    demo: 'tools-and-subagents',
  });

  const result = await mainAgent.generate({
    prompt:
      'Customer cus_928 asks for help with delayed order ord_1042, tracking DP-4409-AX, and wants to know if a refund or credit is available.',
  });

  const toolNames = result.toolCalls.map((toolCall) => toolCall.toolName);
  const toolResults = result.toolResults.map((toolResult) => ({
    toolName: toolResult.toolName,
    output: toolResult.output,
  }));

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f7f4ed',
        color: '#17130f',
        fontFamily: 'Georgia, Cambria, serif',
        padding: '56px clamp(20px, 6vw, 80px)',
      }}
    >
      <section style={{ maxWidth: '960px' }}>
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 14,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          request {requestId}
        </p>
        <h1 style={{ margin: 0, maxWidth: 760, fontSize: 52, lineHeight: 1.02, fontWeight: 500 }}>
          Vercel AI SDK v7 tools and subagents
        </h1>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)',
          gap: 24,
          maxWidth: 1180,
          marginTop: 36,
        }}
      >
        <article
          style={{
            borderTop: '2px solid #17130f',
            paddingTop: 20,
            fontSize: 20,
            lineHeight: 1.55,
          }}
        >
          {result.text}
        </article>

        <aside
          style={{
            border: '1px solid #17130f',
            borderRadius: 8,
            padding: 20,
            background: '#fffaf0',
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>Agent path</h2>
          <ol style={{ margin: 0, paddingLeft: 22 }}>
            {toolNames.map((toolName, index) => (
              <li key={`${toolName}-${index}`} style={{ marginBottom: 8 }}>
                {toolName}
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section style={{ maxWidth: 1180, marginTop: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Tool outputs</h2>
        <pre
          style={{
            overflow: 'auto',
            borderRadius: 8,
            background: '#17130f',
            color: '#f7f4ed',
            padding: 20,
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          {JSON.stringify(toolResults, null, 2)}
        </pre>
      </section>
    </main>
  );
}
