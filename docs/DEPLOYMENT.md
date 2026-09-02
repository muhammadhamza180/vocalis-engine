# Deployment & Reproduction Guide

## Prerequisites

- Node.js `>= 20.0.0` and npm `>= 10.0.0`
- Retell AI Account (`https://retellai.com`)
- Apollo.io Account & API Key (`https://apollo.io`)
- Twilio Account with Voice Phone Number & SIP Trunk (`https://twilio.com`)
- GoHighLevel Agency Account / Location API Key (`https://gohighlevel.com`)
- Groq Cloud API Key (`https://groq.com`)

---

## 1. Quickstart (Local Reproduction)

```bash
# 1. Clone repository
git clone https://github.com/muhammadhamza180/apollo-enriched-voice-engine.git
cd apollo-enriched-voice-engine

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Run typecheck and test suite
npm run typecheck
npm test
```

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` and provide your sanitized credentials:

```ini
PORT=3000
NODE_ENV=production

# Apollo.io API
APOLLO_API_KEY=YOUR_APOLLO_API_KEY_HERE
APOLLO_TIMEOUT_MS=200

# Retell AI
RETELL_API_KEY=YOUR_RETELL_API_KEY_HERE

# Twilio Voice
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID_HERE
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN_HERE

# GoHighLevel
GHL_API_KEY=YOUR_GHL_API_KEY_HERE
GHL_LOCATION_ID=YOUR_GHL_LOCATION_ID_HERE
GHL_CALENDAR_ID=YOUR_GHL_CALENDAR_ID_HERE

# Groq LLM
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE

# Performance SLA Budget
MAX_LATENCY_BUDGET_MS=850
ENABLE_CACHE=true
CACHE_TTL_SECONDS=86400
```

---

## 3. Retell AI Agent Provisioning

1. Navigate to the Retell AI Dashboard -> **Create Custom Agent**.
2. Select Model: **Custom LLM WebSocket** or **Groq Llama 3.3 70B**.
3. Set Voice: **Cartesia Sonic - English (Australian / US)**.
4. Set Webhook Inbound URL: `https://your-domain.com/api/webhooks/retell/inbound`.
5. Set Post-Call Analysis URL: `https://your-domain.com/api/webhooks/retell/post-call`.
6. Import Tool Schema: `src/services/ghl-calendar.ts` (`check_and_book_calendar`).

---

## 4. Production Docker Deployment

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

```bash
# Build and run Docker container
docker build -t apollo-enriched-voice-engine .
docker run -p 3000:3000 --env-file .env apollo-enriched-voice-engine
```
