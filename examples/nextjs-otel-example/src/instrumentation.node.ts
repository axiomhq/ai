import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource, resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { initAxiomAI } from "@axiomhq/ai";
import { tracer } from "./tracer";

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "nextjs-otel-example",
  }) as Resource,
  spanProcessor: new SimpleSpanProcessor(
    new OTLPTraceExporter({
      url: `https://api.axiom.co/v1/traces`,
      headers: {
        Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
        "X-Axiom-Dataset": process.env.AXIOM_DATASET!,
      },
    })
  ),
});
sdk.start();

initAxiomAI({ tracer });
