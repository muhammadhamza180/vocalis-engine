import dotenv from 'dotenv';
dotenv.config();

export interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  APOLLO_API_KEY: string;
  RETELL_API_KEY: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  GHL_API_KEY: string;
  GHL_LOCATION_ID: string;
  GHL_CALENDAR_ID: string;
  GROQ_API_KEY: string;
  APOLLO_TIMEOUT_MS: number;
  MAX_LATENCY_BUDGET_MS: number;
  ENABLE_CACHE: boolean;
  CACHE_TTL_SECONDS: number;
}

export function getEnvConfig(): EnvConfig {
  return {
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    APOLLO_API_KEY: process.env.APOLLO_API_KEY || 'YOUR_APOLLO_API_KEY_HERE',
    RETELL_API_KEY: process.env.RETELL_API_KEY || 'YOUR_RETELL_API_KEY_HERE',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID_HERE',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN_HERE',
    GHL_API_KEY: process.env.GHL_API_KEY || 'YOUR_GHL_API_KEY_HERE',
    GHL_LOCATION_ID: process.env.GHL_LOCATION_ID || 'YOUR_GHL_LOCATION_ID_HERE',
    GHL_CALENDAR_ID: process.env.GHL_CALENDAR_ID || 'YOUR_GHL_CALENDAR_ID_HERE',
    GROQ_API_KEY: process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE',
    APOLLO_TIMEOUT_MS: parseInt(process.env.APOLLO_TIMEOUT_MS || '200', 10),
    MAX_LATENCY_BUDGET_MS: parseInt(process.env.MAX_LATENCY_BUDGET_MS || '850', 10),
    ENABLE_CACHE: process.env.ENABLE_CACHE !== 'false',
    CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '86400', 10),
  };
}

export const env = getEnvConfig();
