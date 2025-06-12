export type UNSTABLE_ModelPricingDetails = {
  INPUT_TOKEN_COST_PER_1K: number;
  OUTPUT_TOKEN_COST_PER_1K: number;
};

export class _SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_Pricing {
  private static ModelPrices: Record<string, UNSTABLE_ModelPricingDetails> = {
    /**
     * ANTHROPIC (BEDROCK)
     * 🚨 note that bedrock requires us/eu prefixes!
     */
    "eu.anthropic.claude-3-7-sonnet-20250219-v1:0": {
      INPUT_TOKEN_COST_PER_1K: 0.003, // $3 per million input tokens
      OUTPUT_TOKEN_COST_PER_1K: 0.015, // $15 per million output tokens
    },
    "us.anthropic.claude-3-7-sonnet-20250219-v1:0": {
      INPUT_TOKEN_COST_PER_1K: 0.003, // $3 per million input tokens
      OUTPUT_TOKEN_COST_PER_1K: 0.015, // $15 per million output tokens
    },

    /**
     * GEMINI
     */
    "gemini-2.0-flash": {
      INPUT_TOKEN_COST_PER_1K: 0.0001, // $0.10 per million input tokens
      OUTPUT_TOKEN_COST_PER_1K: 0.0004, // $0.40 per million output tokens
    },
    "gemini-2.5-flash-preview-04-17": {
      INPUT_TOKEN_COST_PER_1K: 0.00015, // $0.15 per million input tokens
      OUTPUT_TOKEN_COST_PER_1K: 0.0006, // $0.60 per million output tokens
    },
    "gemini-2.0-flash-lite-preview-02-05": {
      INPUT_TOKEN_COST_PER_1K: 0.000075, // $0.075
      OUTPUT_TOKEN_COST_PER_1K: 0.0003, // $0.30
    },
    "gemini-2.0-flash-exp": {
      INPUT_TOKEN_COST_PER_1K: 0.00007, // $0.07
      OUTPUT_TOKEN_COST_PER_1K: 0.0003, // $0.30
    },
  };

  static calculateCost(
    inputTokens: number,
    outputTokens: number,
    model: string
  ): number {
    const modelPricing =
      _SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_Pricing.ModelPrices[
        model
      ];

    if (!modelPricing) {
      if (process.env.NODE_ENV === "development") {
        throw new Error(`calculateCost - unknown model: ${model}`);
      }

      console.error("calculateCost - no pricing found for model", model);

      return 0;
    }

    const inputCost =
      (inputTokens / 1000) * modelPricing.INPUT_TOKEN_COST_PER_1K;
    const outputCost =
      (outputTokens / 1000) * modelPricing.OUTPUT_TOKEN_COST_PER_1K;

    return inputCost + outputCost;
  }
}
