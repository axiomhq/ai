import { SCHEMA_URL } from './schema';
import { errorToString } from './util/errors';
import { getSuffix } from './util/feedback';

type Links = {
  readonly traceId: string;
  readonly capability: string;
  readonly step?: string;
  readonly spanId?: string;
  readonly conversationId?: string;
  readonly userId?: string;
};

type FeedbackBase = {
  readonly name: string;
  readonly message?: string;
  readonly category?: string;
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

type SendFeedback = (links: Links, feedback: FeedbackType) => Promise<void>;

type FeedbackClient = {
  readonly sendFeedback: SendFeedback;
};

const createFeedbackClient = (
  config: FeedbackConfig,
  settings?: FeedbackSettings,
): FeedbackClient => {
  const baseUrl = config.url ?? 'https://api.axiom.co';
  const url = `${baseUrl}${getSuffix(baseUrl, config.dataset)}`;

  const sendFeedback: SendFeedback = async (
    links: Links,
    feedback: FeedbackType,
  ): Promise<void> => {
    const { metadata, ...feedbackFields } = feedback;

    const { traceId, spanId, conversationId, ...restLinks } = links;
    const serializedLinks = {
      trace_id: traceId,
      ...restLinks,
      ...(spanId !== undefined && { span_id: spanId }),
      ...(conversationId !== undefined && { conversation_id: conversationId }),
    };

    const payload = {
      schemaUrl: SCHEMA_URL,
      id: crypto.randomUUID(),
      ...feedbackFields,
      links: serializedLinks,
      ...(metadata !== undefined && { metadata }),
    };

    try {
      // TODO: maybe use axiom-js for this?
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        settings?.onError?.(
          new Error(`Failed to send feedback to Axiom: ${response.status} ${text}`),
        );
      }
    } catch (error) {
      const e = error instanceof Error ? error : new Error(errorToString(error));
      if (settings?.onError) {
        settings.onError(e);
      } else {
        console.error(e);
      }
    }
  };

  return { sendFeedback };
};

const thumbFeedback = ({
  name,
  value,
  metadata,
}: BaseFeedbackInput & { readonly value: 'up' | 'down' }): NumericalFeedback =>
  withKind({ name, value: value === 'up' ? 1 : -1, metadata }, 'numerical');

const thumbUpFeedback = (input: BaseFeedbackInput): NumericalFeedback =>
  thumbFeedback({ ...input, value: 'up' });

const thumbDownFeedback = (input: BaseFeedbackInput): NumericalFeedback =>
  thumbFeedback({ ...input, value: 'down' });

const enumFeedback = <T extends string>(
  input: BaseFeedbackInput & { readonly value: T },
): TextFeedback => withKind(input, 'text');

const numericalFeedback = (input: FeedbackInput<NumericalFeedback>): NumericalFeedback =>
  withKind(input, 'numerical');

const boolFeedback = (input: FeedbackInput<BooleanFeedback>): BooleanFeedback =>
  withKind(input, 'boolean');

const textFeedback = (input: FeedbackInput<TextFeedback>): TextFeedback => withKind(input, 'text');

const eventFeedback = (input: FeedbackInput<EventFeedback>): EventFeedback =>
  withKind(input, 'event');

const Feedback = {
  event: eventFeedback,
  numerical: numericalFeedback,
  bool: boolFeedback,
  text: textFeedback,
  enum: enumFeedback,
  thumb: thumbFeedback,
  thumbUp: thumbUpFeedback,
  thumbDown: thumbDownFeedback,
};

export type {
  BooleanFeedback,
  EventFeedback,
  FeedbackClient,
  FeedbackConfig,
  FeedbackSettings,
  FeedbackType,
  Links,
  NumericalFeedback,
  SendFeedback,
  TextFeedback,
};

export { createFeedbackClient, Feedback };
