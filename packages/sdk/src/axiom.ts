import HTTPClient from "./httpClient";
import { Eval } from "./eval";
import type {
  Environment,
  EvalParams,
  LibraryInput,
  Prompt,
  PromptInput,
} from "./types";

export type ClientOptions = {
  onError?: (error: Error) => void;
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

  prompts = {
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
  run(_: Prompt, __: Record<string, any>) {
    throw new Error("Not implemented");
  }

  eval({ data, task, scorers }: EvalParams) {
    return Eval({ data, task, scorers });
  }
}
