export * from './types';
export * from './config/env';
export * from './config/voice-config';
export * from './services/apollo-enricher';
export * from './services/prompt-synthesizer';
export * from './services/retell-client';
export * from './services/ghl-calendar';
export * from './webhooks/inbound-call';
export * from './webhooks/post-call-analysis';

import { env } from './config/env';
import { handleInboundCallWebhook } from './webhooks/inbound-call';
import { handlePostCallAnalysisWebhook } from './webhooks/post-call-analysis';

export async function bootstrap() {
  console.log('⚡ Apollo-Enriched Voice Engine initialized.');
  console.log(`⚡ Environment: ${env.NODE_ENV} | Port: ${env.PORT} | TTFT SLA Target: <${env.MAX_LATENCY_BUDGET_MS}ms`);
}

if (require.main === module) {
  bootstrap();
}
