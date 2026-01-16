# AI Feedback Demo

A demonstration of Axiom's user feedback system for AI capabilities. This app shows how to:

## Setup

Create two datasets in Axiom:

- **Traces dataset** - For storing OpenTelemetry traces
- **Feedback dataset** - For storing user feedback events

Create two API tokens in Axiom:

- Traces API token with ingest permissions to the traces dataset
- Feedback API token with ingest-only permissions to the feedback dataset

> ⚠️ The feedback API token is exposed in the browser. It must have minimal scope: ingest-only permissions to the feedback dataset.

Create a `.env.local` file with the following environment variables:

```bash
# Server-side: Axiom traces configuration
AXIOM_URL="AXIOM_DOMAIN"
AXIOM_TOKEN="TRACES_API_TOKEN"
AXIOM_DATASET="TRACES_DATASET_NAME"

# Client-side: Axiom feedback configuration (exposed to browser)
NEXT_PUBLIC_AXIOM_URL="AXIOM_DOMAIN"
NEXT_PUBLIC_AXIOM_FEEDBACK_TOKEN="FEEDBACK_API_TOKEN"
NEXT_PUBLIC_AXIOM_FEEDBACK_DATASET="FEEDBACK_DATASET_NAME"

# OpenAI API key
OPENAI_API_KEY="OPENAI_API_KEY"
```

Install dependencies and run the app:

```bash
npm install
npm run dev
```
