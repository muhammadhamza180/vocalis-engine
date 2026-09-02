import { handleInboundCallWebhook } from '../src/webhooks/inbound-call';
import { handlePostCallAnalysisWebhook } from '../src/webhooks/post-call-analysis';
import { GHLCalendarService } from '../src/services/ghl-calendar';
import { RetellClient } from '../src/services/retell-client';
import { RetellInboundPayload, RetellPostCallPayload } from '../src/types';

describe('Webhook Handlers & Integrations', () => {
  describe('Inbound Call Webhook', () => {
    test('should return 200 with dynamic prompt variables for valid inbound payload', async () => {
      const payload: RetellInboundPayload = {
        event: 'call_inbound_received',
        call_id: 'call_9f8a3c1e5b2d7a4f',
        from_number: '+15550199001',
        to_number: '+15550199000',
        agent_id: 'agent_retell_voice_v3_prod',
        metadata: {
          lead_id: 'ghl_lead_88319',
          domain: 'acmegrowth.com.au',
          first_name: 'Sarah',
          company: 'Acme Growth Media',
        },
      };

      const result = await handleInboundCallWebhook(payload);

      expect(result.statusCode).toBe(200);
      const body: any = result.body;
      expect(body.response_type).toBe('dynamic_variables_response');
      expect(body.dynamic_variables.first_name).toBe('Sarah');
      expect(body.dynamic_variables.company_name).toBe('Acme Growth Media');
      expect(result.duration_ms).toBeLessThan(300);
    });

    test('should return 400 when call_id is missing', async () => {
      const invalidPayload = {} as any;
      const result = await handleInboundCallWebhook(invalidPayload);

      expect(result.statusCode).toBe(400);
      expect((result.body as any).error).toContain('missing call_id');
    });
  });

  describe('Post-Call Analysis Webhook', () => {
    test('should calculate sentiment-adjusted lead score and verify TTFT SLA compliance', async () => {
      const postCallPayload: RetellPostCallPayload = {
        event: 'call_analyzed',
        call_id: 'call_9f8a3c1e5b2d7a4f',
        agent_id: 'agent_retell_voice_v3_prod',
        duration_seconds: 162,
        disposition: 'appointment_booked',
        sentiment: 'positive',
        sentiment_score: 0.92,
        latency_metrics: {
          average_stt_latency_ms: 165,
          average_llm_ttft_ms: 192,
          average_tts_latency_ms: 138,
          total_turn_around_time_ms: 685,
        },
        transcript: [
          { role: 'agent', content: 'Hi Sarah...', timestamp_ms: 400 },
          { role: 'user', content: 'Hey, let us book Thursday.', timestamp_ms: 2500 },
        ],
        extracted_data: {
          booked_slot: '2026-09-04T10:00:00+10:00',
          lead_score_increment: 15,
          qualification_verified: true,
        },
      };

      const analysis = await handlePostCallAnalysisWebhook(postCallPayload);

      expect(analysis.call_id).toBe('call_9f8a3c1e5b2d7a4f');
      expect(analysis.disposition).toBe('appointment_booked');
      expect(analysis.sla_adherence.ttft_within_sla).toBe(true);
      expect(analysis.sla_adherence.total_ttft_ms).toBe(685);
      expect(analysis.lead_score_increment).toBe(18); // 15 * 1.2 positive multiplier = 18
      expect(analysis.ghl_crm_sync.appointment_confirmed).toBe(true);
      expect(analysis.ghl_crm_sync.tags_applied).toContain('appointment_set');
    });

    test('should flag SLA breach if TTFT exceeds 850ms threshold', async () => {
      const slowPayload: RetellPostCallPayload = {
        event: 'call_analyzed',
        call_id: 'call_slow_test_01',
        agent_id: 'agent_retell_voice_v3_prod',
        duration_seconds: 45,
        disposition: 'voicemail',
        sentiment: 'neutral',
        sentiment_score: 0.5,
        latency_metrics: {
          average_stt_latency_ms: 320,
          average_llm_ttft_ms: 450,
          average_tts_latency_ms: 220,
          total_turn_around_time_ms: 990,
        },
        transcript: [],
      };

      const analysis = await handlePostCallAnalysisWebhook(slowPayload);

      expect(analysis.sla_adherence.ttft_within_sla).toBe(false);
      expect(analysis.sla_adherence.total_ttft_ms).toBe(990);
    });
  });

  describe('GoHighLevel Calendar Service', () => {
    let calendar: GHLCalendarService;

    beforeEach(() => {
      calendar = new GHLCalendarService();
    });

    test('should return available slots for requested date', async () => {
      const checkRes = await calendar.checkAvailability({
        date: '2026-09-04',
        timezone: 'Australia/Melbourne',
      });

      expect(checkRes.status).toBe('available');
      expect(checkRes.available_slots.length).toBeGreaterThan(0);
      expect(checkRes.available_slots).toContain('2026-09-04T09:00:00+10:00');
    });

    test('should book appointment and reject double-booking on same slot', async () => {
      const bookRes = await calendar.bookAppointment({
        slot_time: '2026-09-04T09:00:00+10:00',
        prospect_name: 'Sarah Connor',
        prospect_email: 'sarah@acmegrowth.com.au',
        prospect_phone: '+15550199001',
      });

      expect(bookRes.success).toBe(true);
      expect(bookRes.appointment_id).toBeDefined();

      // Second booking attempt on same slot
      const duplicateRes = await calendar.bookAppointment({
        slot_time: '2026-09-04T09:00:00+10:00',
        prospect_name: 'John Doe',
        prospect_email: 'john@acmegrowth.com.au',
        prospect_phone: '+15550199002',
      });

      expect(duplicateRes.success).toBe(false);
      expect(duplicateRes.message).toContain('no longer available');
    });
  });

  describe('Retell Client', () => {
    test('should create mock phone call in test mode', async () => {
      const client = new RetellClient('YOUR_RETELL_API_KEY_HERE');
      const call = await client.createPhoneCall({
        from_number: '+15550199000',
        to_number: '+15550199001',
        override_agent_id: 'agent_retell_voice_v3_prod',
      });

      expect(call.call_id).toBeDefined();
      expect(call.call_status).toBe('registered');
      expect(call.to_number).toBe('+15550199001');
    });
  });
});
