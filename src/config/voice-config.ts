export interface VoiceEngineConfig {
  agent_id: string;
  agent_name: string;
  sample_rate: number;
  stt_provider: 'deepgram-nova-2';
  stt_language: 'en-US' | 'en-AU' | 'en-GB';
  llm_provider: 'groq-llama-3.3-70b-versatile';
  llm_temperature: number;
  tts_provider: 'cartesia-sonic';
  tts_voice_id: string;
  voice_speed: number;
  interruption_sensitivity: number; // 0.0 to 1.0
  ambient_noise_cancellation: boolean;
  target_ttft_ms: number;
  sla_ceiling_ttft_ms: number;
  regional_cadences: {
    au_australian: {
      opener_tone: string;
      timezone: string;
      accent: string;
      slang_adaptation: string;
    };
    us_enterprise: {
      opener_tone: string;
      timezone: string;
      accent: string;
      slang_adaptation: string;
    };
  };
}

export const voiceConfig: VoiceEngineConfig = {
  agent_id: 'agent_retell_voice_v3_prod',
  agent_name: 'Sarah - Technical Solutions Specialist',
  sample_rate: 24000,
  stt_provider: 'deepgram-nova-2',
  stt_language: 'en-AU',
  llm_provider: 'groq-llama-3.3-70b-versatile',
  llm_temperature: 0.35,
  tts_provider: 'cartesia-sonic',
  tts_voice_id: 'voice_sonic_en_au_consultant_v1',
  voice_speed: 1.05,
  interruption_sensitivity: 0.85,
  ambient_noise_cancellation: true,
  target_ttft_ms: 750,
  sla_ceiling_ttft_ms: 850,
  regional_cadences: {
    au_australian: {
      opener_tone: "Warm, direct, consultative Melbourne business tone",
      timezone: "Australia/Melbourne",
      accent: "Australian Business Executive",
      slang_adaptation: "G'day / Hi Sarah, Hamza here from Growth Media in Melbourne...",
    },
    us_enterprise: {
      opener_tone: "Polite, authoritative, enterprise solution advisor tone",
      timezone: "America/New_York",
      accent: "US Neutral Professional",
      slang_adaptation: "Hi Sarah, this is Sarah from Muhammad Hamza's engineering office...",
    },
  },
};
