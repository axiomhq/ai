import { type Span } from '@opentelemetry/api';
import { type Tool as ToolV4 } from 'aiv4';
import { type Tool as ToolV5 } from 'aiv5';
import { createStartActiveSpan } from './startActiveSpan';
import { Attr } from './semconv/attributes';
import { typedEntries } from '../util/typedEntries';
import { setAxiomBaseAttributes, getTracer, classifyToolError } from './utils/wrapperUtils';

type Tool = ToolV4 | ToolV5;

/**
 * Type representing a wrapped tool with preserved TypeScript signatures
 */
type WrappedTool<T extends Tool> = T;

/**
 * Wraps a tool to create child spans when the tool's execute method is called.
 *
 * @param toolName The name of the tool (key from the tools object) - span name will be `execute_tool <toolName>`
 * @param tool The tool to wrap
 * @returns The same tool but with a wrapped execute method that creates spans
 */
export function wrapTool<T extends Tool>(toolName: string, tool: T): T {
  if (!tool || typeof tool !== 'object') {
    console.error('Invalid tool provided to wrapTool');
    return tool;
  }

  if (!('execute' in tool) || typeof tool.execute !== 'function') {
    console.error('Cannot wrap a tool that does not have an execute method');
    return tool;
  }

  return {
    ...tool,
    execute: async (
      args: Parameters<NonNullable<T['execute']>>[0],
      opts: Parameters<NonNullable<T['execute']>>[1],
    ) => {
      const tracer = getTracer();
      const startActiveSpan = createStartActiveSpan(tracer);
      const spanName = `${Attr.GenAI.Operation.Name_Values.ExecuteTool} ${toolName}`;

      return startActiveSpan(spanName, null, async (span: Span) => {
        // Set Axiom base attributes
        setAxiomBaseAttributes(span);

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

        try {
          // Execute the original tool function
          const result = await tool.execute!(args, opts as any);

          // Set the tool result message
          try {
            span.setAttribute(Attr.GenAI.Tool.Message, JSON.stringify(result));
          } catch (error) {
            // Handle circular references or other JSON serialization errors
            span.setAttribute(Attr.GenAI.Tool.Message, '[Unable to serialize result]');
          }

          return result;
        } catch (err) {
          // Use comprehensive error classification for tool errors
          classifyToolError(err, span);

          // TOOL ERROR PROPAGATION POLICY:
          // Always re-throw tool errors to allow the calling code/AI SDK to decide
          // whether to handle gracefully or fail the parent span.
          //
          // Error scenarios:
          // - Tool validation errors → Tool span ERROR, parent span decision depends on AI SDK
          // - Tool execution timeout → Tool span ERROR, parent span decision depends on AI SDK
          // - External API failures → Tool span ERROR, parent span decision depends on AI SDK
          // - Tool throws unhandled exception → Tool span ERROR, parent span ERROR (propagated)
          //
          // This preserves the original behavior while ensuring proper error telemetry
          throw err;
        }
      });
    },
  } as WrappedTool<T>;
}

/**
 * Wraps multiple tools to create child spans when their execute methods are called.
 *
 * @param tools An object containing tools to wrap
 * @returns The same object with all tools wrapped
 */
export function wrapTools<T extends Record<string, Tool>>(tools: T): T {
  if (!tools || typeof tools !== 'object') {
    console.error('Invalid tools object provided to wrapTools');
    return tools as { [K in keyof T]: WrappedTool<T[K]> };
  }

  const wrappedTools = {} as { [K in keyof T]: WrappedTool<T[K]> };

  for (const [toolName, tool] of typedEntries(tools)) {
    wrappedTools[toolName] = wrapTool(toolName as string, tool);
  }

  return wrappedTools;
}
