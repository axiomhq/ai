import {
  ATTR_ERROR_TYPE,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
} from '@opentelemetry/semantic-conventions';

import {
  ATTR_EVAL_CASE_INDEX,
  ATTR_EVAL_CASE_EXPECTED,
  ATTR_EVAL_CASE_INPUT,
  ATTR_EVAL_CASE_OUTPUT,
  ATTR_EVAL_CASE_METADATA,
  ATTR_EVAL_CASE_SCORES,
  ATTR_EVAL_SCORE_PASSED,
  ATTR_EVAL_SCORE_VALUE,
  ATTR_EVAL_SCORE_NAME,
  ATTR_EVAL_SCORE_THRESHOLD,
  ATTR_EVAL_SCORE_METADATA,
  ATTR_EVAL_TASK_TYPE,
  ATTR_EVAL_TASK_NAME,
  ATTR_EVAL_TASK_OUTPUT,
  ATTR_EVAL_COLLECTION_NAME,
  ATTR_EVAL_COLLECTION_SIZE,
  ATTR_EVAL_ID,
  ATTR_EVAL_BASELINE_ID,
  ATTR_EVAL_BASELINE_NAME,
  ATTR_EVAL_NAME,
  ATTR_EVAL_TAGS,
  ATTR_EVAL_TYPE,
  ATTR_EVAL_COLLECTION_ID,
  ATTR_EVAL_USER_NAME,
  ATTR_EVAL_USER_EMAIL,
  ATTR_EVAL_VERSION,
  ATTR_EVAL_TRIAL_INDEX,
  ATTR_EVAL_RUN_ID,
  ATTR_EVAL_METADATA,
  ATTR_EVAL_CONFIG_FLAGS,
} from './eval_proposal';

import {
  ATTR_ERROR_MESSAGE,
  ATTR_GEN_AI_AGENT_DESCRIPTION,
  ATTR_GEN_AI_AGENT_ID,
  ATTR_GEN_AI_AGENT_NAME,
  ATTR_GEN_AI_CONVERSATION_ID,
  ATTR_GEN_AI_INPUT_MESSAGES,
  ATTR_GEN_AI_OPERATION_NAME,
  ATTR_GEN_AI_OUTPUT_MESSAGES,
  ATTR_GEN_AI_OUTPUT_TYPE,
  ATTR_GEN_AI_PROVIDER_NAME,
  ATTR_GEN_AI_REQUEST_CHOICE_COUNT,
  ATTR_GEN_AI_REQUEST_ENCODING_FORMATS,
  ATTR_GEN_AI_REQUEST_FREQUENCY_PENALTY,
  ATTR_GEN_AI_REQUEST_MAX_TOKENS,
  ATTR_GEN_AI_REQUEST_MODEL,
  ATTR_GEN_AI_REQUEST_PRESENCE_PENALTY,
  ATTR_GEN_AI_REQUEST_SEED,
  ATTR_GEN_AI_REQUEST_STOP_SEQUENCES,
  ATTR_GEN_AI_REQUEST_TEMPERATURE,
  ATTR_GEN_AI_REQUEST_TOP_K,
  ATTR_GEN_AI_REQUEST_TOP_P,
  ATTR_GEN_AI_RESPONSE_FINISH_REASONS,
  ATTR_GEN_AI_RESPONSE_ID,
  ATTR_GEN_AI_RESPONSE_MODEL,
  ATTR_GEN_AI_TOOL_CALL_ID,
  ATTR_GEN_AI_TOOL_DESCRIPTION,
  ATTR_GEN_AI_TOOL_NAME,
  ATTR_GEN_AI_TOOL_TYPE,
  ATTR_GEN_AI_USAGE_INPUT_TOKENS,
  ATTR_GEN_AI_USAGE_OUTPUT_TOKENS,
  GEN_AI_OPERATION_NAME_VALUE_CHAT,
  GEN_AI_OPERATION_NAME_VALUE_CREATE_AGENT,
  GEN_AI_OPERATION_NAME_VALUE_EMBEDDINGS,
  GEN_AI_OPERATION_NAME_VALUE_EXECUTE_TOOL,
  GEN_AI_OPERATION_NAME_VALUE_GENERATE_CONTENT,
  GEN_AI_OPERATION_NAME_VALUE_INVOKE_AGENT,
  GEN_AI_OUTPUT_TYPE_VALUE_IMAGE,
  GEN_AI_OUTPUT_TYPE_VALUE_JSON,
  GEN_AI_OUTPUT_TYPE_VALUE_SPEECH,
  GEN_AI_OUTPUT_TYPE_VALUE_TEXT,
  GEN_AI_PROVIDER_NAME_VALUE_ANTHROPIC,
  GEN_AI_PROVIDER_NAME_VALUE_AWS_BEDROCK,
  GEN_AI_PROVIDER_NAME_VALUE_AZURE_AI_INFERENCE,
  GEN_AI_PROVIDER_NAME_VALUE_AZURE_AI_OPENAI,
  GEN_AI_PROVIDER_NAME_VALUE_COHERE,
  GEN_AI_PROVIDER_NAME_VALUE_DEEPSEEK,
  GEN_AI_PROVIDER_NAME_VALUE_GCP_GEMINI,
  GEN_AI_PROVIDER_NAME_VALUE_GCP_GEN_AI,
  GEN_AI_PROVIDER_NAME_VALUE_GCP_VERTEX_AI,
  GEN_AI_PROVIDER_NAME_VALUE_GROQ,
  GEN_AI_PROVIDER_NAME_VALUE_IBM_WATSONX_AI,
  GEN_AI_PROVIDER_NAME_VALUE_MISTRAL_AI,
  GEN_AI_PROVIDER_NAME_VALUE_OPENAI,
  GEN_AI_PROVIDER_NAME_VALUE_PERPLEXITY,
  GEN_AI_PROVIDER_NAME_VALUE_X_AI,
} from '@opentelemetry/semantic-conventions/incubating';

export const SCHEMA_VERSION = '0.0.2';
export const SCHEMA_BASE_URL = 'https://axiom.co/ai/schemas/';

/**
 * PROPRIETARY ATTRIBUTES (o11y)
 *
 * @see: https://axiom.co/docs/ai-engineering/semantic-conventions
 */

const ATTR_AXIOM_GEN_AI_SCHEMA_URL = 'axiom.gen_ai.schema_url';
const ATTR_AXIOM_GEN_AI_SDK_NAME = 'axiom.gen_ai.sdk.name';
const ATTR_AXIOM_GEN_AI_SDK_VERSION = 'axiom.gen_ai.sdk.version';
const ATTR_GEN_AI_CAPABILITY_NAME = 'gen_ai.capability.name';
const ATTR_GEN_AI_STEP_NAME = 'gen_ai.step.name';
const ATTR_GEN_AI_TOOL_ARGUMENTS = 'gen_ai.tool.arguments'; // deprecated by OTel
const ATTR_GEN_AI_TOOL_MESSAGE = 'gen_ai.tool.message'; // deprecated by OTel

const GEN_AI_PROVIDER_NAME_VALUE_ASSEMBLYAI = 'assemblyai';
const GEN_AI_PROVIDER_NAME_VALUE_CEREBRAS = 'cerebras';
const GEN_AI_PROVIDER_NAME_VALUE_DEEPGRAM = 'deepgram';
const GEN_AI_PROVIDER_NAME_VALUE_DEEPINFRA = 'deepinfra';
const GEN_AI_PROVIDER_NAME_VALUE_ELEVENLABS = 'elevenlabs';
const GEN_AI_PROVIDER_NAME_VALUE_FAL = 'fal';
const GEN_AI_PROVIDER_NAME_VALUE_FIREWORKS = 'fireworks';
const GEN_AI_PROVIDER_NAME_VALUE_GLADIA = 'gladia';
const GEN_AI_PROVIDER_NAME_VALUE_HUME = 'hume';
const GEN_AI_PROVIDER_NAME_VALUE_LMNT = 'lmnt';
const GEN_AI_PROVIDER_NAME_VALUE_LUMA = 'luma';
const GEN_AI_PROVIDER_NAME_VALUE_REPLICATE = 'replicate';
const GEN_AI_PROVIDER_NAME_VALUE_REVAI = 'revai';
const GEN_AI_PROVIDER_NAME_VALUE_TOGETHERAI = 'togetherai';
const GEN_AI_PROVIDER_NAME_VALUE_VERCEL = 'vercel';

/**
 * When adding something new here, please:
 * 1. Make sure it doesn't already exist as part of OTel Semantic Conventions (use that instead)
 * 2. Make sure to use standard naming schema, ie snake_case
 * 3. If a specific feature has an attribute you would like to use, extract it to the shared section
 *
 * Also Experimental Attributes should always be imported here and then used from the CustomAttributes object
 * because they are unstable.
 *
 * @see: https://github.com/open-telemetry/opentelemetry-js/tree/c89cb38d0fec39d54cf3fcb35c429a8129e9c909/semantic-conventions#unstable-semconv
 */
export const Attr = {
  __EXPERIMENTAL_Flag: (flagName: string) => `flag.${flagName}`,
  __EXPERIMENTAL_Fact: (factName: string) => `fact.${factName}`,
  Axiom: {
    GenAI: {
      SchemaURL: ATTR_AXIOM_GEN_AI_SCHEMA_URL,
      SDK: {
        Name: ATTR_AXIOM_GEN_AI_SDK_NAME,
        Version: ATTR_AXIOM_GEN_AI_SDK_VERSION,
      },
    },
  },
  GenAI: {
    PromptMetadata: {
      ID: 'axiom.gen_ai.prompt.id',
      Name: 'axiom.gen_ai.prompt.name',
      Slug: 'axiom.gen_ai.prompt.slug',
      Version: 'axiom.gen_ai.prompt.version',
    },
    /**
     * These two are used to identify the span
     */
    Capability: {
      Name: ATTR_GEN_AI_CAPABILITY_NAME,
    },
    Step: {
      Name: ATTR_GEN_AI_STEP_NAME,
    },
    Provider: {
      Name: ATTR_GEN_AI_PROVIDER_NAME,
      Name_Values: {
        Anthropic: GEN_AI_PROVIDER_NAME_VALUE_ANTHROPIC,
        AssemblyAI: GEN_AI_PROVIDER_NAME_VALUE_ASSEMBLYAI,
        AWSBedrock: GEN_AI_PROVIDER_NAME_VALUE_AWS_BEDROCK,
        AzureAIInference: GEN_AI_PROVIDER_NAME_VALUE_AZURE_AI_INFERENCE,
        AzureAIOpenAI: GEN_AI_PROVIDER_NAME_VALUE_AZURE_AI_OPENAI,
        Cerebras: GEN_AI_PROVIDER_NAME_VALUE_CEREBRAS,
        Cohere: GEN_AI_PROVIDER_NAME_VALUE_COHERE,
        Deepgram: GEN_AI_PROVIDER_NAME_VALUE_DEEPGRAM,
        DeepInfra: GEN_AI_PROVIDER_NAME_VALUE_DEEPINFRA,
        Deepseek: GEN_AI_PROVIDER_NAME_VALUE_DEEPSEEK,
        ElevenLabs: GEN_AI_PROVIDER_NAME_VALUE_ELEVENLABS,
        Fal: GEN_AI_PROVIDER_NAME_VALUE_FAL,
        Fireworks: GEN_AI_PROVIDER_NAME_VALUE_FIREWORKS,
        GCPGemini: GEN_AI_PROVIDER_NAME_VALUE_GCP_GEMINI,
        GCPGenAI: GEN_AI_PROVIDER_NAME_VALUE_GCP_GEN_AI,
        GCPVertexAI: GEN_AI_PROVIDER_NAME_VALUE_GCP_VERTEX_AI,
        Gladia: GEN_AI_PROVIDER_NAME_VALUE_GLADIA,
        Groq: GEN_AI_PROVIDER_NAME_VALUE_GROQ,
        Hume: GEN_AI_PROVIDER_NAME_VALUE_HUME,
        IBMWatsonxAI: GEN_AI_PROVIDER_NAME_VALUE_IBM_WATSONX_AI,
        Lmnt: GEN_AI_PROVIDER_NAME_VALUE_LMNT,
        Luma: GEN_AI_PROVIDER_NAME_VALUE_LUMA,
        MistralAI: GEN_AI_PROVIDER_NAME_VALUE_MISTRAL_AI,
        OpenAI: GEN_AI_PROVIDER_NAME_VALUE_OPENAI,
        Perplexity: GEN_AI_PROVIDER_NAME_VALUE_PERPLEXITY,
        Replicate: GEN_AI_PROVIDER_NAME_VALUE_REPLICATE,
        RevAI: GEN_AI_PROVIDER_NAME_VALUE_REVAI,
        TogetherAI: GEN_AI_PROVIDER_NAME_VALUE_TOGETHERAI,
        Vercel: GEN_AI_PROVIDER_NAME_VALUE_VERCEL,
        XAI: GEN_AI_PROVIDER_NAME_VALUE_X_AI,
      },
    },
    /**
     * Regular attributes
     */
    Agent: {
      Description: ATTR_GEN_AI_AGENT_DESCRIPTION, // not yet used by axiom-ai
      ID: ATTR_GEN_AI_AGENT_ID, // not yet used by axiom-ai
      Name: ATTR_GEN_AI_AGENT_NAME, // not yet used by axiom-ai
    },
    Conversation: {
      ID: ATTR_GEN_AI_CONVERSATION_ID, // not yet used by axiom-ai, anyway probably needs to be provided by user
    },
    Input: {
      Messages: ATTR_GEN_AI_INPUT_MESSAGES,
    },
    Operation: {
      Name: ATTR_GEN_AI_OPERATION_NAME,
      Name_Values: {
        /**
         * Note that "text_completion" is deprecated in favor of "chat" for both OpenAI and Anthropic
         */
        Chat: GEN_AI_OPERATION_NAME_VALUE_CHAT,
        CreateAgent: GEN_AI_OPERATION_NAME_VALUE_CREATE_AGENT,
        Embeddings: GEN_AI_OPERATION_NAME_VALUE_EMBEDDINGS,
        ExecuteTool: GEN_AI_OPERATION_NAME_VALUE_EXECUTE_TOOL,
        GenerateContent: GEN_AI_OPERATION_NAME_VALUE_GENERATE_CONTENT,
        InvokeAgent: GEN_AI_OPERATION_NAME_VALUE_INVOKE_AGENT,
      },
    },
    Output: {
      Messages: ATTR_GEN_AI_OUTPUT_MESSAGES,
      Type: ATTR_GEN_AI_OUTPUT_TYPE,
      Type_Values: {
        Text: GEN_AI_OUTPUT_TYPE_VALUE_TEXT,
        Json: GEN_AI_OUTPUT_TYPE_VALUE_JSON,
        Image: GEN_AI_OUTPUT_TYPE_VALUE_IMAGE,
        Speech: GEN_AI_OUTPUT_TYPE_VALUE_SPEECH,
      },
    },
    /**
     * The provider that is hosting the model, eg AWS Bedrock
     * There doesn't seem to be a semconv for this
     */
    Request: {
      ChoiceCount: ATTR_GEN_AI_REQUEST_CHOICE_COUNT, // not yet used by axiom-ai
      EncodingFormats: ATTR_GEN_AI_REQUEST_ENCODING_FORMATS, // not yet used by axiom-ai
      FrequencyPenalty: ATTR_GEN_AI_REQUEST_FREQUENCY_PENALTY,
      MaxTokens: ATTR_GEN_AI_REQUEST_MAX_TOKENS,
      /**
       * The model you asked for
       */
      Model: ATTR_GEN_AI_REQUEST_MODEL,
      PresencePenalty: ATTR_GEN_AI_REQUEST_PRESENCE_PENALTY,
      Seed: ATTR_GEN_AI_REQUEST_SEED,
      StopSequences: ATTR_GEN_AI_REQUEST_STOP_SEQUENCES,
      Temperature: ATTR_GEN_AI_REQUEST_TEMPERATURE,
      TopK: ATTR_GEN_AI_REQUEST_TOP_K,
      TopP: ATTR_GEN_AI_REQUEST_TOP_P,
    },
    Response: {
      FinishReasons: ATTR_GEN_AI_RESPONSE_FINISH_REASONS,
      ID: ATTR_GEN_AI_RESPONSE_ID,
      /**
       * The model that was actually used (might be different bc routing) - only ever get this from the response, otherwise omit
       */
      Model: ATTR_GEN_AI_RESPONSE_MODEL, // somehow not landing on the span for google models? check up on this...
    },
    Tool: {
      CallID: ATTR_GEN_AI_TOOL_CALL_ID,
      Description: ATTR_GEN_AI_TOOL_DESCRIPTION,
      Name: ATTR_GEN_AI_TOOL_NAME,
      Type: ATTR_GEN_AI_TOOL_TYPE,
      /**
       * Note, OTel Semantic Convention suggest only putting tool inputs/outputs on the parent chat span
       * But we at least want to give users THE OPTION to put them on the tool spans themselves as well
       * Because it enables a lot of things with querying
       * @see https://github.com/open-telemetry/semantic-conventions/releases/tag/v1.37.0
       */
      Arguments: ATTR_GEN_AI_TOOL_ARGUMENTS,
      /**
       * Note, OTel Semantic Convention suggest only putting tool inputs/outputs on the parent chat span
       * But we at least want to give users THE OPTION to put them on the tool spans themselves as well
       * Because it enables a lot of things with querying
       * @see https://github.com/open-telemetry/semantic-conventions/releases/tag/v1.37.0
       */
      Message: ATTR_GEN_AI_TOOL_MESSAGE,
    },
    Usage: {
      InputTokens: ATTR_GEN_AI_USAGE_INPUT_TOKENS,
      OutputTokens: ATTR_GEN_AI_USAGE_OUTPUT_TOKENS,
    },
  },
  Eval: {
    ID: ATTR_EVAL_ID,
    Name: ATTR_EVAL_NAME,
    Version: ATTR_EVAL_VERSION,
    Type: ATTR_EVAL_TYPE,
    Baseline: {
      ID: ATTR_EVAL_BASELINE_ID,
      Name: ATTR_EVAL_BASELINE_NAME,
    },
    Tags: ATTR_EVAL_TAGS,
    Metadata: ATTR_EVAL_METADATA,
    Collection: {
      ID: ATTR_EVAL_COLLECTION_ID,
      Name: ATTR_EVAL_COLLECTION_NAME,
      Size: ATTR_EVAL_COLLECTION_SIZE,
    },
    Config: {
      Flags: ATTR_EVAL_CONFIG_FLAGS,
    },
    Run: {
      ID: ATTR_EVAL_RUN_ID,
    },
    Case: {
      Index: ATTR_EVAL_CASE_INDEX,
      Input: ATTR_EVAL_CASE_INPUT,
      Output: ATTR_EVAL_CASE_OUTPUT,
      Expected: ATTR_EVAL_CASE_EXPECTED,
      Scores: ATTR_EVAL_CASE_SCORES,
      Metadata: ATTR_EVAL_CASE_METADATA,
    },
    Trial: {
      Index: ATTR_EVAL_TRIAL_INDEX,
    },
    Task: {
      Output: ATTR_EVAL_TASK_OUTPUT,
      Name: ATTR_EVAL_TASK_NAME,
      Type: ATTR_EVAL_TASK_TYPE,
    },
    Score: {
      Name: ATTR_EVAL_SCORE_NAME,
      Value: ATTR_EVAL_SCORE_VALUE,
      Threshold: ATTR_EVAL_SCORE_THRESHOLD,
      Passed: ATTR_EVAL_SCORE_PASSED,
      Metadata: ATTR_EVAL_SCORE_METADATA,
    },
    User: {
      Name: ATTR_EVAL_USER_NAME,
      Email: ATTR_EVAL_USER_EMAIL,
    },
  },
  Error: {
    Type: ATTR_ERROR_TYPE,
    Message: ATTR_ERROR_MESSAGE,
  },
  HTTP: {
    Response: {
      StatusCode: ATTR_HTTP_RESPONSE_STATUS_CODE,
    },
  },
} as const;
