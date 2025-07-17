import { type Span, trace } from '@opentelemetry/api';
import { type Tool } from 'aiv4';
import { AxiomAIResources } from './shared';
import { createStartActiveSpan } from './startActiveSpan';
import { Attr } from './semconv/attributes';

/**
 * Wraps a tool to create child spans when the tool's execute method is called.
 *
 * @param toolName The name of the tool (key from the tools object) - span name will be `execute_tool <toolName>`
 * @param tool The tool to wrap
 * @returns The same tool but with a wrapped execute method that creates spans
 */
export function wrapToolV1<T extends Tool>(toolName: string, tool: T): T {
  if (!('execute' in tool)) {
    console.error('Cannot wrap a tool that does not have an execute method');
    return tool;
  }

  return {
    ...tool,
    execute: async (
      args: Parameters<NonNullable<T['execute']>>[0],
      opts: Parameters<NonNullable<T['execute']>>[1],
    ) => {
      const tracer = AxiomAIResources.getInstance().getTracer() ?? trace.getTracer('@axiomhq/ai');
      const startActiveSpan = createStartActiveSpan(tracer);
      const spanName = `${Attr.GenAI.Operation.Name_Values.ExecuteTool} ${toolName}`;

      return startActiveSpan(spanName, null, async (span: Span) => {
        span.setAttribute(Attr.GenAI.Tool.CallID, opts.toolCallId);
        span.setAttribute(Attr.GenAI.Operation.Name, Attr.GenAI.Operation.Name_Values.ExecuteTool);
        span.setAttribute(Attr.GenAI.Tool.Name, toolName);

        const type = 'type' in args ? args.type : 'function';
        span.setAttribute(Attr.GenAI.Tool.Type, type);

        if (tool.description) {
          span.setAttribute(Attr.GenAI.Tool.Description, tool.description);
        }

        try {
          span.setAttribute(Attr.GenAI.Tool.Arguments, JSON.stringify(args));
        } catch (error) {
          // Handle circular references or other JSON serialization errors
          span.setAttribute(Attr.GenAI.Tool.Arguments, '[Unable to serialize arguments]');
        }

        // Execute the original tool function
        const result = await tool.execute!(args, opts);

        // Set the tool result message
        try {
          span.setAttribute(Attr.GenAI.Tool.Message, JSON.stringify(result));
        } catch (error) {
          // Handle circular references or other JSON serialization errors
          span.setAttribute(Attr.GenAI.Tool.Message, '[Unable to serialize result]');
        }

        return result;
      });
    },
  };
}
