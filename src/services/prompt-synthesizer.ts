import { FirmographicContext, LeadInfo, SynthesizedPromptResult } from '../types';

export class PromptSynthesizer {
  public synthesizePrompt(context: FirmographicContext, leadInfo?: LeadInfo): SynthesizedPromptResult {
    const startTime = Date.now();
    const cadence = leadInfo?.regional_cadence || 'au_australian';

    // 12 dynamic variables extraction
    const dynamicVariables: Record<string, string> = {
      first_name: context.lead_first_name,
      last_name: context.lead_last_name,
      decision_maker_title: context.lead_job_title,
      company_name: context.company_name,
      employee_count: context.employee_count,
      annual_revenue: context.annual_revenue,
      current_cms: context.current_cms,
      technologies_list: context.technologies.slice(0, 5).join(', '),
      market_location: context.market_location,
      estimated_traffic_drop: context.estimated_traffic_drop,
      inferred_pain_point: context.inferred_pain_point,
      rep_calendar_link: context.rep_calendar_link,
    };

    let openingPitch = '';
    if (cadence === 'au_australian') {
      openingPitch = `"Hi ${context.lead_first_name}, Hamza here from Growth Media in Melbourne—saw your team at ${context.company_name} recently expanded your ${context.current_cms} catalog with ~${context.employee_count} staff. We noticed a few crawl optimization bottlenecks costing 12-18% in checkout conversions. Do you have 90 seconds to see how we resolved this for similar Melbourne brands?"`;
    } else {
      openingPitch = `"Hi ${context.lead_first_name}, this is Sarah calling from Muhammad Hamza's engineering office. I noticed you submitted an inquiry regarding automated architectures for ${context.company_name}. I see you're scaling with ${context.employee_count} team members. Did I catch you at an okay moment for a quick 60 seconds?"`;
    }

    const systemPrompt = `
<system_identity>
You are Sarah, an elite Senior Technical Solutions Specialist representing Muhammad Hamza's AI Engineering Studio (HamzaBuildai.com).
Your objective: Conduct a polite, authoritative, and consultative 2-minute discovery call to qualify the inbound prospect, address immediate workflow bottlenecks, and schedule a 30-minute Architecture Feasibility Session on Hamza's calendar.

Key Voice Traits:
- Tone: Crisp, professional, confident, consultative (never robotic, never salesy).
- Pacing: Natural conversational pauses, concise responses (1-2 sentences maximum per turn to minimize audio latency).
- Interruption Handling: If the prospect speaks while you are talking, immediately cease output and listen.
</system_identity>

<firmographic_context>
<!-- Injected dynamically at runtime via Apollo.io Enrichment Pipeline -->
- Prospect Name: ${context.lead_first_name} ${context.lead_last_name}
- Job Title: ${context.lead_job_title}
- Company Name: ${context.company_name}
- Estimated Annual Revenue: ${context.annual_revenue}
- Employee Headcount: ${context.employee_count}
- Target Market / Location: ${context.market_location}
- Detected CMS / E-Commerce Stack: ${context.current_cms}
- Associated Technologies: ${dynamicVariables.technologies_list}
- Inferred Bottleneck: ${context.inferred_pain_point}
- Calendar Booking Link: ${context.rep_calendar_link}
</firmographic_context>

<call_flow_protocol>
1. OPENING (Speed-to-Lead <60s):
   ${openingPitch}

2. CONTEXTUAL VALUE DROP:
   "We engineered a real-time headless sync for a ${context.current_cms} brand that recovered 18% in lost checkouts and automated their entire lead routing into GoHighLevel. What is the single biggest bottleneck your team is looking to eliminate this quarter?"

3. DYNAMIC OBJECTION HANDLING MATRIX:
   - Price / Cost Objection: "Our architectures are milestone-based and engineered for immediate ROI. During our 30-minute feasibility audit, Hamza maps the exact token economics and labor savings before any contract is signed."
   - 'Send an Email Instead': "I can definitely send over a direct technical summary! However, Hamza only accepts 3 new architecture sprints per month. Would Thursday at 2:00 PM or Friday morning work better to hold your spot?"
   - 'Will this break in production?': "Every system Hamza builds is backed by in-memory Redis session caching, deterministic state machines, and a 30-day post-launch warranty."
   - 'WooCommerce Scale Limits': "We bypass WooCommerce PHP bottlenecks using event-driven WebSockets and edge workers, keeping catalog lookups under 40ms even under peak traffic."

4. CALENDAR APPOINTMENT LOCKING:
   - Use the check_and_book_calendar tool to verify availability in GoHighLevel / Cal.com.
   - Confirm timezone, prospect email (${leadInfo?.email || 'verified on file'}), and lock slot.
</call_flow_protocol>
`.trim();

    const latencyMs = Date.now() - startTime;

    return {
      response_type: 'dynamic_variables_response',
      dynamic_variables: dynamicVariables,
      custom_system_prompt_override: systemPrompt,
      synthesis_latency_ms: latencyMs,
      metadata: {
        is_fallback: context.is_fallback,
        regional_cadence: cadence,
        variables_count: Object.keys(dynamicVariables).length,
      },
    };
  }
}

export const promptSynthesizer = new PromptSynthesizer();
