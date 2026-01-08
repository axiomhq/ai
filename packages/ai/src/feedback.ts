import { SCHEMA_URL } from './schema';
import { errorToString } from './util/errors';
import { getSuffix } from './util/feedback';

type FeedbackInputBase = {
  readonly name: string;
  readonly message?: string;
  readonly category?: string;
  readonly metadata?: Record<string, unknown>;
};

type FeedbackCoreNumerical = {
  readonly kind: 'numerical';
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
};

type FeedbackInputNumerical = FeedbackInputBase & FeedbackCoreNumerical;
type FeedbackInputThumb = FeedbackInputBase & FeedbackCoreThumb;
type FeedbackInputBoolean = FeedbackInputBase & FeedbackCoreBoolean;
type FeedbackInputText = FeedbackInputBase & FeedbackCoreText;
type FeedbackInputSignal = FeedbackInputBase & FeedbackCoreSignal;

type FeedbackInput =
  | FeedbackInputNumerical
  | FeedbackInputThumb
  | FeedbackInputBoolean
  | FeedbackInputText
  | FeedbackInputSignal;

type FeedbackLinks = {
  readonly traceId: string;
  readonly capability: string;
  readonly step?: string;
  readonly spanId?: string;
  readonly conversationId?: string;
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

type FeedbackEventNumerical = FeedbackEventBase & FeedbackCoreNumerical;
type FeedbackEventThumb = FeedbackEventBase & FeedbackCoreThumb;
type FeedbackEventBoolean = FeedbackEventBase & FeedbackCoreBoolean;
type FeedbackEventText = FeedbackEventBase & FeedbackCoreText;
type FeedbackEventSignal = FeedbackEventBase & FeedbackCoreSignal;

type FeedbackEvent =
  | FeedbackEventNumerical
  | FeedbackEventThumb
  | FeedbackEventBoolean
  | FeedbackEventText
  | FeedbackEventSignal;

type _FeedbackInputWithoutKind<T extends FeedbackInput> = Omit<T, 'kind'>;
type _BaseFeedbackInput = _FeedbackInputWithoutKind<FeedbackInputSignal>;

const withKind = <T extends FeedbackInput>(
  input: _FeedbackInputWithoutKind<T>,
  kind: T['kind'],
): T =>
  ({
    ...input,
    kind,
  }) as T;

type FeedbackConfig = {
  readonly token: string;
  readonly dataset: string;
  readonly url?: string;
};

type FeedbackErrorContext = {
  readonly links: FeedbackLinks;
  readonly feedback: FeedbackInput;
};

type FeedbackSettings = {
  readonly onError?: (error: Error) => void;
};

type SendFeedbackFn = (links: FeedbackLinks, feedback: FeedbackInput) => Promise<void>;

type FeedbackClient = {
  readonly sendFeedback: SendFeedbackFn;
};

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

    const payload: FeedbackEvent = {
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
  message,
  category,
  metadata,
}: _BaseFeedbackInput & { readonly value: 'up' | 'down' }): FeedbackInputThumb =>
  withKind({ name, value: value === 'up' ? 1 : -1, message, category, metadata }, 'thumb');

const thumbUpFeedback = (input: _BaseFeedbackInput): FeedbackInputThumb =>
  thumbFeedback({ ...input, value: 'up' });

const thumbDownFeedback = (input: _BaseFeedbackInput): FeedbackInputThumb =>
  thumbFeedback({ ...input, value: 'down' });

const enumFeedback = <T extends string>(
  input: _BaseFeedbackInput & { readonly value: T },
): FeedbackInputText => withKind(input, 'text');

const numericalFeedback = (
  input: _FeedbackInputWithoutKind<FeedbackInputNumerical>,
): FeedbackInputNumerical => withKind(input, 'numerical');

const boolFeedback = (
  input: _FeedbackInputWithoutKind<FeedbackInputBoolean>,
): FeedbackInputBoolean => withKind(input, 'boolean');

const textFeedback = (input: _FeedbackInputWithoutKind<FeedbackInputText>): FeedbackInputText =>
  withKind(input, 'text');

const signalFeedback = (
  input: _FeedbackInputWithoutKind<FeedbackInputSignal>,
): FeedbackInputSignal => withKind(input, 'signal');

const Feedback = {
  signal: signalFeedback,
  numerical: numericalFeedback,
  bool: boolFeedback,
  text: textFeedback,
  enum: enumFeedback,
  thumb: thumbFeedback,
  thumbUp: thumbUpFeedback,
  thumbDown: thumbDownFeedback,
};

export type {
  // union input
  FeedbackInput,
  // individual inputs
  FeedbackInputBoolean,
  FeedbackInputSignal,
  FeedbackInputNumerical,
  FeedbackInputText,
  FeedbackInputThumb,
  // union event
  FeedbackEvent,
  // individual events
  FeedbackEventBoolean,
  FeedbackEventSignal,
  FeedbackEventNumerical,
  FeedbackEventText,
  FeedbackEventThumb,
  // other
  FeedbackClient,
  FeedbackConfig,
  FeedbackErrorContext,
  FeedbackLinks,
  FeedbackSettings,
  SendFeedbackFn,
};

export { createFeedbackClient, Feedback };
