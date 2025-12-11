import { SCHEMA_URL } from './schema';

type Correlation = {
  readonly traceId: string;
  readonly capability: string;
  readonly step?: string;
  readonly spanId?: string;
  readonly conversationId?: string;
};

type FeedbackBase = {
  readonly name: string;
  readonly metadata?: Record<string, unknown>;
};

type NumericalFeedback = FeedbackBase & {
  readonly kind: 'numerical';
  readonly value: number;
};

type BooleanFeedback = FeedbackBase & {
  readonly kind: 'boolean';
  readonly value: boolean;
};

type TextFeedback = FeedbackBase & {
  readonly kind: 'text';
  readonly value: string;
};

type EventFeedback = FeedbackBase & {
  readonly kind: 'event';
};

type FeedbackType = NumericalFeedback | BooleanFeedback | TextFeedback | EventFeedback;

type FeedbackInput<T extends FeedbackType> = Omit<T, 'kind'>;
type BaseFeedbackInput = FeedbackInput<EventFeedback>;

const withKind = <T extends FeedbackType>(input: FeedbackInput<T>, kind: T['kind']): T =>
  ({
    ...input,
    kind,
  }) as T;

type FeedbackConfig = {
  readonly token: string;
  readonly dataset: string;
  readonly url?: string;
};

type FeedbackSettings = {
  readonly onError?: (error: Error) => void;
};

type SendFeedback = (correlation: Correlation, feedback: FeedbackType) => Promise<void>;

const createFeedbackClient = (config: FeedbackConfig, settings?: FeedbackSettings): SendFeedback => {
  const baseUrl = config.url ?? 'https://api.axiom.co';

  return async (correlation: Correlation, feedback: FeedbackType): Promise<void> => {
    const { metadata, ...feedbackFields } = feedback;

    const payload = {
      schemaUrl: SCHEMA_URL,
      id: crypto.randomUUID(),
      ...feedbackFields,
      correlation,
      metadata,
    };

    try {
      const response = await fetch(`${baseUrl}/v1/ingest/${config.dataset}`, {
      // TODO: maybe use axiom-js for this?
      // TODO: discriminate between edge and non edge
      const response = await fetch(`${baseUrl}/v1/datasets/${config.dataset}/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.token}`,
        },
        body: JSON.stringify([payload]),
      });

      if (!response.ok) {
        const text = await response.text();
        settings?.onError?.(new Error(`Failed to send feedback to Axiom: ${response.status} ${text}`));
      }
    } catch (error) {
      settings?.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };
};

const thumbsFeedback = ({
  name,
  value,
  metadata,
}: BaseFeedbackInput & { readonly value: 'up' | 'down' }): NumericalFeedback =>
  withKind({ name, value: value === 'up' ? 1 : -1, metadata }, 'numerical');

const thumbsUpFeedback = (input: BaseFeedbackInput): NumericalFeedback =>
  thumbsFeedback({ ...input, value: 'up' });

const thumbsDownFeedback = (input: BaseFeedbackInput): NumericalFeedback =>
  thumbsFeedback({ ...input, value: 'down' });

const enumFeedback = <T extends string>(
  input: BaseFeedbackInput & { readonly value: T }
): TextFeedback => withKind(input, 'text');

const numericalFeedback = (input: FeedbackInput<NumericalFeedback>): NumericalFeedback =>
  withKind(input, 'numerical');

const boolFeedback = (input: FeedbackInput<BooleanFeedback>): BooleanFeedback =>
  withKind(input, 'boolean');

const textFeedback = (input: FeedbackInput<TextFeedback>): TextFeedback => withKind(input, 'text');

const eventFeedback = (input: FeedbackInput<EventFeedback>): EventFeedback => withKind(input, 'event');

const Feedback = {
  event: eventFeedback,
  numerical: numericalFeedback,
  bool: boolFeedback,
  text: textFeedback,
  thumbs: thumbsFeedback,
  enum: enumFeedback,
  thumb: thumbsFeedback,
  thumbUp: thumbsUpFeedback,
  thumbDown: thumbsDownFeedback,
};

export type {
  Correlation,
  FeedbackType,
  FeedbackConfig,
  FeedbackSettings,
  SendFeedback,
  NumericalFeedback,
  BooleanFeedback,
  TextFeedback,
  EventFeedback,
};

export { createFeedbackClient, Feedback };
