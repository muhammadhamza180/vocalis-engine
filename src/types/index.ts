export interface ApolloEnrichInput {
  email?: string;
  first_name?: string;
  last_name?: string;
  domain?: string;
  company_name?: string;
  phone?: string;
}

export interface ApolloOrganization {
  name?: string;
  website_url?: string;
  primary_domain?: string;
  estimated_num_employees?: number;
  annual_revenue?: number | string;
  annual_revenue_printed?: string;
  industry?: string;
  technologies?: string[];
  city?: string;
  state?: string;
  country?: string;
}

export interface ApolloPerson {
  first_name?: string;
  last_name?: string;
  title?: string;
  headline?: string;
  organization?: ApolloOrganization;
  email?: string;
}

export interface ApolloMatchResponse {
  person?: ApolloPerson;
  organization?: ApolloOrganization;
  status?: string;
  error?: string;
}

export interface FirmographicContext {
  lead_first_name: string;
  lead_last_name: string;
  lead_job_title: string;
  company_name: string;
  employee_count: string;
  annual_revenue: string;
  current_cms: string;
  technologies: string[];
  market_location: string;
  estimated_traffic_drop: string;
  inferred_pain_point: string;
  rep_calendar_link: string;
  is_fallback: boolean;
  enrichment_latency_ms: number;
}

export interface LeadInfo {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  domain?: string;
  source?: string;
  regional_cadence?: 'au_australian' | 'us_enterprise';
}

export interface RetellDynamicVariablesResponse {
  response_type: 'dynamic_variables_response';
  dynamic_variables: Record<string, string>;
  custom_system_prompt_override: string;
}

export interface SynthesizedPromptResult {
  response_type: 'dynamic_variables_response';
  dynamic_variables: Record<string, string>;
  custom_system_prompt_override: string;
  synthesis_latency_ms: number;
  metadata: {
    is_fallback: boolean;
    regional_cadence: string;
    variables_count: number;
  };
}

export interface RetellInboundPayload {
  event: 'call_inbound_received' | 'call_started';
  call_id: string;
  from_number: string;
  to_number: string;
  agent_id: string;
  direction?: 'inbound' | 'outbound';
  metadata?: {
    lead_id?: string;
    domain?: string;
    campaign_id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    company?: string;
  };
}

export interface RetellTranscriptTurn {
  role: 'agent' | 'user' | 'system';
  content: string;
  timestamp_ms: number;
}

export interface RetellLatencyMetrics {
  average_stt_latency_ms: number;
  average_llm_ttft_ms: number;
  average_tts_latency_ms: number;
  total_turn_around_time_ms: number;
}

export interface RetellPostCallPayload {
  event: 'call_analyzed' | 'call_ended';
  call_id: string;
  agent_id: string;
  duration_seconds: number;
  disposition: 'appointment_booked' | 'qualified_callback' | 'not_interested' | 'voicemail' | 'dropped';
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  recording_url?: string;
  latency_metrics: RetellLatencyMetrics;
  transcript: RetellTranscriptTurn[];
  extracted_data?: {
    booked_slot?: string;
    lead_score_increment?: number;
    qualification_verified?: boolean;
    objections_raised?: string[];
    summary?: string;
  };
}

export interface GHLCalendarSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface GHLCalendarCheckRequest {
  date: string;
  timezone: string;
}

export interface GHLCalendarCheckResponse {
  available_slots: string[];
  timezone: string;
  date: string;
  status: 'available' | 'conflict' | 'error';
}

export interface GHLCalendarBookRequest {
  slot_time: string;
  prospect_name: string;
  prospect_email: string;
  prospect_phone: string;
  timezone?: string;
  notes?: string;
}

export interface GHLCalendarBookResponse {
  success: boolean;
  appointment_id?: string;
  slot_time: string;
  prospect_email: string;
  message: string;
}

export interface PostCallAnalysisResult {
  call_id: string;
  disposition: string;
  sentiment: string;
  sentiment_score: number;
  lead_score_increment: number;
  sla_adherence: {
    ttft_within_sla: boolean;
    total_ttft_ms: number;
    target_sla_ms: number;
  };
  ghl_crm_sync: {
    contact_updated: boolean;
    appointment_confirmed: boolean;
    tags_applied: string[];
  };
  summary: string;
}
