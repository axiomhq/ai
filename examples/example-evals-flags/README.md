# Example: Evals - Writing Agent

A headless example demonstrating trace capture with Axiom's AI SDK for a marketplace listing writer.

## What This Shows

- **Trace capture** with `withSpan` and `wrapAISDKModel` 
- **Tool calling** with `wrapTools` for content moderation
- **Headless architecture** - runs via CLI, no web framework

## The Use Case

A writing agent for "Acme" marketplace that transforms raw seller descriptions into polished product listings. Includes a `checkProhibitedItems` tool to demonstrate tool tracing.

**Example:**
- **Input**: `"Used flip flops. Blue color. Size 9. Decent condition."`
- **Output**: `"Comfortable blue flip flops in size 9, perfect for casual summer wear..."`

## Quick Start

```bash
# Install dependencies (from repo root)
pnpm install

# Set environment variables
export AXIOM_URL="your-axiom-url"
export AXIOM_TOKEN="your-axiom-token"  
export AXIOM_DATASET="your-dataset"
export OPENAI_API_KEY="your-openai-key"

# Generate a single listing (with trace)
npm run generate
```

## Key Files

- `src/lib/service.ts` - Writing agent with tool calling
- `src/lib/tools/check-prohibited-items.ts` - Content moderation tool
- `src/lib/scripts/generate.ts` - CLI script for generations

