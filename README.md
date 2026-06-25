# Real-Time Financial Analytics Dashboard & Autonomous AI Agent

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014--App%20Router-black?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI--Async-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TailwindCSS](https://img.shields.io/badge/UI_Framework-Tailwind%20CSS%20v3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript--Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

This is a high-performance financial intelligence web platform. It combines engaging client-side dashboards with an autonomous AI Financial Agent. The architecture connects live web application memory directly with Large Language Models (LLMs). This change turns a static chat window into a nimble, context-aware quantitative analyst that can analyze complex market data in real time.

---

## Architectural Deep-Dive & Core Concept

Most financial chatbots have serious limitations. They cannot react to changing market conditions. Mixing Western financial formats (`%`, `$`) with Right-to-Left (RTL) Arabic text often disrupts document layout in modern rendering engines.

This platform overcomes these issues with an **Isomorphic State Injection Pipeline**. It connects dynamic UI interactions to live backend processing.

### 1. Isomorphic Dynamic Routing Context (`/[ticker]`)
The client-side interface uses Next.js to maintain scoped encapsulation. When a user visits a specific stock workspace asset route (for example, `/aapl` or `/nvda`), the system captures the dynamic slug using Next.js `useParams()`.
* **Isolated Analytical Persona:** When a valid `ticker` state is detected, it instantly changes the AI Agent's global system prompt. The agent shifts from a general market strategist to a focused asset equity analyst for that single ticker.
* **Global Macro-Mode:** Returning to the root route (`/`) cancels the local parameter instance and automatically reverts the mindset to an overarching macroeconomic strategist.

### 2. Client-State Telemetry Hydration
Instead of relying on outdated, pre-trained parameters or asking for manual inputs, every user message automatically reflects the current state of the frontend. When executed, a detailed `stock_data` object is processed and included in the request payload.

The backend receives a multi-dimensional financial stream featuring:
* **Valuation Multiples:** Trailing P/E, Forward P/E, Price-to-Book ($P/B$) ratios.
* **Risk & Volatility Vectors:** Beta coefficient tracking systemic index correlation.
* **Liquidity & Solvency Ratios:** Debt-to-Equity ratios, total cash flow, and precise Free Cash Flow ($FCF$) calculations.
* **Target Sentiment Aggregations:** Estimated short-term upside percentages, institutional analyst average target values, and fundamental recommendation keys (`buy`, `hold`, `sell`).

### 3. Bidirectional Text Rendering Engineering
Combining metrics like negative changes (`-0.41%`) or dollar values with right-to-left Arabic text can disrupt standard DOM layouts.

This platform fixes this layout issue at the software engineering level using clear serialization rules:
* **String Segmentation Rules:** The system prevents the AI from issuing raw symbols (like `بنسبة %`). It ensures numerical calculations are contained within predictable boundaries.
* **Frontend Locale Isolation:** The chat bubble UI engine isolates incoming message structures, automatically styling numeric content within separate typographic boundaries (e.g., `<span dir="ltr" className="font-bold text-emerald-600">85%</span>`). This guarantees smooth readability throughout the UI.

### 4. Synchronous DB-Coupled Rate Limiting
To avoid exhausting token budgets, the assistant uses a responsive database-linked locking system:
* **Lifecycle Connections:** Opening the chat viewport (`isOpen === true`) triggers an immediate async call to `/api/services/ai/chat/limit`.
* **Stateful DOM Mutations:** The user's remaining query total is tracked in the component state (`requestsLeft`). If this number reaches zero, the frontend locks the input elements and changes placeholders to alerts, interrupting downstream API processing.

### 5. Multi-Turn Memory Persistence
The web client tracks conversation state arrays sequentially (`{ role: "user" | "assistant", content: string }`). With each input, the entire chat array is structured neatly in the payload's `history` field, providing ongoing context without relying on server-side session management or temporary caching.

---

## Tech Stack Matrix

| Architecture Layer | Core Technology | Primary Engineering Responsibility |
| :--- | :--- | :--- |
| **Frontend Platform** | **Next.js 14+ (App Router)** | Server-Side Rendering (SSR), route state encapsulation, isomorphic hydration hooks. |
| **Styling Architecture** | **Tailwind CSS + Tailwind Animate** | Micro-interactions, dynamic dark-mode settings, and responsive sizing control. |
| **State & Networking** | **React Hooks + Axios Instance** | Context preservation, viewport locking (`useRef`), and centralized request handling. |
| **Backend Core** | **FastAPI (Python) / Async Node.js** | Schema validation, high-concurrency routing, and payload parsing. |
| **AI Processing Layer** | **Advanced LLM Gateways** | Payload-driven inference execution, financial reasoning, and structured data processing. |

---

## Structural Code Design

```text
├── frontend/                     # Next.js Production Core Bundle
│   ├── public/                   # Static Performance Assets & Branding Vectors
│   └── src/
│       ├── app/                  # File-system Declarative Routing Map
│       │   ├── page.tsx          # Macro-Market Summary Dashboard Container
│       │   └── [ticker]/         # Dynamic Isolated Stock Workspace Layouts
│       ├── components/           # Atomic & Composite UI Elements
│       │   └── AiChatBot.tsx     # Extended 32vw Fixed Contextual AI Workspace
│       └── lib/
│           └── api.ts            # Configured Global Axios Instance
└── backend/                      # High-Concurrency Service Routing Matrix
    ├── app/
    │   ├── routes/               # API Endpoint Mapping Routing Controllers
    │   └── services/             # Ingestion Architecture & Context-Aware Prompt Factories
    |   |__ run.py                # runs the server with watchflies and uvicorn and works for all servers with no problems
    └── .env.example              # Decentralized Global Token Outlines
```