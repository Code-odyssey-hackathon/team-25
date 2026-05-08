# 📝 Product Requirements Document (PRD): JanaVaani (Full System Edition)

## 1. Project Overview

* **Project Name:** JanaVaani
* **Mission:** To bridge the gap between citizens and local governance using AI, transparency, and community-driven prioritization.
* **Problem Statement:** Indian municipal grievance systems are fragmented, opaque, and slow. This creates a dual failure: citizens lose trust due to a lack of visibility, and governments waste time and budget on inefficient labor allocation and duplicated efforts.

---

## 2. Target Audience & Personas

### A. The Concerned Citizen (Ravi)

* **Goal:** To report a pothole or garbage overflow quickly and see it fixed.
* **Pain Point:** Frustrated by complex government websites and "black hole" systems with zero status updates.

### B. The Government Admin (Officer Suman)

* **Goal:** To triage hundreds of reports efficiently and assign them to the right team.
* **Pain Point:** Overwhelmed by duplicate reports and lacks geospatial data to determine which issues are critical infrastructure threats.

### C. The Field Worker (Basavaraj)

* **Goal:** To receive clear tasks on his phone and provide verified proof of completion.
* **Pain Point:** Relies on messy paper trails, unorganized phone calls, and lacks a streamlined way to prove work was done.

---

## 3. Functional Requirements (FRs)

### 🟢 FR1: AI-Powered Smart Reporting (The Intake Engine)

* Users can capture a photo of a civic issue via a mobile-optimized web interface.
* System automatically extracts GPS coordinates from image metadata or device location.
* **AI Classification:** Gemini 1.5 Flash analyzes the image to identify the category (Pothole, Water Leak, Garbage, etc.) and auto-generates a suggested "Priority Score" based on visual severity.

### 🟡 FR2: Community Social Signal (The "Me Too" Engine)

* Users can view an interactive map of nearby active issues.
* **Deduplication:** Instead of creating a duplicate report for the same pothole, citizens can click a "Me Too" button to upvote an existing report.
* **Dynamic Scoring:** Upvotes directly and dynamically increase the issue's "Priority Score," forcing the community's biggest problems to the top of the Admin's queue.

### 🔵 FR3: The Public Accountability Dashboard (The Operations Hub)

* **Leaderboards:** Public ranking of Wards and Municipal Departments based on average SLA (Service Level Agreement) resolution times.
* **Geospatial Heatmaps:** Visualizing problem clusters across the city to identify infrastructure decay.
* **Before/After Gallery:** A publicly visible ledger of resolved issues, providing cryptographic-level visual proof of government work.

### 🔴 FR4: The Last-Mile Notification System (Worker Dispatch)

* **Automated Dispatch:** Integration with the Twilio API to send SMS task alerts directly to field workers' mobile phones.
* **Status Lifecycle:** Workers update the task status (`Acknowledged` -> `In Progress` -> `Resolved`) directly from their device.
* **Resolution Verification:** Closing a task strictly requires the worker to upload a "Proof of Completion" photo to the database.

---

## 4. Non-Functional Requirements (NFRs)

* **Performance:** Map interface must render in < 2 seconds, utilizing Marker Clustering to handle 1000+ simultaneous issue pins.
* **Security:** Strict implementation of Supabase Row Level Security (RLS) to ensure citizens can only edit their own data, while Admins have global read/write access.
* **Accessibility:** Multi-language UI support (English, Hindi, Kannada) for inclusive reporting.
* **Mobile-First:** The citizen and field worker interfaces must function as a Progressive Web App (PWA) for seamless mobile browser use.

---

## 5. Success Metrics

* **Metric 1:** Reduction in average resolution time (SLA tracking from report to resolution).
* **Metric 2:** Citizen Engagement Rate (Measured by the ratio of "Me Too" upvotes vs. new distinct reports).
* **Metric 3:** Triage Efficiency (Reduction in duplicate reports reaching the Admin dashboard via map visibility).

---

## 6. Future Roadmap

* **Predictive Maintenance:** AI analyzing recurring issues (e.g., repeated water leaks in one grid) to predict imminent infrastructure failure.
* **Blockchain Verification:** Immutable ledger records of government resolutions for complete, tamper-proof transparency.
* **Direct Citizen Messaging:** WhatsApp/Chat interface between citizens and assigned workers for real-time site coordination.

---

### The Reality Check for Hack Phase I

Code Odyssey check-in is starting right now. Hack Phase I kicks off at 2:00 PM.

Since you are committing to the *entire* PRD, your execution has to be flawless.

* **Vaibhav:** Let the Antigravity IDE handle the UI shell, the Map clustering (FR2), and the Heatmaps (FR3).
* **Nilam:** Supabase is going to be heavy. She needs to set up the `reports`, `users`, and `upvotes` tables immediately, plus the RLS policies.
* **Preetam:** Needs to wire Gemini 1.5 Flash to the upload component (FR1) and get Twilio SMS (FR4) working.
* **Metali:** Needs to take this exact text and turn it into a beautiful, aggressive pitch deck for the 5:00 PM Mentoring session.