import 'dotenv/config';
import chalk from 'chalk';
import type { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { generateListing } from '../service';
import { setupAppInstrumentation } from '../../instrumentation.node';

const sampleBriefs = [
  {
    seller_brief: 'Retro Nintendo Game Boy, works perfectly, minor scratches',
    seller_username: '@vintage_shop#82947',
  },
  {
    seller_brief: 'Bluetooth speaker, waterproof, great sound quality',
    seller_username: '@tech_deals#45821',
  },
  {
    seller_brief: 'Ceramic plant pot set, 3 pieces, hand-painted design',
    seller_username: '@home_decor#91234',
  },
  {
    seller_brief: 'Mountain bike helmet, size L, barely used, all safety standards met',
    seller_username: '@cycling_gear#67453',
  },
  {
    seller_brief: 'Espresso machine, compact design, includes milk frother',
    seller_username: '@CoffeePro',
  },
];

async function main() {
  console.log(chalk.dim('─'.repeat(60)));
  console.log(chalk.bold('Acme Listing Generator'));
  console.log(chalk.dim('─'.repeat(60)));

  // Initialize instrumentation
  console.log(chalk.dim('\n→ Initializing...'));
  const { provider } = (await setupAppInstrumentation({
    url: process.env.AXIOM_URL,
    token: process.env.AXIOM_TOKEN,
    dataset: process.env.AXIOM_DATASET,
  })) as { provider: NodeTracerProvider };

  // Pick random sample
  const sample = sampleBriefs[Math.floor(Math.random() * sampleBriefs.length)];
  console.log(chalk.dim(`→ Selected seller: ${chalk.cyan(sample.seller_username)}\n`));

  // Show input
  console.log(chalk.bold('Input:'));
  console.log(chalk.gray(`  "${sample.seller_brief}"`));

  // Generate listing
  console.log(chalk.dim('\n→ Generating listing...'));
  const { output, traceId } = await generateListing({ seller_brief: sample.seller_brief });

  // Show output
  console.log(chalk.green('✓ Listing generated\n'));
  console.log(chalk.bold('Output:'));
  console.log(chalk.white(`  ${output.product_description}`));

  if (traceId) {
    console.log(chalk.dim(`\n→ Trace ID: ${chalk.cyan(traceId)}`));
  }

  // Flush spans to Axiom
  if (provider) {
    await provider.forceFlush();
  }

  console.log(chalk.dim('→ Trace sent to Axiom'));
  console.log(chalk.dim('─'.repeat(60) + '\n'));
}

main().catch((error) => {
  console.error(chalk.red('\n✗ Error:'), error.message);
  console.error(error);
  process.exit(1);
});
