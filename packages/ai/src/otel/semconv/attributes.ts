import {
  ATTR_EVAL_CASE_ID,
  ATTR_EVAL_CASE_INDEX,
  ATTR_EVAL_CASE_EXPECTED,
  ATTR_EVAL_CASE_INPUT,
  ATTR_EVAL_CASE_METADATA,
  ATTR_EVAL_DATASET_SIZE,
  ATTR_EVAL_RUN_ID,
  ATTR_EVAL_EXPERIMENT_NAME,
  ATTR_EVAL_SCORE_PASSED,
  ATTR_EVAL_SCORE_VALUE,
  ATTR_EVAL_SCORE_NAME,
  ATTR_EVAL_SCORE_THRESHOLD,
  ATTR_EVAL_EXPERIMENT_TYPE,
  ATTR_EVAL_DATASET_SPLIT,
  ATTR_EVAL_DATASET_NAME,
  ATTR_EVAL_TASK_OUTPUT,
  ATTR_EVAL_EXPERIMENT_TAGS,
  ATTR_EVAL_SCORE_METADATA,
  ATTR_EVAL_SCORE_SCORER,
  ATTR_EVAL_EXPERIMENT_BASE_ID,
  ATTR_EVAL_EXPERIMENT_BASE_NAME,
  ATTR_EVAL_EXPERIMENT_GROUP,
  ATTR_EVAL_EXPERIMENT_ID,
  ATTR_EVAL_EXPERIMENT_TRIALS,
  ATTR_EVAL_EXPERIMENT_VERSION,
  ATTR_EVAL_TASK_TRIAL,
  ATTR_EVAL_TASK_TYPE,
  ATTR_EVAL_TASK_NAME,
  ATTR_EVAL_CASE_OUTPUT,
} from './eval_proposal';

import {
  ATTR_GEN_AI_USAGE_INPUT_TOKENS,
  ATTR_GEN_AI_USAGE_OUTPUT_TOKENS,
  ATTR_GEN_AI_REQUEST_MODEL,
  ATTR_GEN_AI_RESPONSE_MODEL,
  ATTR_GEN_AI_OPERATION_NAME,
  GEN_AI_SYSTEM_VALUE_ANTHROPIC,
  GEN_AI_OPERATION_NAME_VALUE_CHAT,
  ATTR_GEN_AI_REQUEST_MAX_TOKENS,
  ATTR_GEN_AI_OUTPUT_TYPE,
  GEN_AI_OUTPUT_TYPE_VALUE_JSON,
  GEN_AI_OUTPUT_TYPE_VALUE_SPEECH,
  GEN_AI_OUTPUT_TYPE_VALUE_TEXT,
  GEN_AI_OUTPUT_TYPE_VALUE_IMAGE,
  ATTR_GEN_AI_SYSTEM,
  GEN_AI_SYSTEM_VALUE_OPENAI,
  GEN_AI_SYSTEM_VALUE_GEMINI,
  ATTR_GEN_AI_RESPONSE_ID,
  ATTR_GEN_AI_REQUEST_FREQUENCY_PENALTY,
  ATTR_GEN_AI_REQUEST_PRESENCE_PENALTY,
  ATTR_GEN_AI_REQUEST_TEMPERATURE,
  ATTR_GEN_AI_REQUEST_TOP_P,
  ATTR_GEN_AI_REQUEST_TOP_K,
  ATTR_GEN_AI_REQUEST_SEED,
  ATTR_GEN_AI_REQUEST_STOP_SEQUENCES,
  GEN_AI_OPERATION_NAME_VALUE_EXECUTE_TOOL,
  ATTR_GEN_AI_COMPLETION,
  ATTR_GEN_AI_PROMPT,
  ATTR_GEN_AI_TOOL_CALL_ID,
  ATTR_GEN_AI_TOOL_NAME,
  ATTR_GEN_AI_TOOL_TYPE,
  ATTR_GEN_AI_REQUEST_CHOICE_COUNT,
  ATTR_GEN_AI_RESPONSE_FINISH_REASONS,
  ATTR_GEN_AI_CONVERSATION_ID,
  ATTR_GEN_AI_TOOL_DESCRIPTION,
  ATTR_GEN_AI_DATA_SOURCE_ID,
  GEN_AI_OPERATION_NAME_VALUE_CREATE_AGENT,
  GEN_AI_OPERATION_NAME_VALUE_INVOKE_AGENT,
  GEN_AI_OPERATION_NAME_VALUE_EMBEDDINGS,
  GEN_AI_OPERATION_NAME_VALUE_GENERATE_CONTENT,
  ATTR_GEN_AI_AGENT_DESCRIPTION,
  ATTR_GEN_AI_AGENT_ID,
  ATTR_GEN_AI_AGENT_NAME,
  ATTR_GEN_AI_REQUEST_ENCODING_FORMATS,
} from './semconv_incubating';

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
  Axiom: {
    GenAI: {
      SchemaURL: 'axiom.gen_ai.schema_url',
      SDK: {
        Name: 'axiom.gen_ai.sdk.name',
        Version: 'axiom.gen_ai.sdk.version',
      },
    },
  },
  GenAI: {
    /**
     * These two are used to identify the span
     */
    Capability: {
      Name: 'gen_ai.capability.name', // proprietary to axiom
    },
    Step: {
      Name: 'gen_ai.step.name', // proprietary to axiom
    },
    /**
     * Regular attributes
     */
    Agent: {
      Description: ATTR_GEN_AI_AGENT_DESCRIPTION, // not yet used by axiom-ai
      ID: ATTR_GEN_AI_AGENT_ID, // not yet used by axiom-ai
      Name: ATTR_GEN_AI_AGENT_NAME, // not yet used by axiom-ai
    },
    Completion: ATTR_GEN_AI_COMPLETION, // OTel suggests to use events API for this now
    Conversation: {
      ID: ATTR_GEN_AI_CONVERSATION_ID, // not yet used by axiom-ai, anyway probably needs to be provided by user
    },
    DataSource: {
      ID: ATTR_GEN_AI_DATA_SOURCE_ID, // not used in axiom-ai yet
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
    Provider: 'gen_ai.provider.name', // proprietary to axiom-ai, not yet used by axiom-ai
    Prompt: ATTR_GEN_AI_PROMPT, // OTel suggests to use the events api for this
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
      Tools: 'gen_ai.request.tools',
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
    /**
     * From OTel docs:
     * ```
     * Multiple systems, including Azure OpenAI and Gemini, are accessible
     * by OpenAI client libraries. In such cases, the gen_ai.system is set
     * to openai based on the instrumentation's best knowledge, instead of
     * the actual system.
     * ```
     */
    System: ATTR_GEN_AI_SYSTEM, // not yet used by axiom-ai
    System_Values: {
      Anthropic: GEN_AI_SYSTEM_VALUE_ANTHROPIC,
      Gemini: GEN_AI_SYSTEM_VALUE_GEMINI,
      OpenAI: GEN_AI_SYSTEM_VALUE_OPENAI,
      Vercel: 'vercel',
    },
    Tool: {
      CallID: ATTR_GEN_AI_TOOL_CALL_ID, // not yet used by axiom-ai
      Description: ATTR_GEN_AI_TOOL_DESCRIPTION, // not yet used by axiom-ai
      Name: ATTR_GEN_AI_TOOL_NAME, // not yet used by axiom-ai
      Type: ATTR_GEN_AI_TOOL_TYPE, // not yet used by axiom-ai
      /**
       * Note, OTel Semantic Convention puts these on `gen_ai.choice` events
       * @see https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-events/#event-gen_aichoice
       */
      Arguments: 'gen_ai.tool.arguments', // not yet used by axiom-ai
      /**
       * Note, OTel Semantic Convention puts these on `gen_ai.tool.message` events
       */
      Message: 'gen_ai.tool.message', // not yet used by axiom-ai
    },
    Usage: {
      InputTokens: ATTR_GEN_AI_USAGE_INPUT_TOKENS,
      OutputTokens: ATTR_GEN_AI_USAGE_OUTPUT_TOKENS,
    },
  },
  Eval: {
    Run: {
      ID: ATTR_EVAL_RUN_ID,
    },
    Experiment: {
      ID: ATTR_EVAL_EXPERIMENT_ID,
      Name: ATTR_EVAL_EXPERIMENT_NAME,
      Type: ATTR_EVAL_EXPERIMENT_TYPE,
      Version: ATTR_EVAL_EXPERIMENT_VERSION,
      Group: ATTR_EVAL_EXPERIMENT_GROUP,
      BaseID: ATTR_EVAL_EXPERIMENT_BASE_ID,
      BaseName: ATTR_EVAL_EXPERIMENT_BASE_NAME,
      Trials: ATTR_EVAL_EXPERIMENT_TRIALS,
      Tags: ATTR_EVAL_EXPERIMENT_TAGS,
    },
    Dataset: {
      Name: ATTR_EVAL_DATASET_NAME,
      Split: ATTR_EVAL_DATASET_SPLIT,
      Size: ATTR_EVAL_DATASET_SIZE,
    },
    Case: {
      ID: ATTR_EVAL_CASE_ID,
      Index: ATTR_EVAL_CASE_INDEX,
      Input: ATTR_EVAL_CASE_INPUT,
      Output: ATTR_EVAL_CASE_OUTPUT,
      Expected: ATTR_EVAL_CASE_EXPECTED,
      Metadata: ATTR_EVAL_CASE_METADATA,
    },
    Task: {
      Output: ATTR_EVAL_TASK_OUTPUT,
      Name: ATTR_EVAL_TASK_NAME,
      Type: ATTR_EVAL_TASK_TYPE,
      Trial: ATTR_EVAL_TASK_TRIAL,
    },
    Score: {
      Name: ATTR_EVAL_SCORE_NAME,
      Value: ATTR_EVAL_SCORE_VALUE,
      Threshold: ATTR_EVAL_SCORE_THRESHOLD,
      Passed: ATTR_EVAL_SCORE_PASSED,
      Scorer: ATTR_EVAL_SCORE_SCORER,
      Metadata: ATTR_EVAL_SCORE_METADATA,
    },
  },
} as const;
