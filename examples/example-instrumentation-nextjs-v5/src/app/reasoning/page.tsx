'use client';

import { useState } from 'react';
import { generateReasoningText, streamReasoningText } from './actions';
import { readStreamableValue } from '@ai-sdk/rsc';

export const maxDuration = 30;

export default function Page() {
  const [input, setInput] = useState('How many bananas would fit in an Airbus A380?');
  const [generateResult, setGenerateResult] = useState('');
  const [streamResult, setStreamResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsGenerating(true);
    setGenerateResult('');

    try {
      const result = await generateReasoningText(input);
      setGenerateResult(result.text);
    } catch (error) {
      console.error('Error generating text:', error);
      setGenerateResult('Error generating text. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsStreaming(true);
    setStreamResult('');

    try {
      const { output } = await streamReasoningText(input);

      for await (const delta of readStreamableValue(output)) {
        setStreamResult((current) => `${current}${delta}`);
      }
    } catch (error) {
      console.error('Error streaming text:', error);
      setStreamResult('Error streaming text. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Reasoning Examples with O3</h1>
      <p>
        Test reasoning capabilities with OpenAI's O3 model. This example demonstrates both generate
        and stream modes with reasoning content parts.
      </p>

      <form style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label
            htmlFor="input"
            style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
          >
            Prompt (ask something that requires reasoning):
          </label>
          <textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a prompt that requires reasoning..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
            }}
            disabled={isGenerating || isStreaming}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || isStreaming || !input.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: isGenerating ? '#ccc' : '#007cba',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isGenerating || isStreaming ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate Text'}
          </button>

          <button
            type="button"
            onClick={handleStream}
            disabled={isStreaming || isGenerating || !input.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: isStreaming ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isStreaming || isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isStreaming ? 'Streaming...' : 'Stream Text'}
          </button>
        </div>
      </form>

      {(generateResult || isGenerating) && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Generated Text Result:</h3>
          <div
            style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #dee2e6',
              whiteSpace: 'pre-wrap',
              minHeight: '100px',
            }}
          >
            {generateResult || (isGenerating ? 'Generating reasoning response...' : '')}
          </div>
        </div>
      )}

      {(streamResult || isStreaming) && (
        <div>
          <h3>Streamed Text Result:</h3>
          <div
            style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #dee2e6',
              whiteSpace: 'pre-wrap',
              minHeight: '100px',
            }}
          >
            {streamResult || (isStreaming ? 'Starting reasoning stream...' : '')}
          </div>
        </div>
      )}
    </div>
  );
}
