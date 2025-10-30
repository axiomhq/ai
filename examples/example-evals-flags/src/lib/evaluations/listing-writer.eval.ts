import { experimental_Eval as Eval } from 'axiom/ai/evals';
import { Factuality, Moderation } from 'autoevals';
import { generateListing } from '../service';
import { listingRecords } from '../collections/records';
import type { ListingInput, ListingOutput } from '../schemas';

Eval('listing-writer', {
  data: () => listingRecords,
  task: async ({ input }: { input: ListingInput }) => {
    const result = await generateListing(input);
    return result.output.product_description;
  },
  scorers: [Moderation, Factuality],
  metadata: {
    description: 'Evaluates the Acme listing writer agent for product descriptions',
  },
});
