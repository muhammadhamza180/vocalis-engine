import { apolloEnricher } from '../services/apollo-enricher';
import { promptSynthesizer } from '../services/prompt-synthesizer';
import { RetellInboundPayload, SynthesizedPromptResult } from '../types';

export interface InboundCallProcessingResult {
  statusCode: number;
  body: SynthesizedPromptResult | { error: string };
  duration_ms: number;
}

export async function handleInboundCallWebhook(payload: RetellInboundPayload): Promise<InboundCallProcessingResult> {
  const startTime = Date.now();

  try {
    if (!payload || !payload.call_id) {
      return {
        statusCode: 400,
        body: { error: 'Invalid webhook payload: missing call_id' },
        duration_ms: Date.now() - startTime,
      };
    }

    const leadInfo = {
      first_name: payload.metadata?.first_name,
      last_name: payload.metadata?.last_name,
      email: payload.metadata?.email,
      company: payload.metadata?.company,
      domain: payload.metadata?.domain,
      phone: payload.from_number,
      regional_cadence: 'au_australian' as const,
    };

    // 1. Asynchronously enrich via Apollo (guaranteed <200ms fallback)
    const firmographics = await apolloEnricher.enrichLead({
      email: leadInfo.email,
      first_name: leadInfo.first_name,
      last_name: leadInfo.last_name,
      company_name: leadInfo.company,
      domain: leadInfo.domain,
      phone: leadInfo.phone,
    });

    // 2. Synthesize dynamic prompt variables (<35ms)
    const synthesized = promptSynthesizer.synthesizePrompt(firmographics, leadInfo);

    const totalDuration = Date.now() - startTime;

    return {
      statusCode: 200,
      body: synthesized,
      duration_ms: totalDuration,
    };
  } catch (error: any) {
    const fallbackContext = apolloEnricher.getFallbackProfile({});
    const fallbackSynthesized = promptSynthesizer.synthesizePrompt(fallbackContext);

    return {
      statusCode: 200,
      body: fallbackSynthesized,
      duration_ms: Date.now() - startTime,
    };
  }
}
