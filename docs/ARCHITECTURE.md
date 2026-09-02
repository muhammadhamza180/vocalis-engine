# Voice Engine Architecture & Sequence Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           INBOUND CALL & TELEPHONY LAYER                                │
│                                                                                         │
│   [Prospect Phone] ──(PSTN)──> [Twilio Voice SIP] ──(Bi-directional WS)──> [Retell AI]  │
└────────────────────────────────────────────────┬────────────────────────────────────────┘
                                                 │
                                     HTTP POST /api/webhooks/retell/inbound
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                      APOLLO-ENRICHED PROMPT SYNTHESIS ENGINE                            │
│                                                                                         │
│   ┌───────────────────────────┐         ┌───────────────────────────────────────────┐   │
│   │ ApolloEnricher (<200ms)   │         │ PromptSynthesizer (<35ms)                 │   │
│   │ ├── In-Memory Cache (35ms)│ ──────> │ ├── 12 Dynamic Firmographic Variables     │   │
│   │ ├── Apollo People Match   │         │ ├── Regional Cadence (AU / US)            │   │
│   │ └── Graceful Fallback     │         │ └── Dynamic Objection Matrix              │   │
│   └───────────────────────────┘         └─────────────────────┬─────────────────────┘   │
└───────────────────────────────────────────────────────────────┼─────────────────────────┘
                                                                │
                                              Dynamic Variables Response (Retell LLM)
                                                                │
                                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          REAL-TIME VOICE STREAMING ENGINE                               │
│                                                                                         │
│   [Deepgram Nova-2 STT] (165ms) ──> [Groq Llama 3.3 70B] (190ms) ──> [Cartesia Sonic]   │
│                                          │                                (140ms)       │
│                                          ▼ (Tool Call)                                  │
│                             [GHL Calendar Booking Tool]                                 │
└────────────────────────────────────────────────┬────────────────────────────────────────┘
                                                 │
                                     HTTP POST /api/webhooks/retell/post-call
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                       POST-CALL ANALYTICS & CRM SYNC MESH                               │
│                                                                                         │
│   ├── Sentiment Scoring (0.0 - 1.0)                                                     │
│   ├── Lead Score Increment (+15 Booked / +8 Qualified)                                  │
│   ├── GoHighLevel Contact Custom Fields & Tag Update                                    │
│   └── TTFT SLA Compliance Audit (<850ms Verification)                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Webhook Lifecycle Sequence

### 1. Inbound Call Initiation & Dynamic Variable Injection
```
Prospect          Twilio Voice          Retell AI          Engine Webhook          Apollo.io API
   │                   │                    │                     │                      │
   │── Inbound Call ──>│                    │                     │                      │
   │                   │── SIP Stream ─────>│                     │                      │
   │                   │                    │── POST /inbound ───>│                      │
   │                   │                    │                     │── Match Domain/Phone>│
   │                   │                    │                     │<── Firmographics ────│
   │                   │                    │                     │  (or Fallback <200ms)│
   │                   │                    │                     │                      │
   │                   │                    │<── Dynamic Prompt ──│                      │
   │                   │<── Audio Stream ───│    Variables JSON   │                      │
   │<── Spoken Voice ──│                    │                     │                      │
```

### 2. Live Tool Calling (GoHighLevel Calendar Appointment)
```
Prospect             Retell AI (LLM)         GHL Calendar Service         CRM Calendar
   │                        │                         │                        │
   │ "Thursday 10am works" ─>│                         │                        │
   │                        │── Tool Call: book_cal ──>│                        │
   │                        │   (slot_time, email)    │── Reserve Slot ───────>│
   │                        │                         │<── Appointment ID ─────│
   │                        │<── Booking Confirmed ───│                        │
   │<── "Invite sent!" ─────│                         │                        │
```

### 3. Post-Call Analysis & Telemetry Webhook
```
Retell AI (Post-Call)               Engine Webhook                 GHL CRM / Audit
       │                                  │                               │
       │── POST /post-call ──────────────>│                               │
       │   (transcript, latency_metrics,  │                               │
       │    disposition: booked)          │── Calculate Sentiment Score ──│
       │                                  │── Audit TTFT SLA (685ms) ─────│
       │                                  │── Update Contact Score (+18) ─>│
       │<── HTTP 200 OK ──────────────────│                               │
```
