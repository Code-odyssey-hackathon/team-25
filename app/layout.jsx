'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import NavProfileLink from '@/components/NavProfileLink';
import './globals.css';

export default function RootLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="India's first citizen-powered bridge safety accountability network. Report damage, track risk scores, and hold authorities accountable." />
        <meta property="og:title" content="JanaVaani — India's Bridge Safety Platform" />
        <meta property="og:description" content="Government says 42 collapses. Reality says 170+. We built the system that makes both lies impossible." />
        <meta property="og:url" content="https://JanaVaani-six.vercel.app" />
        <meta name="theme-color" content="#0a0a0f" />
        <title>JanaVaani — India's Bridge Safety Platform</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <nav className="navbar">
              <div className="brand" onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
                <span style={{ fontSize: '1.2rem' }}>🌉</span> JanaVaani
              </div>
              <button className="hamburger" onClick={() => setMenuOpen(m => !m)}>
                {menuOpen ? '✕' : '☰'}
              </button>
              <div className={`nav-links${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)}>
                <Link href="/map" className="nav-item">Live Map</Link>
                <Link href="/truth" className="nav-item">Truth Counter</Link>
                <Link href="/feed" className="nav-item">Reports Feed</Link>
                <Link href="/leaderboard" className="nav-item">Leaderboard</Link>
                <Link href="/report" className="btn-primary">Report Damage</Link>
                <NavProfileLink />
              </div>
            </nav>

            {children}

            <script dangerouslySetInnerHTML={{
              __html: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');`
            }} />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
