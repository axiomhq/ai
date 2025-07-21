import {
  type LanguageModelV1StreamPart,
  type LanguageModelV1FunctionToolCall,
  type LanguageModelV1FinishReason,
} from '@ai-sdk/providerv1';

import {
  type LanguageModelV2StreamPart,
  type LanguageModelV2ToolCall,
  type LanguageModelV2FinishReason,
  type LanguageModelV2Usage,
  type LanguageModelV2ResponseMetadata,
} from '@ai-sdk/providerv2';

import { currentUnixTime } from '../../util/currentUnixTime';

// V1-specific aggregators (the original ones)
export class ToolCallAggregator {
  private readonly calls: Record<string, LanguageModelV1FunctionToolCall> = {};

  handleChunk(chunk: LanguageModelV1StreamPart): void {
    switch (chunk.type) {
      case 'tool-call':
        this.calls[chunk.toolCallId] = {
          toolCallType: chunk.toolCallType,
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          args: chunk.args,
        };
        break;
      case 'tool-call-delta':
        if (!this.calls[chunk.toolCallId]) {
          this.calls[chunk.toolCallId] = {
            toolCallType: chunk.toolCallType,
            toolCallId: chunk.toolCallId,
            toolName: chunk.toolName,
            args: '',
          };
        }
        this.calls[chunk.toolCallId].args += chunk.argsTextDelta;
        break;
    }
  }

  get result(): LanguageModelV1FunctionToolCall[] {
    return Object.values(this.calls);
  }
}

export class TextAggregator {
  private content = '';

  feed(chunk: LanguageModelV1StreamPart): void {
    if (chunk.type === 'text-delta') {
      this.content += chunk.textDelta;
    }
  }

  get text(): string | undefined {
    return this.content || undefined;
  }
}

export class StreamStats {
  private startTime: number;
  private timeToFirstToken?: number;
  private _usage?: { promptTokens: number; completionTokens: number };
  private _finishReason?: LanguageModelV1FinishReason;
  private _responseId?: string;
  private _responseModelId?: string;

  constructor() {
    this.startTime = currentUnixTime();
  }

  feed(chunk: LanguageModelV1StreamPart): void {
    // Track time to first token on any chunk
    if (this.timeToFirstToken === undefined) {
      this.timeToFirstToken = currentUnixTime() - this.startTime;
    }

    switch (chunk.type) {
      case 'response-metadata':
        if (chunk.id) {
          this._responseId = chunk.id;
        }
        if (chunk.modelId) {
          this._responseModelId = chunk.modelId;
        }

        break;
      case 'finish':
        this._usage = chunk.usage;
        this._finishReason = chunk.finishReason;
        break;
    }
  }

  get result() {
    return {
      response:
        this._responseId || this._responseModelId
          ? {
              id: this._responseId,
              modelId: this._responseModelId,
            }
          : undefined,
      finishReason: this._finishReason,
      usage: this._usage,
    };
  }

  get firstTokenTime(): number | undefined {
    return this.timeToFirstToken;
  }
}

// V2-specific aggregators
export class ToolCallAggregatorV2 {
  private readonly calls: Record<string, LanguageModelV2ToolCall> = {};

  handleChunk(chunk: LanguageModelV2StreamPart): void {
    if (chunk.type === 'tool-call') {
      this.calls[chunk.toolCallId] = chunk;
    }
  }

  get result(): LanguageModelV2ToolCall[] {
    return Object.values(this.calls);
  }
}

export class TextAggregatorV2 {
  private content = '';

  feed(chunk: LanguageModelV2StreamPart): void {
    // TODO: @cje - is this enough?
    switch (chunk.type) {
      case 'text-start':
        this.content = '';
        break;
      case 'text-delta':
        this.content += chunk.delta;
        break;
      case 'text-end':
        break;
    }
  }

  get text(): string | undefined {
    return this.content || undefined;
  }
}

export class StreamStatsV2 {
  private startTime: number;
  private timeToFirstToken?: number;
  private _usage?: LanguageModelV2Usage;
  private _finishReason?: LanguageModelV2FinishReason;
  private _responseMetadata?: LanguageModelV2ResponseMetadata;

  constructor() {
    this.startTime = currentUnixTime();
  }

  feed(chunk: LanguageModelV2StreamPart): void {
    // Track time to first token on any chunk
    if (this.timeToFirstToken === undefined) {
      this.timeToFirstToken = currentUnixTime() - this.startTime;
    }

    switch (chunk.type) {
      case 'response-metadata':
        this._responseMetadata = {
          id: chunk.id,
          modelId: chunk.modelId,
          timestamp: chunk.timestamp,
        };
        break;
      case 'finish':
        this._usage = chunk.usage;
        this._finishReason = chunk.finishReason;
        break;
    }
  }

  get result() {
    return {
      response: this._responseMetadata,
      finishReason: this._finishReason,
      usage: this._usage,
    };
  }

  get firstTokenTime(): number | undefined {
    return this.timeToFirstToken;
  }
}
