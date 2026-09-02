import { PromptSynthesizer } from '../src/services/prompt-synthesizer';
import { FirmographicContext, LeadInfo } from '../src/types';

describe('PromptSynthesizer Service', () => {
  let synthesizer: PromptSynthesizer;

  beforeEach(() => {
    synthesizer = new PromptSynthesizer();
  });

  const mockContext: FirmographicContext = {
    lead_first_name: 'Sarah',
    lead_last_name: 'Connor',
    lead_job_title: 'Head of Growth',
    company_name: 'Acme Growth Media',
    employee_count: '38',
    annual_revenue: '$4.5M',
    current_cms: 'WooCommerce',
    technologies: ['WooCommerce', 'PostgreSQL', 'GoHighLevel', 'Klaviyo'],
    market_location: 'Melbourne, Australia',
    estimated_traffic_drop: '18%',
    inferred_pain_point: 'Catalog indexing speed and WooCommerce checkout drop-off',
    rep_calendar_link: 'https://hamzabuildai.com/discovery',
    is_fallback: false,
    enrichment_latency_ms: 32,
  };

  test('should synthesize prompt with all 12 dynamic variables', () => {
    const leadInfo: LeadInfo = {
      first_name: 'Sarah',
      email: 'sarah@acmegrowth.com.au',
      regional_cadence: 'au_australian',
    };

    const result = synthesizer.synthesizePrompt(mockContext, leadInfo);

    expect(result.response_type).toBe('dynamic_variables_response');
    expect(result.dynamic_variables.first_name).toBe('Sarah');
    expect(result.dynamic_variables.company_name).toBe('Acme Growth Media');
    expect(result.dynamic_variables.employee_count).toBe('38');
    expect(result.dynamic_variables.annual_revenue).toBe('$4.5M');
    expect(result.dynamic_variables.current_cms).toBe('WooCommerce');
    expect(result.dynamic_variables.market_location).toBe('Melbourne, Australia');
    expect(result.dynamic_variables.rep_calendar_link).toBe('https://hamzabuildai.com/discovery');
    expect(result.metadata.variables_count).toBe(12);
  });

  test('should inject Australian consultative cadence for Melbourne prospects', () => {
    const result = synthesizer.synthesizePrompt(mockContext, { regional_cadence: 'au_australian' });

    expect(result.custom_system_prompt_override).toContain('Hamza here from Growth Media in Melbourne');
    expect(result.custom_system_prompt_override).toContain('WooCommerce catalog');
    expect(result.custom_system_prompt_override).toContain('Sarah');
  });

  test('should inject US enterprise cadence when configured', () => {
    const result = synthesizer.synthesizePrompt(mockContext, { regional_cadence: 'us_enterprise' });

    expect(result.custom_system_prompt_override).toContain('Sarah calling from Muhammad Hamza');
    expect(result.custom_system_prompt_override).toContain('automated architectures');
  });

  test('should include dynamic objection handling matrix in prompt', () => {
    const result = synthesizer.synthesizePrompt(mockContext);

    expect(result.custom_system_prompt_override).toContain('Price / Cost Objection');
    expect(result.custom_system_prompt_override).toContain('Send an Email Instead');
    expect(result.custom_system_prompt_override).toContain('Will this break in production?');
    expect(result.custom_system_prompt_override).toContain('WooCommerce Scale Limits');
  });

  test('synthesis latency should be under 50ms', () => {
    const result = synthesizer.synthesizePrompt(mockContext);
    expect(result.synthesis_latency_ms).toBeLessThan(50);
  });
});
