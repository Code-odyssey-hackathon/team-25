JanaVaani "Voice Of The People"
Unified AI-Powered Civic Grievance Intelligence Platform

India processes 29.23 lakh citizen grievances annually. The current system treats 50 complaints about the same broken road as 50 separate tickets. This project collapses them into 1 actionable government ticket — in real-time, across 22 languages, with zero DPDPA liability.
---
The Problem
What Is Broken Today
Platform	Critical Failure
CPGRAMS (Central)	No semantic deduplication. 50 identical complaints = 50 separate tickets. Officers drown manually.
PG Portal / MyGov	Static form submissions. Zero AI. No multilingual parsing. Data sits in silos.
State CM Helplines	Phone-based only. No structured data extraction. No cross-complaint correlation.
Samadhan (MP)	Department-wise routing works but no clustering or predictive intelligence.
UMANG App	Service aggregator, not a grievance intelligence system. No NLP layer.
Twitter/X Govt Handles	Unstructured. No SLA enforcement. Not integrated with official systems.
Quantified Pain Points
Problem	Data
Scale	29.23 lakh grievances filed in 2024 alone (DARPG Annual Report)
Semantic Duplication	Est. 30–40% of tickets are duplicates of the same infrastructure failure
Manual Hours Wasted	GROs spend 40+ hrs/week reading, translating & categorizing repetitive complaints
Language Barrier	Citizens file in 22 scheduled languages. No real-time NLP translation exists today.
DPDPA Risk	Raw PII (names, phones) processed without anonymization — active legal liability
No Predictive Intelligence	No system today predicts which infrastructure will fail next month
No Citizen Feedback Loop	Citizen has zero real-time visibility once a complaint is filed
---
Our Solution
A two-layer system covering both ends — citizen submission and government processing.
Layer	Component	Users
Layer 1 — Citizen	JanaVaani	All citizens across India
Layer 2 — Government	NextGen CPGRAMS Semantic Engine + GRO Dashboard	Grievance Officers, IAS, Bureaucrats
Bridge	LangGraph + Bhashini API + ChromaDBl	Fully automated — no manual handoff
---
Layer 1: JanaSetu 2.0 — Citizen Interface
Progressive Web App. Works on any device. No app store download required.
Voice Report
Citizen speaks in English, Hindi, or Kannada
Bhashini STT transcribes in real-time
AI auto-parses: Category, Location, Severity
One-tap submit — no typing required
City Pulse Map
Live heatmap showing complaint density by ward
Color-coded severity: Red (critical) → Yellow (moderate) → Green (resolved)
Predictive Infrastructure AI
Analyses historical complaint patterns by ward
Forecasts infrastructure failure probability for next 30 days
Example: Ward 7 — 73% flood probability if drainage unaddressed
Civic Trust Score
Each citizen gets a score based on report accuracy and verification
Prevents spam and false reports from polluting the system
Blockchain Audit Ledger
Every complaint status change is cryptographically sealed
Citizens verify their complaint on-chain with a hash ID
Zero official tampering possible
Civic Rewards
Points earned for verified reports, upvotes, resolution confirmations
Redeemable for government service perks
Civic AI Chat
Conversational assistant for complaint status, escalation queries, officer contacts
Auto-escalation if SLA is breached: "Escalate to Divisional Commissioner"
SOS Emergency Button
One-tap emergency report with GPS auto-tagging
Notifies nearest government office instantly
---
Layer 2: NextGen CPGRAMS — Government Backend
Six-stage AI pipeline. Runs silently. The officer only sees the final actionable output.
Stage	Process	Technology
1. Ingestion	Raw complaint stream ingested via API or CSV	FastAPI async endpoint
2. Translation	Non-English text normalized to English/Hindi	Bhashini Anuvaad API (22 languages)
3. PII Stripping	Names, phones, Aadhaar removed before AI processing	SpaCy NER + Regex — DPDPA 2023 compliant
4. Embeddings	Sanitized text converted to semantic vectors	Llama-3-8B via Ollama (runs locally)
5. Clustering	Similar complaints mathematically merged above similarity threshold	ChromaDB + FAISS cosine similarity
6. GRO Dashboard	50 raw tickets → 1 Master Ticket card for the officer	Next.js 16.2 + React 19 + shadcn/ui v2
Before this system: Officer sees 50 tickets in 5 languages about the same pothole.
After this system:
```
MASTER TICKET — CRITICAL: Road Collapse | MG Road, Sector 4
50 citizen reports merged | Cluster confidence: 94.7% | Assign to: PWD Department
```
---
Escalation Hierarchy
Escalation is fully automated by the LangGraph state machine. No human decides when to escalate.
Level	Authority	SLA Window	Escalation Trigger
L1	Ward Officer / Gram Panchayat Secretary	48 hours	Unresolved OR cluster size > 10 reports
L2	Municipal Corporation / Nagar Nigam GRO	72 hours	Unresolved OR same issue across 3+ wards
L3	District Collector (IAS)	5 working days	50+ report cluster OR AI risk score critical
L4	Divisional Commissioner (IAS)	7 working days	Same issue in 3+ districts
L5	State Social Welfare / Urban Development Minister	14 working days	Issue in 5+ districts OR statewide AI emergency flag
L6	Central Ministry / DARPG	30 working days	Cross-state systemic failure OR CM office escalation
Data compiled at each escalation level:
Ward → Municipal: Master ticket + anonymized complaint cluster + GPS heatmap + citizen photos + timestamps
Municipal → DC: Above + unique citizens affected + department responsible + SLA breach duration + sentiment score
DC → Div. Commissioner: Above + cross-ward pattern analysis + predictive risk score + budget spent vs. allocated
Div. Commissioner → Minister: Above + district-wise resolution rate + worst performing departments + AI policy recommendation
Minister → Central Ministry: Full state report — grievance heatmap, top 10 systemic failures, ministry-wise compliance %, YoY trend
Life-safety override: If Llama-3-8B classifies a complaint as a life-safety risk (collapsed bridge, contaminated water supply), the system bypasses L1–L3 and escalates directly to L4–L5 regardless of cluster size or SLA.
---
Tech Stack
Layer	Technology	Reason
Frontend	Next.js 16.2 + React 19 + Vite 7	SSR + Turbopack — fastest Time-to-URL
UI Components	Tailwind CSS 4 + shadcn/ui v2	Accessible, enterprise-grade components
Backend	FastAPI (Python 3.12)	Async-first, built for AI/ML workloads
AI Orchestration	LangGraph	Deterministic state-machine graphs with human-in-the-loop oversight
Translation	Bhashini Anuvaad API	Government-approved, all 22 scheduled Indian languages
Speech-to-Text	Bhashini STT (Vakyansh)	Trained on Indian accents and dialects
PII Anonymization	SpaCy NER + Regex	DPDPA 2023 compliant, runs locally — no cloud PII exposure
Embeddings	Llama-3-8B via Ollama	Runs fully offline, no API cost, Wi-Fi-proof
Vector Database	ChromaDB + FAISS	Local, in-memory, sub-10ms similarity search
Blockchain Audit	Hyperledger Fabric (lightweight node)	Permissioned chain, no gas fees, tamper-proof audit trail
Predictive AI	Prophet + scikit-learn	Time-series forecasting for infrastructure failures
Dev Environment	Anti-Gravity IDE (Google)	Autonomous agent-driven boilerplate — maximizes 36-hr window
---
Architecture Flow
```
Citizen (JanaVaani )
        │
        ▼
\[Voice / Text Input] ──► Bhashini STT + Anuvaad API (Translation)
        │
        ▼
\[SpaCy NER + Regex] ──► PII Stripped — DPDPA Compliant
        │
        ▼
\[LangGraph Agent] ──► Llama-3-8B (Semantic Embedding Generation)
        │
        ▼
\[ChromaDB + FAISS] ──► Cosine Similarity Clustering
        │
    ┌───┴───┐
    │       │
New Cluster  Existing Cluster
    │       │
    └───┬───┘
        │
        ▼
\[Next.js GRO Dashboard] ──► Master Ticket (N reports merged)
        │
        ▼
\[LangGraph SLA Timer] ──► Auto-Escalation Ladder (L1 → L6)
        │
        ▼
\[Hyperledger Fabric] ──► Every state change sealed on-chain
        │
        ▼
Citizen notified ──► Complaint verified on blockchain
```
---
Compliance
Standard	Status
DPDPA 2023	PII stripped before any AI processing. No personal data in vector DB.
Bhashini Policy	Government-approved NLP infrastructure. No foreign LLM dependency for translation.
Right to Information Act	Blockchain ledger provides immutable evidence trail for RTI requests.
NIC Cloud Policy	Architecture deployable on NIC/MeitY cloud with minimal configuration changes.
WCAG 2.1 Accessibility	Voice-first design removes literacy and language barriers.
---

---
Project Structure
```
JanVaani-cpgrams/
├── frontend/               # Next.js 16.2 GRO Dashboard
│   └── JanVaani/           # PWA Citizen Interface
├── backend/
│   ├── api/                # FastAPI endpoints
│   ├── pipeline/           # LangGraph orchestration
│   │   ├── translate.py    # Bhashini integration
│   │   ├── pii\_strip.py    # SpaCy NER anonymizer
│   │   ├── embed.py        # Llama-3-8B embeddings
│   │   └── cluster.py      # ChromaDB + FAISS
│   └── escalation/         # SLA timer + auto-escalation nodes
├── blockchain/             # Hyperledger Fabric node config
├── predictive/             # Prophet + sklearn forecasting models
└── data/                   # Sample grievance CSV (demo)
```
---
Impact
Metric	Expected Outcome
GRO Triage Time	40 hrs/week → under 4 hrs/week per officer
Duplicate Complaints Eliminated	Est. 8–12 lakh redundant tickets collapsed annually
Language Coverage	22 scheduled languages — 850M+ citizens covered
Resolution Speed	Master tickets processed 6× faster than individual tickets
Corruption Prevention	100% of status changes on immutable ledger
Predictive Window	Ward-level failure forecast 30 days in advance
