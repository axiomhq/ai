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
} from "./semconv_incubating";

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
  /**
   * Shared between all features
   */
  Dataset: {
    Name: "dataset.name",
    Description: "dataset.description",
  },
  Dashboard: {
    Name: "dashboard.name",
    Description: "dashboard.description",
  },
  Query: {
    APL: "query.apl",
  },
  OrgId: "org_id",
  UserId: "user_id",
  HasAccessToken: "has_access_token",
  GenAI: {
    Operation: {
      Name: ATTR_GEN_AI_OPERATION_NAME,
      Name_Values: {
        /**
         * Note that "text_completion" is deprecated in favor of "chat" for both OpenAI and Anthropic
         */
        ExecuteTool: GEN_AI_OPERATION_NAME_VALUE_EXECUTE_TOOL,
        Chat: GEN_AI_OPERATION_NAME_VALUE_CHAT,
      },
      // TODO: bikeshed `WorkflowName` and `TaskName`
      WorkflowName: "gen_ai.operation.workflow_name",
      TaskName: "gen_ai.operation.task_name",
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
    Provider: "gen_ai.provider",
    Prompt: {
      System: "gen_ai.prompt.system",
      Role: "gen_ai.prompt.role",
      Role_Values: {
        // there might be others?
        Assistant: "assistant",
        System: "system",
        User: "user",
      },
      Text: "gen_ai.prompt.text",
      PreviousMessages: "gen_ai.prompt.previous_messages",
    },
    Usage: {
      InputTokens: ATTR_GEN_AI_USAGE_INPUT_TOKENS,
      OutputTokens: ATTR_GEN_AI_USAGE_OUTPUT_TOKENS,
    },
    Cost: {
      // TODO: bikeshed this
      Estimated: "gen_ai.cost.estimated",
    },
    Request: {
      FrequencyPenalty: ATTR_GEN_AI_REQUEST_FREQUENCY_PENALTY,
      /**
       * The model you asked for
       */
      Model: ATTR_GEN_AI_REQUEST_MODEL,
      MaxTokens: ATTR_GEN_AI_REQUEST_MAX_TOKENS,
      PresencePenalty: ATTR_GEN_AI_REQUEST_PRESENCE_PENALTY,
      Temperature: ATTR_GEN_AI_REQUEST_TEMPERATURE,
      TopP: ATTR_GEN_AI_REQUEST_TOP_P,
      TopK: ATTR_GEN_AI_REQUEST_TOP_K,
      Seed: ATTR_GEN_AI_REQUEST_SEED,
      StopSequences: ATTR_GEN_AI_REQUEST_STOP_SEQUENCES,
    },
    Completion: ATTR_GEN_AI_COMPLETION,
    Response: {
      ID: ATTR_GEN_AI_RESPONSE_ID,
      /**
       * The model that was actually used (might be different bc routing) - only ever get this from the response, otherwise omit
       */
      Model: ATTR_GEN_AI_RESPONSE_MODEL,
      ProviderMetadata: "gen_ai.response.provider_metadata",
      Text: "gen_ai.response.text",
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
    System: ATTR_GEN_AI_SYSTEM,
    System_Values: {
      Anthropic: GEN_AI_SYSTEM_VALUE_ANTHROPIC,
      Gemini: GEN_AI_SYSTEM_VALUE_GEMINI,
      OpenAI: GEN_AI_SYSTEM_VALUE_OPENAI,
      Vercel: "vercel",
    },
    Tool: {},
  },
} as const;
