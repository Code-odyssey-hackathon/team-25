# 🎤 JanaSetu Pitch: Tech Stack & Architecture

When judges ask "What tech stack did you use and why?", here is how to answer confidently and professionally:

## 1. The Core Stack (Frontend & Framework)

**"We built JanaSetu using Next.js 14 with the App Router, written in TypeScript, and styled with Tailwind CSS and Shadcn UI."**

*   **Why Next.js?** "We needed a platform that is extremely fast on mobile devices, SEO-friendly for public dashboards, and capable of handling both server-side logic (for secure API routes) and client-side interactivity (for maps). Next.js Server Components allowed us to securely integrate the Gemini SDK without exposing API keys to the browser, while keeping the initial page load blazing fast for citizens on poor network connections."
*   **Why Tailwind + Shadcn UI?** "In a 24-hour hackathon, we couldn't waste time writing custom CSS from scratch, but we also didn't want a generic 'bootstrap' look. Shadcn UI gave us highly accessible, unstyled primitives (like Radix) that we rapidly customized with our own 'civic-tech indigo' design system. It allowed us to build complex components like the Bottom Sheet and Tabs in minutes while maintaining a premium feel."

## 2. The Backend & Database

**"For our backend, we chose Supabase as our complete Backend-as-a-Service, leveraging its PostgreSQL database, Authentication, and Storage."**

*   **Why Supabase / PostgreSQL?** "A grievance platform is inherently geospatial. We needed a robust relational database, not just a NoSQL document store. Supabase gives us raw PostgreSQL, allowing us to use powerful extensions like `pgcrypto` for secure IDs and standard relational modeling for Reports, Upvotes, and Assignments. It also provides built-in Row Level Security (RLS) so citizens can only edit their own reports, but admins can see everything."
*   **Why Supabase Storage?** "We needed a scalable place to store photo evidence and resolution proofs. Supabase Storage integrates natively with our database, making it seamless to link image URLs to report records."

## 3. AI & Intelligence (The Differentiator)

**"The core intelligence of JanaSetu is powered by Google's Gemini 1.5 Flash via the `@google/generative-ai` SDK."**

*   **Why Gemini 1.5 Flash?** "Speed and multimodal capabilities. When a citizen uploads a photo of a pothole or garbage dump, we don't just store the image. We pass it to Gemini Flash to automatically classify the issue (e.g., 'water_leak' vs 'road_damage'), assess its visual severity, and generate a concise summary. We specifically chose the 'Flash' model over 'Pro' because it provides near-instantaneous multimodal inference, ensuring the user experience isn't bottlenecked while waiting for the AI."

## 4. Maps & Geospatial Data

**"For location services, we integrated Leaflet with React-Leaflet."**

*   **Why Leaflet?** "It's lightweight, open-source, and perfectly handles the geospatial aspect of our app. We implemented custom marker clustering to handle dense areas of reports (like a city center) without freezing the browser, and used the browser's Geolocation API combined with EXIF data extraction from photos to ensure accurate report placement."

---

### 💡 The "TL;DR" 30-Second Elevator Pitch Answer:

> *"We used Next.js for a fast, mobile-first frontend. We chose Supabase because it gives us a real PostgreSQL database with Row Level Security, which is crucial for handling complex relationships between citizens, workers, and reports. Finally, we integrated Google Gemini 1.5 Flash for its incredibly fast multimodal AI, allowing us to instantly analyze photos of civic issues to automatically classify categories and assign severity scores without manual triage."*
