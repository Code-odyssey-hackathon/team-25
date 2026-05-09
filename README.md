<div align="center">
  <img src="public/favicon.svg" alt="JanaVaani Logo" width="120" height="120" />
  <h1>JanaVaani 🌉</h1>
  <p><strong>India's First AI-Powered Civic Infrastructure Safety Network</strong></p>

  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-19.2.5-007ACC?style=for-the-badge&logo=react" alt="React" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" /></a>
    <a href="https://huggingface.co/"><img src="https://img.shields.io/badge/HuggingFace-AI_Models-FFD21E?style=for-the-badge&logo=huggingface" alt="HuggingFace" /></a>
  </p>

  <em>"Empowering citizens to report infrastructure issues while enabling authorities to resolve them efficiently with AI."</em>
</div>

<br />

## 📖 Overview

**JanaVaani** is a comprehensive civic infrastructure reporting and management platform. It leverages state-of-the-art AI-powered image classification, duplicate detection, and real-time geolocation mapping to create a transparent accountability ecosystem for public infrastructure like roads, bridges, water supply, and more.

---

## ✨ Key Features

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🏠 Multi-Portal Architecture</h3>
      <ul>
        <li><strong>Citizen Portal:</strong> Anonymous reporting, live map view, and risk score tracking.</li>
        <li><strong>Authority Portal:</strong> Admin dashboard for PWD, municipal, and state officials.</li>
        <li><strong>Engineer Portal:</strong> Field task management and inspection updates.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🤖 AI-Powered Intelligence</h3>
      <ul>
        <li><strong>Image Classification:</strong> Automatic issue detection using Hugging Face models.</li>
        <li><strong>Duplicate Detection:</strong> CLIP embeddings automatically identify similar or duplicate reports.</li>
        <li><strong>Authenticity Verification:</strong> AI detection and EXIF extraction prevents fake reports.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>📍 Advanced Location Services</h3>
      <ul>
        <li><strong>Auto Geolocation:</strong> GPS coordinates with reverse geocoding via OpenStreetMap.</li>
        <li><strong>Interactive Maps:</strong> Real-time issue visualization using Leaflet.</li>
        <li><strong>Risk Scoring:</strong> Dynamic risk assessment based on severity.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>📊 Analytics & Reporting</h3>
      <ul>
        <li><strong>Real-time Dashboard:</strong> Live statistics, metrics, and trend analysis.</li>
        <li><strong>Leaderboard:</strong> Gamified citizen engagement.</li>
        <li><strong>Voice Reporting:</strong> Transcribe voice reports with AI parsing.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🔑 Live Demo & Credentials

To fully test the end-to-end workflow (Citizen → Authority → Engineer), use the following credentials on the live deployment:

**Authority / Admin Portal** (`/admin/login`)
- **Email:** `admin@pwd.karnataka.gov.in`
- **Password:** `password123`
- *Capabilities: Review reports, update statuses, and assign tasks to engineers.*

**Field Engineer Portal** (`/engineer/login`)
- **Email:** `engineer@pwd.karnataka.gov.in`
- **Password:** `password123`
- *Capabilities: View assigned tasks, update inspection statuses to COMPLETED.*

---

## 🛠️ Technical Stack

| Category | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 16.2.6 (App Router), React 19.2.5 |
| **Styling & UI** | Tailwind CSS, Lucide React (Icons), Glass Morphism |
| **Backend & DB** | Supabase (PostgreSQL), Edge Functions, Row Level Security |
| **AI & Machine Learning**| Hugging Face Inference API, CLIP ViT |
| **Mapping & Viz** | Leaflet, React-Leaflet, Recharts |
| **State & Forms** | React Hook Form, Zod (Validation) |

---

## 🚀 Getting Started

The platform is pre-configured to work with a **Cloud Supabase** instance, allowing you to start developing immediately without local database setup!

### 1. Prerequisites
- **Node.js** 18+
- **npm** or **yarn**

### 2. Installation & Setup

```bash
# Clone the repository
git clone https://github.com/your-username/team-25.git
cd team-25

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

> **Note:** Edit `.env` with your Supabase URL, Anon Key, and Hugging Face API keys.

### 3. Run the Development Server

```bash
npm run dev
```
Navigate to `http://localhost:3000` to see the application in action.

---

## 🗄️ Core Database Schema

Our robust PostgreSQL schema ensures data integrity and real-time synchronization:

- `users` / `authorities` / `engineers`: Role-based profiles and authentication.
- `reports`: The core table tracking civic infrastructure issues.
- `report_embeddings`: AI vector embeddings for identifying duplicate submissions.
- `master_tickets`: Unified issue tracking and resolution management.
- `upvotes` / `alerts`: Community engagement and notification systems.

---

## 🔒 Security & Privacy

- **Row Level Security (RLS):** Granular access controls ensuring users only access authorized data.
- **AI Fraud Prevention:** Blocks fake or tampered images via pixel-level AI validation.
- **Secure Sessions:** JWT-based authentication managed by Supabase.
- **Data Protection:** Zod input validation and parameterized queries against SQL injection.

---

## 🧪 Testing & Deployment

Ensure platform stability with our included test scripts:

```bash
# Verify Supabase connection
node supabase_health_check.mjs

# Validate deployment readiness
node deploy_readiness_check.mjs
```

### Production Deployment (Vercel)
```bash
npm i -g vercel
vercel --prod
```

---

## 🤝 Contributing

We welcome contributions! 
1. **Fork** the project.
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`).
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4. **Push** to the branch (`git push origin feature/AmazingFeature`).
5. **Open** a Pull Request.

---

<div align="center">
  <p>Built with ❤️ by <strong>Team 25</strong> for a safer tomorrow.</p>
</div>