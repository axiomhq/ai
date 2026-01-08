import { SCHEMA_URL } from './schema';
import { errorToString } from './util/errors';
import { getSuffix } from './util/feedback';

type FeedbackInputBase = {
  readonly name: string;
  readonly message?: string;
  readonly category?: string;
  readonly metadata?: Record<string, unknown>;
};

type FeedbackCoreNumber = {
  readonly kind: 'number';
  readonly value: number;
};

type FeedbackCoreThumb = {
  readonly kind: 'thumb';
  readonly value: -1 | 1;
};

type FeedbackCoreBoolean = {
  readonly kind: 'boolean';
  readonly value: boolean;
};

type FeedbackCoreText = {
  readonly kind: 'text';
  readonly value: string;
};

type FeedbackCoreSignal = {
  readonly kind: 'signal';
  readonly value: null;
};

/** Feedback with a number value (e.g., similarity, 0-1). */
type FeedbackInputNumber = FeedbackInputBase & FeedbackCoreNumber;

/** Feedback with a thumbs up (+1) or thumbs down (-1) value. */
type FeedbackInputThumb = FeedbackInputBase & FeedbackCoreThumb;

/** Feedback with a boolean value (true/false). */
type FeedbackInputBoolean = FeedbackInputBase & FeedbackCoreBoolean;

/** Feedback with a free-form text value. */
type FeedbackInputText = FeedbackInputBase & FeedbackCoreText;

/** Feedback without a value, used to signal an event occurred. */
type FeedbackInputSignal = FeedbackInputBase & FeedbackCoreSignal;

/** Union of all feedback input types. Discriminated on `kind`. */
type FeedbackInput =
  | FeedbackInputNumber
  | FeedbackInputThumb
  | FeedbackInputBoolean
  | FeedbackInputText
  | FeedbackInputSignal;

/** Links that associate feedback with a trace and other context. */
type FeedbackLinks = {
  /** The trace ID to associate this feedback with. */
  readonly traceId: string;
  /** The capability (feature/component) this feedback relates to. */
  readonly capability: string;
  /** Optional step within the capability. */
  readonly step?: string;
  /** Optional span ID for more granular linking. */
  readonly spanId?: string;
  /** Optional conversation ID for conversational contexts. */
  readonly conversationId?: string;
  /** Optional user ID of the person providing feedback. */
  readonly userId?: string;
};

type FeedbackLinksSerialized = {
  readonly trace_id: string;
  readonly capability: string;
  readonly step?: string;
  readonly span_id?: string;
  readonly conversation_id?: string;
  readonly userId?: string;
};

type FeedbackEventBase = {
  readonly schemaUrl: string;
  readonly id: string;
  readonly name: string;
  readonly message?: string;
  readonly category?: string;
  readonly metadata?: Record<string, unknown>;
  readonly links: FeedbackLinksSerialized;
  readonly event: 'feedback';
};

type FeedbackEventPayloadNumber = FeedbackEventBase & FeedbackCoreNumber;
type FeedbackEventPayloadThumb = FeedbackEventBase & FeedbackCoreThumb;
type FeedbackEventPayloadBoolean = FeedbackEventBase & FeedbackCoreBoolean;
type FeedbackEventPayloadText = FeedbackEventBase & FeedbackCoreText;
type FeedbackEventPayloadSignal = FeedbackEventBase & FeedbackCoreSignal;

type FeedbackEventPayload =
  | FeedbackEventPayloadNumber
  | FeedbackEventPayloadThumb
  | FeedbackEventPayloadBoolean
  | FeedbackEventPayloadText
  | FeedbackEventPayloadSignal;

type FeedbackEventStoredBase = FeedbackEventBase & {
  readonly _time: string;
};

type FeedbackEventNumber = FeedbackEventStoredBase & FeedbackCoreNumber;
type FeedbackEventThumb = FeedbackEventStoredBase & FeedbackCoreThumb;
type FeedbackEventBoolean = FeedbackEventStoredBase & FeedbackCoreBoolean;
type FeedbackEventText = FeedbackEventStoredBase & FeedbackCoreText;
type FeedbackEventSignal = FeedbackEventStoredBase & FeedbackCoreSignal;

/** Union of all feedback event types as returned from Axiom queries. Discriminated on `kind`. */
type FeedbackEvent =
  | FeedbackEventNumber
  | FeedbackEventThumb
  | FeedbackEventBoolean
  | FeedbackEventText
  | FeedbackEventSignal;

/** Parameters for creating a number feedback (excludes `kind`). */
type FeedbackParamsNumber = Omit<FeedbackInputNumber, 'kind'>;

/** Parameters for creating a thumb feedback (excludes `kind`). */
// type FeedbackParamsThumb = Omit<FeedbackInputThumb, 'kind'>;

/** Parameters for creating a boolean feedback (excludes `kind`). */
type FeedbackParamsBoolean = Omit<FeedbackInputBoolean, 'kind'>;

/** Parameters for creating a text feedback (excludes `kind`). */
type FeedbackParamsText = Omit<FeedbackInputText, 'kind'>;

/** Parameters for creating a signal feedback (excludes `kind` and `value`). */
type FeedbackParamsSignal = Omit<FeedbackInputSignal, 'kind' | 'value'>;

/** Base parameters shared by all feedback types (name, message, category, metadata). */
type FeedbackParamsBase = FeedbackInputBase;

const withKind = <T extends FeedbackInput>(input: Omit<T, 'kind'>, kind: T['kind']): T =>
  ({
    ...input,
    kind,
  }) as T;

/** Configuration for connecting to the Axiom feedback API. */
type FeedbackConfig = {
  /** Axiom API token with ingest permissions. */
  readonly token: string;
  /** Axiom dataset to send feedback to. */
  readonly dataset: string;
  /** Optional custom Axiom API URL. Defaults to https://api.axiom.co. */
  readonly url?: string;
};

type FeedbackErrorContext = {
  readonly links: FeedbackLinks;
  readonly feedback: FeedbackInput;
};

type FeedbackSettings = {
  readonly onError?: (error: Error, context: FeedbackErrorContext) => void;
};

/** Function signature for sending feedback. */
type SendFeedbackFn = (links: FeedbackLinks, feedback: FeedbackInput) => Promise<void>;

/** Client for sending feedback to Axiom. */
type FeedbackClient = {
  /** Sends feedback associated with the given links. */
  readonly sendFeedback: SendFeedbackFn;
};

/**
 * Creates a feedback client for sending user feedback to Axiom.
 *
 * @example
 * ```ts
 * const client = createFeedbackClient({ token: 'xaat-...', dataset: 'feedback' });
 * void client.sendFeedback(
 *   { traceId: '...', capability: 'support-agent' },
 *   Feedback.thumbUp({ name: 'response-quality' })
 * );
 * ```
 */
const createFeedbackClient = (
  config: FeedbackConfig,
  settings?: FeedbackSettings,
): FeedbackClient => {
  const baseUrl = config.url ?? 'https://api.axiom.co';
  const url = `${baseUrl}${getSuffix(baseUrl, config.dataset)}`;

  const sendFeedback: SendFeedbackFn = async (
    links: FeedbackLinks,
    feedback: FeedbackInput,
  ): Promise<void> => {
    const { metadata, ...feedbackFields } = feedback;

    const { traceId, spanId, conversationId, ...restLinks } = links;
    const serializedLinks = {
      trace_id: traceId,
      ...restLinks,
      ...(spanId !== undefined && { span_id: spanId }),
      ...(conversationId !== undefined && { conversation_id: conversationId }),
    };

    const payload: FeedbackEventPayload = {
      schemaUrl: SCHEMA_URL,
      id: crypto.randomUUID(),
      ...feedbackFields,
      links: serializedLinks,
      event: 'feedback',
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
          { links, feedback },
        );
      }
    } catch (error) {
      const e = error instanceof Error ? error : new Error(errorToString(error));
      if (settings?.onError) {
        settings.onError(e, { links, feedback });
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
  message,
  category,
  metadata,
}: FeedbackParamsBase & { readonly value: 'up' | 'down' }): FeedbackInputThumb =>
  withKind({ name, value: value === 'up' ? 1 : -1, message, category, metadata }, 'thumb');

const thumbUpFeedback = (input: FeedbackParamsBase): FeedbackInputThumb =>
  thumbFeedback({ ...input, value: 'up' });

const thumbDownFeedback = (input: FeedbackParamsBase): FeedbackInputThumb =>
  thumbFeedback({ ...input, value: 'down' });

const enumFeedback = <T extends string>(
  input: FeedbackParamsBase & { readonly value: T },
): FeedbackInputText => withKind(input, 'text');

const numberFeedback = (input: FeedbackParamsNumber): FeedbackInputNumber =>
  withKind(input, 'number');

const boolFeedback = (input: FeedbackParamsBoolean): FeedbackInputBoolean =>
  withKind(input, 'boolean');

const textFeedback = (input: FeedbackParamsText): FeedbackInputText => withKind(input, 'text');

const signalFeedback = (input: FeedbackParamsSignal): FeedbackInputSignal =>
  withKind({ ...input, value: null }, 'signal');

/**
 * Helper functions for creating feedback input objects.
 *
 * @example
 * ```ts
 * Feedback.thumbUp({ name: 'response-quality' })
 * Feedback.number({ name: 'rating', value: 4 })
 * Feedback.signal({ name: 'completed' })
 * ```
 */
const Feedback = {
  /** Creates a signal feedback (no value, just indicates an event occurred). */
  signal: signalFeedback,
  /** Creates a number feedback with a number value. */
  number: numberFeedback,
  /** Creates a boolean feedback with a true/false value. */
  bool: boolFeedback,
  /** Creates a text feedback with a free-form string value. */
  text: textFeedback,
  /** Creates a text feedback from a string enum value. */
  enum: enumFeedback,
  /** Creates a thumb feedback with 'up' or 'down' value. */
  thumb: thumbFeedback,
  /** Creates a thumbs up (+1) feedback. */
  thumbUp: thumbUpFeedback,
  /** Creates a thumbs down (-1) feedback. */
  thumbDown: thumbDownFeedback,
};

export type {
  FeedbackInput,
  FeedbackEvent,
  FeedbackClient,
  FeedbackConfig,
  FeedbackErrorContext,
  FeedbackLinks,
  FeedbackSettings,
  SendFeedbackFn,
};

export { createFeedbackClient, Feedback };
