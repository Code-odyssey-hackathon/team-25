'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import NavProfileLink from '@/components/NavProfileLink';
import GlobalSOS from '@/components/GlobalSOS';
import './globals.css';

export default function RootLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="India's first citizen-powered safety accountability network. Report issues, track risk scores, and hold authorities accountable." />
        <meta property="og:title" content="JanaVaani — India's Safety Platform" />
        <meta property="og:description" content="Government says 42 collapses. Reality says 170+. We built the system that makes both lies impossible." />
        <meta property="og:url" content="https://JanaVaani-six.vercel.app" />
        <meta name="theme-color" content="#0a0a0f" />
        <title>JanaVaani — India's Safety Platform</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <nav className="navbar">
              <div className="brand" onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
                <span style={{ fontSize: '1.2rem' }}>🏢</span> JanaVaani
              </div>
              <button className="hamburger" onClick={() => setMenuOpen(m => !m)}>
                {menuOpen ? '✕' : '☰'}
              </button>
              <div className={`nav-links${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)}>
                <Link href="/map" className="nav-item">Live Map</Link>
                <Link href="/feed" className="nav-item">Reports Feed</Link>
                <Link href="/leaderboard" className="nav-item">Leaderboard</Link>
                <Link href="/report" className="btn-primary">Report Issue</Link>
                <NavProfileLink />
              </div>
            </nav>

            {children}
            <GlobalSOS />

            
              
            
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
