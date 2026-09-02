import axios from 'axios';
import { env } from '../config/env';
import { ApolloEnrichInput, ApolloMatchResponse, FirmographicContext } from '../types';

interface CacheEntry {
  data: FirmographicContext;
  expiresAt: number;
}

export class ApolloEnricher {
  private cache = new Map<string, CacheEntry>();
  private timeoutMs: number;
  private apiKey: string;
  private enableCache: boolean;
  private cacheTtlMs: number;

  constructor(options?: { timeoutMs?: number; apiKey?: string; enableCache?: boolean; cacheTtlSeconds?: number }) {
    this.timeoutMs = options?.timeoutMs ?? env.APOLLO_TIMEOUT_MS;
    this.apiKey = options?.apiKey ?? env.APOLLO_API_KEY;
    this.enableCache = options?.enableCache ?? env.ENABLE_CACHE;
    this.cacheTtlMs = (options?.cacheTtlSeconds ?? env.CACHE_TTL_SECONDS) * 1000;
  }

  public getCacheKey(input: ApolloEnrichInput): string {
    return (input.email || input.domain || input.phone || input.company_name || 'unknown').toLowerCase().trim();
  }

  public getFallbackProfile(input: ApolloEnrichInput, latencyMs: number = 0): FirmographicContext {
    const firstName = input.first_name || 'Founder';
    const lastName = input.last_name || '';
    const company = input.company_name || (input.domain ? input.domain.split('.')[0] : 'your business');

    return {
      lead_first_name: firstName,
      lead_last_name: lastName,
      lead_job_title: 'Growth Leader / Decision Maker',
      company_name: company,
      employee_count: '10-50',
      annual_revenue: '$1M-$5M',
      current_cms: 'WooCommerce / Modern Stack',
      technologies: ['CRM', 'Cloud', 'E-Commerce'],
      market_location: 'Melbourne, Australia',
      estimated_traffic_drop: '15-20%',
      inferred_pain_point: 'Manual lead triage, checkout friction, and CRM data sync latency',
      rep_calendar_link: 'https://hamzabuildai.com/discovery',
      is_fallback: true,
      enrichment_latency_ms: latencyMs,
    };
  }

  public setCache(key: string, data: FirmographicContext): void {
    this.cache.set(key.toLowerCase().trim(), {
      data,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  public async enrichLead(input: ApolloEnrichInput): Promise<FirmographicContext> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(input);

    // 1. Check in-memory cache
    if (this.enableCache && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;
      if (Date.now() < entry.expiresAt) {
        const cachedResult: FirmographicContext = {
          ...entry.data,
          enrichment_latency_ms: Date.now() - startTime,
        };
        return cachedResult;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    // 2. Perform API request with strict timeout defense
    try {
      if (this.apiKey === 'YOUR_APOLLO_API_KEY_HERE' || env.NODE_ENV === 'test') {
        // Fast mock resolution for test/sandbox mode
        const latencyMs = Date.now() - startTime;
        const profile = this.getFallbackProfile(input, latencyMs);
        if (this.enableCache) {
          this.cache.set(cacheKey, {
            data: profile,
            expiresAt: Date.now() + this.cacheTtlMs,
          });
        }
        return profile;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await Promise.race([
        axios.post<ApolloMatchResponse>(
          'https://api.apollo.io/v1/people/match',
          {
            api_key: this.apiKey,
            email: input.email,
            first_name: input.first_name,
            last_name: input.last_name,
            organization_name: input.company_name,
            domain: input.domain,
          },
          {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
          }
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Apollo API timeout exceeded')), this.timeoutMs)
        ),
      ]);

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (response && response.data && (response.data.person || response.data.organization)) {
        const person = response.data.person || {};
        const org = person.organization || response.data.organization || {};

        const enriched: FirmographicContext = {
          lead_first_name: person.first_name || input.first_name || 'Founder',
          lead_last_name: person.last_name || input.last_name || '',
          lead_job_title: person.title || 'Executive',
          company_name: org.name || input.company_name || 'your business',
          employee_count: org.estimated_num_employees ? String(org.estimated_num_employees) : '38',
          annual_revenue: org.annual_revenue_printed || (org.estimated_num_employees && org.estimated_num_employees > 50 ? '$10M+' : '$4.5M'),
          current_cms: this.inferCms(org.technologies),
          technologies: org.technologies || ['WooCommerce', 'PostgreSQL', 'GoHighLevel'],
          market_location: [org.city, org.state || org.country].filter(Boolean).join(', ') || 'Melbourne, Australia',
          estimated_traffic_drop: '18%',
          inferred_pain_point: 'Catalog indexing speed and WooCommerce checkout drop-off',
          rep_calendar_link: 'https://hamzabuildai.com/discovery',
          is_fallback: false,
          enrichment_latency_ms: latencyMs,
        };

        if (this.enableCache) {
          this.cache.set(cacheKey, {
            data: enriched,
            expiresAt: Date.now() + this.cacheTtlMs,
          });
        }

        return enriched;
      }

      // No match found -> Fallback
      const fallback = this.getFallbackProfile(input, latencyMs);
      if (this.enableCache) {
        this.cache.set(cacheKey, {
          data: fallback,
          expiresAt: Date.now() + this.cacheTtlMs,
        });
      }
      return fallback;
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      const fallback = this.getFallbackProfile(input, latencyMs);
      if (this.enableCache) {
        this.cache.set(cacheKey, {
          data: fallback,
          expiresAt: Date.now() + this.cacheTtlMs,
        });
      }
      return fallback;
    }
  }

  public inferCms(technologies?: string[]): string {
    if (!technologies || technologies.length === 0) return 'WooCommerce';
    const techLower = technologies.map(t => t.toLowerCase());
    if (techLower.includes('shopify')) return 'Shopify Plus';
    if (techLower.includes('woocommerce') || techLower.includes('wordpress')) return 'WooCommerce';
    if (techLower.includes('magento') || techLower.includes('adobe commerce')) return 'Adobe Magento';
    if (techLower.includes('bigcommerce')) return 'BigCommerce';
    return technologies[0] || 'WooCommerce';
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheSize(): number {
    return this.cache.size;
  }
}

export const apolloEnricher = new ApolloEnricher();
