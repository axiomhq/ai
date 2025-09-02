import { featureEval } from './feature.eval';

featureEval.experimentWith({
  name: 'try gemini',
  metadata: {
    model: 'gemini-2.5-flash',
  },
});
