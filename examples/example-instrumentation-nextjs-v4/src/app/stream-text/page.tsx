'use client';

import { useState } from 'react';
import { generateStreamingText } from './actions';
import { readStreamableValue } from 'ai/rsc';

export const maxDuration = 30;

export default function Page() {
  const [input, setInput] = useState('');
  const [generation, setGeneration] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setGeneration('');

    try {
      const { output } = await generateStreamingText(input);

      for await (const delta of readStreamableValue(output)) {
        setGeneration((currentGeneration) => `${currentGeneration}${delta}`);
      }
    } catch (error) {
      console.error('Error generating text:', error);
      setGeneration('Error generating text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Stream Text Example</h1>
      <p>Enter a prompt to see streaming text generation in action:</p>

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your prompt here..."
            rows={4}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: isLoading ? '#ccc' : '#007cba',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </form>

      {(generation || isLoading) && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #ddd',
            whiteSpace: 'pre-wrap',
          }}
        >
          <h3>Generated Text:</h3>
          <div>{generation || (isLoading ? 'Starting generation...' : '')}</div>
        </div>
      )}
    </div>
  );
}
