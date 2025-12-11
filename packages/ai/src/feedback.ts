type Correlation = {
  readonly traceId: string;
  readonly capability: string;
  readonly step?: string;
  readonly spanId?: string;
  readonly conversationId?: string;
};

type FeedbackBase = {
  readonly id: string;
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

type FeedbackInput<T extends FeedbackType> = Omit<T, 'id' | 'kind'>;
type BaseFeedbackInput = FeedbackInput<EventFeedback>;

const withKindAndId = <T extends FeedbackType>(input: FeedbackInput<T>, kind: T['kind']): T =>
  ({
    ...input,
    id: crypto.randomUUID(),
    kind,
  }) as T;

type FeedbackConfig = {
  readonly url: string;
};

type SendFeedback = (correlation: Correlation, feedback: FeedbackType) => Promise<void>;

const createFeedbackClient = (config: FeedbackConfig): SendFeedback => {
  return async (correlation: Correlation, feedback: FeedbackType): Promise<void> => {
    console.log('[axiom/feedback] sendFeedback called', {
      url: config.url,
      correlation,
      feedback,
    });
  };
};

const thumbsFeedback = ({
  name,
  value,
  metadata,
}: BaseFeedbackInput & { readonly value: 'up' | 'down' }): NumericalFeedback =>
  withKindAndId({ name, value: value === 'up' ? 1 : -1, metadata }, 'numerical');

const thumbsUpFeedback = (input: BaseFeedbackInput): NumericalFeedback =>
  thumbsFeedback({ ...input, value: 'up' });

const thumbsDownFeedback = (input: BaseFeedbackInput): NumericalFeedback =>
  thumbsFeedback({ ...input, value: 'down' });

const enumFeedback = <T extends string>(
  input: BaseFeedbackInput & { readonly value: T }
): TextFeedback => withKindAndId(input, 'text');

const numericalFeedback = (input: FeedbackInput<NumericalFeedback>): NumericalFeedback =>
  withKindAndId(input, 'numerical');

const boolFeedback = (input: FeedbackInput<BooleanFeedback>): BooleanFeedback =>
  withKindAndId(input, 'boolean');

const textFeedback = (input: FeedbackInput<TextFeedback>): TextFeedback => withKindAndId(input, 'text');

const eventFeedback = (input: FeedbackInput<EventFeedback>): EventFeedback => withKindAndId(input, 'event');

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
  SendFeedback,
  NumericalFeedback,
  BooleanFeedback,
  TextFeedback,
  EventFeedback,
};

export { createFeedbackClient, Feedback };
