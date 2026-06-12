import { ToolLoopAgent, stepCountIs, tool, zodSchema } from 'ai';
import { z } from 'zod';
import { gpt4oMini } from './openai';

type DemoRuntimeContext = {
  requestId: string;
  tenant: string;
  demo: string;
};

type ToolContext = {
  requestId: string;
  workspace: string;
};

type ToolOutput = Record<string, unknown>;

const contextShape = z.object({
  requestId: z.string(),
  workspace: z.string(),
});

const orderFixture = {
  orderId: 'ord_1042',
  customer: 'Mira N.',
  plan: 'pro',
  product: 'Axiom AI SDK annual seat',
  amountUsd: 480,
  status: 'paid',
  shipment: {
    carrier: 'DemoPost',
    trackingId: 'DP-4409-AX',
    state: 'delayed',
    lastScan: 'Denver transfer hub',
  },
};

export function createSupportAgents(runtimeContext: DemoRuntimeContext) {
  const telemetry = {
    recordInputs: true,
    recordOutputs: true,
    includeRuntimeContext: {
      requestId: true,
      tenant: true,
      demo: true,
    },
  } as const;

  const refundAgent = new ToolLoopAgent({
    id: 'refund-subagent',
    model: gpt4oMini,
    stopWhen: stepCountIs(4),
    instructions:
      'You are a refund policy subagent. Inspect the order and policy, then return a concise refund decision with evidence.',
    runtimeContext,
    telemetry: {
      ...telemetry,
      functionId: 'support-demo.refund-subagent',
      includeToolsContext: {
        inspectOrder: {
          workspace: true,
        },
        getRefundPolicy: {
          workspace: true,
        },
      },
    },
    tools: {
      inspectOrder: tool<{ orderId: string }, ToolOutput, ToolContext>({
        description: 'Read order details for refund analysis.',
        inputSchema: zodSchema(
          z.object({
            orderId: z.string(),
          }),
        ),
        contextSchema: zodSchema(contextShape),
        execute: ({ orderId }, { context }) => ({
          ...orderFixture,
          orderId,
          inspectedBy: context.workspace,
        }),
      }),
      getRefundPolicy: tool<{ plan: 'free' | 'pro' | 'enterprise' }, ToolOutput, ToolContext>({
        description: 'Read the refund policy that applies to this customer plan.',
        inputSchema: zodSchema(
          z.object({
            plan: z.enum(['free', 'pro', 'enterprise']),
          }),
        ),
        contextSchema: zodSchema(contextShape),
        execute: ({ plan }, { context }) => ({
          plan,
          inspectedBy: context.workspace,
          policy:
            'Pro annual seats can be refunded within 30 days. Delivery delays qualify for a goodwill credit when the account is active.',
        }),
      }),
    },
    toolsContext: {
      inspectOrder: {
        requestId: runtimeContext.requestId,
        workspace: 'refund-ops',
      },
      getRefundPolicy: {
        requestId: runtimeContext.requestId,
        workspace: 'refund-ops',
      },
    },
  });

  const logisticsAgent = new ToolLoopAgent({
    id: 'logistics-subagent',
    model: gpt4oMini,
    stopWhen: stepCountIs(4),
    instructions:
      'You are a logistics subagent. Check the package state and return a brief delivery-risk assessment.',
    runtimeContext,
    telemetry: {
      ...telemetry,
      functionId: 'support-demo.logistics-subagent',
      includeToolsContext: {
        getCarrierStatus: {
          workspace: true,
        },
        estimateDelivery: {
          workspace: true,
        },
      },
    },
    tools: {
      getCarrierStatus: tool<{ trackingId: string }, ToolOutput, ToolContext>({
        description: 'Read carrier tracking events.',
        inputSchema: zodSchema(
          z.object({
            trackingId: z.string(),
          }),
        ),
        contextSchema: zodSchema(contextShape),
        execute: ({ trackingId }, { context }) => ({
          trackingId,
          status: orderFixture.shipment.state,
          lastScan: orderFixture.shipment.lastScan,
          inspectedBy: context.workspace,
        }),
      }),
      estimateDelivery: tool<
        { trackingId: string; destinationRegion: string },
        ToolOutput,
        ToolContext
      >({
        description: 'Estimate delivery from the latest carrier status.',
        inputSchema: zodSchema(
          z.object({
            trackingId: z.string(),
            destinationRegion: z.string(),
          }),
        ),
        contextSchema: zodSchema(contextShape),
        execute: ({ trackingId, destinationRegion }, { context }) => ({
          trackingId,
          destinationRegion,
          inspectedBy: context.workspace,
          eta: '2 business days',
          risk: 'medium',
        }),
      }),
    },
    toolsContext: {
      getCarrierStatus: {
        requestId: runtimeContext.requestId,
        workspace: 'logistics-ops',
      },
      estimateDelivery: {
        requestId: runtimeContext.requestId,
        workspace: 'logistics-ops',
      },
    },
  });

  const mainAgent = new ToolLoopAgent({
    id: 'support-orchestrator',
    model: gpt4oMini,
    stopWhen: stepCountIs(6),
    instructions:
      'You are the support orchestrator. You must call getCustomerProfile, delegateShipmentInvestigation, and delegateRefundDecision before answering. Synthesize a short customer-ready answer and an internal action list.',
    runtimeContext,
    telemetry: {
      ...telemetry,
      functionId: 'support-demo.orchestrator',
      includeToolsContext: {
        getCustomerProfile: {
          workspace: true,
        },
        delegateRefundDecision: {
          workspace: true,
        },
        delegateShipmentInvestigation: {
          workspace: true,
        },
      },
    },
    tools: {
      getCustomerProfile: tool<{ customerId: string }, ToolOutput, ToolContext>({
        description: 'Read the customer profile and current order summary.',
        inputSchema: zodSchema(
          z.object({
            customerId: z.string(),
          }),
        ),
        contextSchema: zodSchema(contextShape),
        execute: ({ customerId }, { context }) => ({
          customerId,
          inspectedBy: context.workspace,
          order: orderFixture,
          customerTier: 'high-touch',
        }),
      }),
      delegateRefundDecision: tool<{ orderId: string; reason: string }, ToolOutput, ToolContext>({
        description: 'Ask the refund subagent to decide what refund or credit applies.',
        inputSchema: zodSchema(
          z.object({
            orderId: z.string(),
            reason: z.string(),
          }),
        ),
        contextSchema: zodSchema(contextShape),
        execute: async ({ orderId, reason }, { abortSignal, context }) => {
          const result = await refundAgent.generate({
            prompt: `Order ${orderId}. Refund reason: ${reason}. Decide the refund outcome.`,
            abortSignal,
          });

          return {
            handledBy: context.workspace,
            summary: result.text,
            toolsUsed: result.toolCalls.map((call) => call.toolName),
          };
        },
      }),
      delegateShipmentInvestigation: tool<
        { trackingId: string; destinationRegion: string },
        ToolOutput,
        ToolContext
      >({
        description: 'Ask the logistics subagent to investigate a delayed shipment.',
        inputSchema: zodSchema(
          z.object({
            trackingId: z.string(),
            destinationRegion: z.string(),
          }),
        ),
        contextSchema: zodSchema(contextShape),
        execute: async ({ trackingId, destinationRegion }, { abortSignal, context }) => {
          const result = await logisticsAgent.generate({
            prompt: `Tracking ${trackingId}, destination ${destinationRegion}. Assess delivery risk and next step.`,
            abortSignal,
          });

          return {
            handledBy: context.workspace,
            summary: result.text,
            toolsUsed: result.toolCalls.map((call) => call.toolName),
          };
        },
      }),
    },
    toolsContext: {
      getCustomerProfile: {
        requestId: runtimeContext.requestId,
        workspace: 'frontline-support',
      },
      delegateRefundDecision: {
        requestId: runtimeContext.requestId,
        workspace: 'frontline-support',
      },
      delegateShipmentInvestigation: {
        requestId: runtimeContext.requestId,
        workspace: 'frontline-support',
      },
    },
  });

  return {
    mainAgent,
    refundAgent,
    logisticsAgent,
  };
}
