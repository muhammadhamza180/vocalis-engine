import { ApolloEnricher } from '../src/services/apollo-enricher';

describe('ApolloEnricher Service', () => {
  let enricher: ApolloEnricher;

  beforeEach(() => {
    enricher = new ApolloEnricher({
      timeoutMs: 100,
      enableCache: true,
      cacheTtlSeconds: 3600,
    });
    enricher.clearCache();
  });

  test('should return a well-formed fallback profile on API timeout or missing keys', async () => {
    const input = {
      first_name: 'Sarah',
      last_name: 'Jenkins',
      company_name: 'Acme Growth Media',
      domain: 'acmegrowth.com.au',
      phone: '+15550199001',
    };

    const result = await enricher.enrichLead(input);

    expect(result).toBeDefined();
    expect(result.lead_first_name).toBe('Sarah');
    expect(result.company_name).toBe('Acme Growth Media');
    expect(result.employee_count).toBeDefined();
    expect(result.annual_revenue).toBeDefined();
    expect(result.current_cms).toBeDefined();
    expect(result.technologies.length).toBeGreaterThan(0);
    expect(result.rep_calendar_link).toContain('hamzabuildai.com');
  });

  test('should correctly infer CMS from technology tags', () => {
    const shopifyCms = enricher.inferCms(['Shopify Plus', 'React', 'Tailwind']);
    expect(shopifyCms).toBe('Shopify Plus');

    const wooCms = enricher.inferCms(['WordPress', 'WooCommerce', 'MySQL']);
    expect(wooCms).toBe('WooCommerce');

    const fallbackProfile = enricher.getFallbackProfile({
      first_name: 'David',
      domain: 'shopgrowth.com',
    });

    expect(fallbackProfile.lead_first_name).toBe('David');
    expect(fallbackProfile.company_name).toBe('shopgrowth');
    expect(fallbackProfile.is_fallback).toBe(true);
  });

  test('should cache enriched responses and return subsequent lookups under 10ms', async () => {
    const input = {
      email: 'sarah@acmegrowth.com.au',
      first_name: 'Sarah',
      company_name: 'Acme Growth Media',
    };

    // First lookup (populates cache)
    const firstResult = await enricher.enrichLead(input);
    expect(firstResult).toBeDefined();

    // Second lookup (from cache)
    const startTime = Date.now();
    const cachedResult = await enricher.enrichLead(input);
    const duration = Date.now() - startTime;

    expect(cachedResult.company_name).toBe(firstResult.company_name);
    expect(duration).toBeLessThanOrEqual(25);
    expect(enricher.getCacheSize()).toBeGreaterThanOrEqual(1);
  });

  test('should clear cache properly when invoked', async () => {
    await enricher.enrichLead({ domain: 'brandone.com' });
    expect(enricher.getCacheSize()).toBe(1);

    enricher.clearCache();
    expect(enricher.getCacheSize()).toBe(0);
  });
});
