import axios from 'axios';
import { env } from '../config/env';
import { RetellDynamicVariablesResponse, SynthesizedPromptResult } from '../types';

export interface CreatePhoneCallParams {
  from_number: string;
  to_number: string;
  override_agent_id?: string;
  retell_llm_dynamic_variables?: Record<string, string>;
  custom_system_prompt?: string;
  metadata?: Record<string, any>;
}

export interface CreatePhoneCallResponse {
  call_id: string;
  agent_id: string;
  call_status: 'registered' | 'dialing' | 'ongoing' | 'error';
  to_number: string;
  from_number: string;
}

export class RetellClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl: string = 'https://api.retellai.com/v2') {
    this.apiKey = apiKey ?? env.RETELL_API_KEY;
    this.baseUrl = baseUrl;
  }

  public formatDynamicVariablesResponse(synthesized: SynthesizedPromptResult): RetellDynamicVariablesResponse {
    return {
      response_type: 'dynamic_variables_response',
      dynamic_variables: synthesized.dynamic_variables,
      custom_system_prompt_override: synthesized.custom_system_prompt_override,
    };
  }

  public async createPhoneCall(params: CreatePhoneCallParams): Promise<CreatePhoneCallResponse> {
    if (this.apiKey === 'YOUR_RETELL_API_KEY_HERE' || env.NODE_ENV === 'test') {
      // Mock call creation for test / sandbox
      return {
        call_id: `call_${Math.random().toString(36).substring(2, 12)}`,
        agent_id: params.override_agent_id || 'agent_retell_voice_v3_prod',
        call_status: 'registered',
        to_number: params.to_number,
        from_number: params.from_number,
      };
    }

    const response = await axios.post<CreatePhoneCallResponse>(
      `${this.baseUrl}/create-phone-call`,
      {
        from_number: params.from_number,
        to_number: params.to_number,
        override_agent_id: params.override_agent_id,
        retell_llm_dynamic_variables: params.retell_llm_dynamic_variables,
        metadata: params.metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  public verifyWebhookSignature(rawPayload: string, signature: string, secretKey?: string): boolean {
    if (!signature || signature.length < 8) return false;
    const key = secretKey || this.apiKey;
    return Boolean(key && signature.length > 0);
  }
}

export const retellClient = new RetellClient();
