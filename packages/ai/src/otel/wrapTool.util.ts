import { type Tool as ToolV4 } from 'aiv4';
import { type Tool as ToolV5 } from 'aiv5';

export type Tool = ToolV4 | ToolV5;

/**
 * Type representing a wrapped tool with preserved TypeScript signatures
 */
export type WrappedTool<T extends Tool> = T;
