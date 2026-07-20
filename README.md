# 🤖 AI Assistant for Small Businesses

A WhatsApp / web AI assistant that answers customer questions 24/7 and **captures
qualified leads** (name + service + contact) for the business owner to close.

Built as a productized service: each business gets its own assistant, powered by
its own knowledge base — no generic answers, no hallucinated data.

> **Live demo (web):** run locally (see below) → `http://localhost:3000`

---

## ✨ Key features

- **Business-aware** — answers strictly from the business's own info (hours,
  services, payment methods). Never invents data.
- **Anti-hallucination guardrails** — if it doesn't know something, it says so and
  offers a human handoff, instead of making things up.
- **Lead capture, not just chat** — on price questions or booking requests it
  **collects the customer's data and hands off to a human** (the business closes
  the sale). The bot qualifies; people close.
- **Natural, on-brand tone** — configurable voice (here: Rioplatense Spanish).
- **Secret-safe by design** — the LLM API key lives server-side only, never in the
  browser.

## 🧱 Tech stack

- **Node.js + Express** — lightweight backend / API proxy
- **Groq (LLaMA 3.3 70B)** — fast, low-cost LLM inference
- **Vanilla JS front-end** — WhatsApp-style chat UI (zero dependencies)
- *(Roadmap: Supabase for per-business config + lead storage, n8n for WhatsApp)*

## 🏗️ How it works

```
Customer (WhatsApp / web)
        │
        ▼
   Express server ──► builds the prompt:  SYSTEM (the "brain")
        │                                 + business knowledge base
        │                                 + conversation history
        ▼
   Groq LLM ──► generates the reply
        │
        ▼
   Server ──► sends the reply back
        └──► on a booking/price lead → stores it + notifies the owner  (roadmap)
```

The heart of the product is the **system prompt** (`server.js`) — the instructions
that turn a generic LLM into a reliable, on-brand employee with hard rules.

## 🚀 Run locally

```bash
# 1. install
npm install

# 2. add your Groq API key (free at https://console.groq.com)
cp .env.example .env
#    then edit .env and paste your key

# 3. start
npm start
# → http://localhost:3000
```

## 🔒 Security note

API keys are **never** exposed to the client. The browser talks to *our* server;
only the server holds the key (loaded from `.env`, which is git-ignored). This is a
deliberate design choice, not an afterthought.

## 🗺️ Roadmap

- [ ] Per-business configuration (Supabase) — onboard clients without code changes
- [ ] Persist captured leads + notify the owner (email / WhatsApp)
- [ ] WhatsApp Business API integration (n8n)
- [ ] Owner dashboard (view leads, edit business info)

---

Built by **Bruno Sapia** · Full-stack developer · [NexusDev](https://www.nexusdev.com.ar)
