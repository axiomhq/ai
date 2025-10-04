import { type Span } from '@opentelemetry/api';
import { type Tool as ToolV4 } from 'aiv4';
import { type Tool as ToolV5 } from 'aiv5';
import { createStartActiveSpan } from './startActiveSpan';
import { Attr } from './semconv/attributes';
import { typedEntries } from '../util/typedEntries';
import {
  setAxiomBaseAttributes,
  getTracer,
  classifyToolError,
  setScopeAttributes,
} from './utils/wrapperUtils';
import { getRedactionPolicy, handleMaybeRedactedAttribute } from './utils/redaction';

type Tool = ToolV4 | ToolV5;
type WrappedTool<T> = T extends Tool ? T : never;

interface ToolLike {
  execute?: (...args: any[]) => any;
  description?: string;
  [key: string]: any;
}

/**
 * Wraps a tool to create child spans when the tool's execute method is called.
 *
 * @param toolName The name of the tool (key from the tools object) - span name will be `execute_tool <toolName>`
 * @param tool The tool to wrap
 * @returns The same tool but with a wrapped execute method that creates spans
 */
export function wrapTool<T extends ToolLike>(toolName: string, tool: T): T {
  if (!tool || typeof tool !== 'object') {
    console.error('Invalid tool provided to wrapTool, returning unwrapped tool');
    return tool as T;
  }

  if (!('execute' in tool) || typeof tool.execute !== 'function') {
    console.error(
      'Cannot wrap a tool that does not have an execute method, returning unwrapped tool',
    );
    return tool as T;
  }

  // After the type guard, we know execute exists and is a function
  const originalExecute = tool.execute as (...args: any[]) => any;

  return {
    ...tool,
    execute: async (...executeArgs: Parameters<typeof originalExecute>) => {
      const [args, opts] = executeArgs;
      const tracer = getTracer();
      const startActiveSpan = createStartActiveSpan(tracer);
      const spanName = `${Attr.GenAI.Operation.Name_Values.ExecuteTool} ${toolName}`;

      return startActiveSpan(spanName, null, async (span: Span) => {
        const redactionPolicy = getRedactionPolicy();

        setAxiomBaseAttributes(span);
        setScopeAttributes(span);

        // Handle different opts structures between AI SDK versions
        const toolCallId =
          opts && typeof opts === 'object'
            ? opts.toolCallId || opts.toolCall?.toolCallId
            : undefined;

        if (toolCallId) {
          span.setAttribute(Attr.GenAI.Tool.CallID, toolCallId);
        }

        span.setAttribute(Attr.GenAI.Operation.Name, Attr.GenAI.Operation.Name_Values.ExecuteTool);
        span.setAttribute(Attr.GenAI.Tool.Name, toolName);

        const type = args && typeof args === 'object' && 'type' in args ? args.type : 'function';
        span.setAttribute(Attr.GenAI.Tool.Type, type);

        if (tool.description) {
          span.setAttribute(Attr.GenAI.Tool.Description, tool.description);
        }

        if (redactionPolicy.mirrorToolPayloadOnToolSpan) {
          try {
            handleMaybeRedactedAttribute(
              span,
              Attr.GenAI.Tool.Arguments,
              JSON.stringify(args),
              redactionPolicy.captureMessageContent,
            );
          } catch (_error) {
            // Handle circular references or other JSON serialization errors
            span.setAttribute(Attr.GenAI.Tool.Arguments, '[Unable to serialize arguments]');
          }
        }

        try {
          // Execute the original tool function
          const result = await originalExecute(args, opts);

          // Conditionally set tool result message if mirroring is enabled
          if (redactionPolicy.mirrorToolPayloadOnToolSpan) {
            try {
              handleMaybeRedactedAttribute(
                span,
                Attr.GenAI.Tool.Message,
                JSON.stringify(result),
                redactionPolicy.captureMessageContent,
              );
            } catch (_error) {
              // Handle circular references or other JSON serialization errors
              span.setAttribute(Attr.GenAI.Tool.Message, '[Unable to serialize result]');
            }
          }

          return result;
        } catch (err) {
          classifyToolError(err, span);

          // Always re-throw tool errors to allow the calling code/AI SDK to decide
          // whether to handle gracefully or fail the parent span.
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
export function wrapTools<T extends Record<string, ToolLike>>(tools: T): T {
  if (!tools || typeof tools !== 'object') {
    console.error('Invalid tools object provided to wrapTools');
    return tools;
  }

  const wrappedTools = {} as T;

  for (const [toolName, tool] of typedEntries(tools)) {
    wrappedTools[toolName] = wrapTool(toolName as string, tool);
  }

  return wrappedTools;
}
