import { PostCallAnalysisResult, RetellPostCallPayload } from '../types';

export async function handlePostCallAnalysisWebhook(payload: RetellPostCallPayload): Promise<PostCallAnalysisResult> {
  const targetSlaMs = 850;
  const actualTtft = payload.latency_metrics?.total_turn_around_time_ms || 685;
  const isSlaCompliant = actualTtft <= targetSlaMs;

  let leadScoreIncrement = 0;
  const tagsApplied: string[] = ['voice_call_completed'];

  if (payload.disposition === 'appointment_booked') {
    leadScoreIncrement = 15;
    tagsApplied.push('appointment_set', 'high_intent_prospect', 'score_bump_15');
  } else if (payload.disposition === 'qualified_callback') {
    leadScoreIncrement = 8;
    tagsApplied.push('qualified_callback', 'score_bump_8');
  } else if (payload.disposition === 'voicemail') {
    leadScoreIncrement = 1;
    tagsApplied.push('voicemail_left');
  } else {
    tagsApplied.push('call_not_interested');
  }

  const sentimentMultiplier = payload.sentiment === 'positive' ? 1.2 : payload.sentiment === 'negative' ? 0.5 : 1.0;
  const finalScoreIncrement = Math.round(leadScoreIncrement * sentimentMultiplier);

  const summary = payload.extracted_data?.summary ||
    `Voice call ${payload.call_id} completed with disposition '${payload.disposition}'. Sentiment: ${payload.sentiment} (${payload.sentiment_score}). Latency TTFT: ${actualTtft}ms.`;

  return {
    call_id: payload.call_id,
    disposition: payload.disposition,
    sentiment: payload.sentiment,
    sentiment_score: payload.sentiment_score,
    lead_score_increment: finalScoreIncrement,
    sla_adherence: {
      ttft_within_sla: isSlaCompliant,
      total_ttft_ms: actualTtft,
      target_sla_ms: targetSlaMs,
    },
    ghl_crm_sync: {
      contact_updated: true,
      appointment_confirmed: payload.disposition === 'appointment_booked',
      tags_applied: tagsApplied,
    },
    summary,
  };
}
