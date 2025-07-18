import { describe, expect, it } from 'vitest';
import { AxiomWrappedLanguageModelV1 } from '../src/otel/AxiomWrappedLanguageModelV1';

describe('tool results extraction', () => {
  it('should extract tool results from Google AI format rawPrompt', () => {
    // Create a mock rawPrompt with Google AI format tool results
    const rawPrompt = [
      {
        role: 'user',
        parts: [
          {
            text: 'What is the current weather in Madrid, Spain?'
          }
        ]
      },
      {
        role: 'model',
        parts: [
          {
            functionCall: {
              name: 'getWeather',
              args: {
                city: 'Madrid',
                country: 'Spain'
              }
            }
          }
        ]
      },
      {
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: 'getWeather',
              response: {
                name: 'getWeather',
                content: {
                  city: 'Madrid',
                  country: 'Spain',
                  temperature: 22,
                  condition: 'sunny',
                  humidity: 45,
                  windSpeed: 12
                }
              }
            }
          }
        ]
      }
    ];

    // Access the private static method using bracket notation
    const extractMethod = (AxiomWrappedLanguageModelV1 as any).extractToolResultsFromRawPrompt;
    const toolResultsMap = extractMethod(rawPrompt);

    expect(toolResultsMap.size).toBe(1);
    expect(toolResultsMap.get('getWeather')).toEqual({
      city: 'Madrid',
      country: 'Spain',
      temperature: 22,
      condition: 'sunny',
      humidity: 45,
      windSpeed: 12
    });
  });

  it('should return empty map for invalid rawPrompt', () => {
    const extractMethod = (AxiomWrappedLanguageModelV1 as any).extractToolResultsFromRawPrompt;
    
    expect(extractMethod(null).size).toBe(0);
    expect(extractMethod(undefined).size).toBe(0);
    expect(extractMethod([]).size).toBe(0);
    expect(extractMethod('not an array').size).toBe(0);
  });

  it('should handle rawPrompt without tool results', () => {
    const rawPrompt = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Hello'
          }
        ]
      }
    ];

    const extractMethod = (AxiomWrappedLanguageModelV1 as any).extractToolResultsFromRawPrompt;
    const toolResultsMap = extractMethod(rawPrompt);

    expect(toolResultsMap.size).toBe(0);
  });
});
