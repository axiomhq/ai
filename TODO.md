# OpenAI SDK Wrapper Implementation Plan

## 1. Streaming Support for Chat Completions
- [ ] Add streaming support to `chat.completions.create`
- [ ] Implement stream chunk handling
- [ ] Add time-to-first-token tracking
- [ ] Add proper stream response type definitions
- [ ] Add stream-specific attributes to spans

## 2. Legacy Completions API
- [ ] Add `completions.create` method
- [ ] Add streaming support for completions
- [ ] Add proper response type definitions
- [ ] Add completion-specific attributes to spans
- [ ] Handle both streaming and non-streaming cases

## 3. Embeddings API
- [ ] Add `embeddings.create` method
- [ ] Add proper response type definitions
- [ ] Add embedding-specific attributes to spans
- [ ] Handle token usage for embeddings

## 4. Fine-tuning API
- [ ] Add `fineTuning.jobs.create` method
- [ ] Add `fineTuning.jobs.list` method
- [ ] Add `fineTuning.jobs.retrieve` method
- [ ] Add `fineTuning.jobs.cancel` method
- [ ] Add proper response type definitions
- [ ] Add fine-tuning specific attributes to spans

## 5. Files API
- [ ] Add `files.create` method
- [ ] Add `files.list` method
- [ ] Add `files.retrieve` method
- [ ] Add `files.delete` method
- [ ] Add `files.content` method
- [ ] Add proper response type definitions
- [ ] Add file-specific attributes to spans

## 6. Response Types
- [ ] Create `oai_responses.ts` file
- [ ] Define all response types
- [ ] Add proper type exports
- [ ] Add type guards where needed

## 7. Testing
- [ ] Add unit tests for each new method
- [ ] Add integration tests
- [ ] Test streaming functionality
- [ ] Test error handling
- [ ] Test span attributes

## 8. Documentation
- [ ] Add JSDoc comments for all new methods
- [ ] Add examples for each API
- [ ] Document streaming usage
- [ ] Document response types

## Notes
- Each feature should be implemented in its own PR
- Each PR should include tests and documentation
- Follow Braintrust's implementation patterns where possible
- Ensure proper error handling and type safety
- Maintain consistent span attribute naming
