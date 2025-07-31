import { build } from 'esbuild';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import { basename } from 'node:path';
import type { Prompt } from './types';

export async function loadPromptModule(filePath: string) {
  const result = await build({
    entryPoints: [filePath],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    target: ['node18'],
    sourcemap: false,
    external: [
      // Only Node.js built-ins should be external
      'fs',
      'fs/promises',
      'node:fs',
      'node:fs/promises',
      'readline',
      'node:readline',
      'path',
      'node:path',
      'os',
      'node:os',
      'url',
      'node:url',
      'util',
      'node:util',
      'crypto',
      'node:crypto',
      'events',
      'node:events',
      'stream',
      'node:stream',
      'buffer',
      'node:buffer',
      'process',
      'node:process',
    ],
  });

  const code = result.outputFiles[0].text;

  // Create a unique temporary file
  const tempDir = os.tmpdir();
  const tempFileName = `axiom-ai-prompt-${Date.now()}-${Math.random().toString(36).substring(2)}.mjs`;
  const tempFilePath = path.join(tempDir, tempFileName);

  try {
    // Write the bundled code to temporary file
    await fs.writeFile(tempFilePath, code, 'utf-8');

    // Dynamically import the temporary module
    const moduleUrl = `file://${tempFilePath}`;
    const module = await import(moduleUrl);

    return module.default || module;
  } finally {
    // Clean up the temporary file
    try {
      await fs.unlink(tempFilePath);
    } catch (error) {
      // Ignore cleanup errors - temp files will be cleaned up by OS eventually
      console.warn(`Failed to clean up temporary file ${tempFilePath}:`, error);
    }
  }
}

/**
 * Convert TypeBox arguments to JSON Schema format expected by the API
 */
function convertTypeBoxArgumentsToJsonSchema(arguments_: Record<string, any>): any {
  if (!arguments_ || typeof arguments_ !== 'object') {
    return {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    };
  }

  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(arguments_)) {
    if (value && typeof value === 'object' && value.type) {
      // This is a TypeBox schema object that has been serialized
      properties[key] = {
        type: value.type,
        ...(value.description && { description: value.description }),
        ...(value.enum && { enum: value.enum }),
        ...(value.items && { items: value.items }),
        ...(value.properties && { properties: value.properties }),
        ...(value.required && { required: value.required }),
      };

      // For now, treat all arguments as required (this matches the existing behavior)
      // In the future, we could detect Type.Optional() usage
      required.push(key);
    }
  }

  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
}

export function extractPromptFromModule(moduleContent: any, filePath: string): Prompt {
  // Generate ID from file path if not provided
  const fileBaseName = basename(filePath, '.ts'); // Remove .ts extension
  const defaultId = fileBaseName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Convert TypeBox arguments to JSON Schema format
  const convertedArguments = convertTypeBoxArgumentsToJsonSchema(moduleContent.arguments);

  // Extract and validate required fields from the module content
  const prompt: Prompt = {
    name: moduleContent.name || 'Untitled Prompt',
    slug: moduleContent.slug || defaultId,
    messages: moduleContent.messages || [],
    model: moduleContent.model,
    options: moduleContent.options,
    arguments: convertedArguments,
    id: moduleContent.id || defaultId,
    version: moduleContent.version || '1.0.0',
    // Optional fields from API response
    ...(moduleContent.promptId && { promptId: moduleContent.promptId }),
    ...(moduleContent.description && { description: moduleContent.description }),
  };

  // Validate required fields
  if (!prompt.name) {
    throw new Error('Prompt must have a name');
  }
  if (!prompt.slug) {
    throw new Error('Prompt must have a slug');
  }
  if (!Array.isArray(prompt.messages)) {
    throw new Error('Prompt messages must be an array');
  }

  if (!prompt.model) {
    throw new Error('Prompt must have a model');
  }

  return prompt;
}

/**
 * Transform JSON Schema to TypeBox/Template validator format
 */
export function transformJsonSchemaToTypeBox(schema: any): string {
  if (schema.type === 'string') {
    if (schema.enum && Array.isArray(schema.enum)) {
      // Handle enum as Union of Literals
      const literals = schema.enum.map((value: string) => `Type.Literal('${value}')`).join(', ');
      const options = schema.description ? `, { description: '${schema.description}' }` : '';
      return `Type.Union([${literals}]${options})`;
    } else {
      // Regular string
      const options = schema.description ? `{ description: '${schema.description}' }` : '';
      return `Type.String(${options})`;
    }
  }

  if (schema.type === 'number' || schema.type === 'integer') {
    const typeMethod = schema.type === 'integer' ? 'Integer' : 'Number';
    const options = schema.description ? `{ description: '${schema.description}' }` : '';
    return `Type.${typeMethod}(${options})`;
  }

  if (schema.type === 'boolean') {
    const options = schema.description ? `{ description: '${schema.description}' }` : '';
    return `Type.Boolean(${options})`;
  }

  if (schema.type === 'array') {
    const itemsType = schema.items ? transformJsonSchemaToTypeBox(schema.items) : 'Type.String()';
    const options = schema.description ? `, { description: '${schema.description}' }` : '';
    return `Type.Array(${itemsType}${options})`;
  }

  if (schema.type === 'object') {
    if (schema.properties) {
      const props = Object.entries(schema.properties)
        .map(([key, value]: [string, any]) => {
          const isRequired = schema.required && schema.required.includes(key);
          const propType = transformJsonSchemaToTypeBox(value);
          return `    ${key}: ${isRequired ? propType : `Type.Optional(${propType})`}`;
        })
        .join(',\n');

      const options = schema.description ? `, { description: '${schema.description}' }` : '';
      return `Type.Object({\n${props}\n  }${options})`;
    } else {
      const options = schema.description ? `{ description: '${schema.description}' }` : '';
      return `Type.Object({}${options ? `, ${options}` : ''})`;
    }
  }

  // Fallback for unknown types
  return 'Type.String()';
}

/**
 * Generate TypeScript prompt file content from API response
 */
export function generatePromptFileFromApiResponse(apiResponse: any): string {
  const { prompt, version } = apiResponse;
  const { data, options } = version;

  // Transform arguments from JSON Schema to TypeBox format
  let argumentsCode = '{}';
  if (data.arguments && data.arguments.properties) {
    const argEntries = Object.entries(data.arguments.properties)
      .map(([key, schema]: [string, any]) => {
        const isRequired = data.arguments.required && data.arguments.required.includes(key);
        const typeCode = transformJsonSchemaToTypeBox(schema);
        return `    ${key}: ${isRequired ? typeCode : `Type.Optional(${typeCode})`}`;
      })
      .join(',\n');

    if (argEntries) {
      argumentsCode = `{\n${argEntries}\n  }`;
    }
  }

  // Generate the TypeScript file content
  return `import { Type } from '@axiomhq/ai';

export default {
  name: '${prompt.name}',
  slug: '${prompt.slug}',
  description: '${prompt.description || ''}',
  messages: [${data.messages
    .map(
      (msg: any) => `
    {
      role: '${msg.role}',
      content: '${msg.content.replace(/'/g, "\\'")}',
    }`,
    )
    .join(',')}
  ],
  model: '${data.model || 'gpt-4'}',
  options: {
${
  options
    ? Object.entries(options)
        .map(([key, value]) => `    ${key}: ${value}`)
        .join(',\n')
    : ''
}
  },
  arguments: ${argumentsCode},
  version: '${version.version}',
  promptId: '${prompt.promptId}',
};
`;
}
