Project Overview: AI-Powered Financial & Stock Analyst
A high-performance, real-time financial dashboard integrated with an adaptive AI analytical agent. The system is designed to ingest live market telemetry and deliver instant, data-driven trading assessments without relying on generic, open-ended templates.

Core Architecture & Logic Breakdown:
Dual-Context System Prompting: The core engine operates on a smart conditional router. When a user queries from a specific stock page, the backend dynamically constructs an isolation context targeting that ticker. If the user asks a broad market query from the main dashboard, the routing logic falls back to a macro-market strategist personality.

State-Aware Data Injection: Unlike basic chatbots that query static knowledge, this application injects an active runtime payload (stock_data) into the LLM context wrapper on every transaction. This payload streams live technical indicators including Trailing/Forward P/E ratios, Price-to-Book values, Beta volatility metrics, and calculated upside potentials.

RTL Orientation & Percentage Parsing Guardrails: To resolve standard browser engine layout rendering bugs with Right-to-Left (RTL) Arabic text combined with Western numerical symbols (like % and $), the system enforces strict string serialization rules in the prompt layer, ensuring zero "empty template" loops.

Stateful Memory & Session Hydration: The component syncs local state array histories directly into the API invocation payload (history). This preserves contextual multi-turn memory without over-allocating server-side session overhead.

Token Consumption Management & Rate-Limiting: Integrated with a reactive tracking hook that synchronizes with the database layer to decrement user quotas dynamically per API request, safely reflecting the token-burn budget directly to the client interface.