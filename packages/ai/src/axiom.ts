import HTTPClient from "./httpClient";

import type {
  Environment,
  LibraryInput,
  Prompt,
  PromptInput,
} from "./types";
import { parse } from "./prompt";

export type ClientOptions = {
  onError?: (error: Error) => void;
  parser?: "nunjucks" | "handlebars";
};

export class Axiom extends HTTPClient {
  constructor(
    apiKey: string,
    private opts: ClientOptions = {}
  ) {
    super({ apiKey });

    // default options
    if (!this.opts.onError) {
      this.opts.onError = (error) => {
        console.error(error);
      };
    }
  }

  static prompts = {
    /*
     * Parses a prompt with the given inputs.
     * This is useful for previewing the prompt before running it.
     *
     * @param prompt - The prompt to parse.
     * @param options - An object containing the context for parsing and the parser to use.
     * @returns The parsed prompt.
     */
    parse,
  };

  prompts = {
    /*
     * Parses a prompt with the given inputs.
     * This is useful for previewing the prompt before running it.
     *
     * @param prompt - The prompt to parse.
     * @param options - An object containing the context for parsing and the parser to use.
     * @returns The parsed prompt.
     */
    parse,

    /*
     * Creates a new prompt.
     *
     * @param input - The input to create the prompt with.
     * @returns The created prompt.
     */
    create: async (input: PromptInput): Promise<Prompt> => {
      return await this.client.post<Prompt>(`/prompts`, {
        body: JSON.stringify(input),
      });
    },

    /*
     * Loads a prompt from Axiom.
     *
     * @param slug - The slug of the prompt to load.
     * @returns The prompt.
     */
    load: async (slug: string): Promise<Prompt> => {
      // TODO: should check if prompt is already loaded in a cache layer
      return await this.client.get<Prompt>(`/prompts/${slug}`);
    },

    deploy: async (
      promptId: string,
      { environment, version }: { environment: Environment; version: string }
    ) => {
      return await this.client.put<Prompt>(`/prompts/${promptId}/deploy`, {
        body: JSON.stringify({ promptId, environment, version }),
      });
    },
  };

  library = {
    create: async (input: LibraryInput): Promise<Prompt> => {
      return await this.client.post<Prompt>(`/library`, {
        body: JSON.stringify(input),
      });
    },
  };

  /*
   * Wraps a function in a span and attaches the scope to the span then calls the model function.
   *
   * @param scope - The scope to attach to the span.
   * @param fn - The function to wrap.
   * @returns The result of the function.
   */
  async withAxiom(
    _TODO_USE_THIS_scope: { workflow: string; task: string },
    fn: () => Promise<any>
  ) {
    // TODO: create a span and attach scope
    // TODO: add a trace to the span
    return await fn();
  }

  /*
   * Runs a prompt on Axiom with the given inputs.
   *
   * @param prompt - The prompt to run.
   * @param inputs - The inputs to pass to the prompt.
   * @returns The result of the prompt.
   */

  async run(prompt: Prompt, inputs: Record<string, any>) {
    let parsedPrompt: Prompt;
    parsedPrompt = await parse(prompt, {
      context: inputs,
      parser: "nunjucks",
    });
    console.log(parsedPrompt);
    throw new Error("Not implemented");
  }

    // eval method moved to separate @axiomhq/ai/evals entry point
}
