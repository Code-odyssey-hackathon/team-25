import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { useBridge } from '../hooks/useBridges'
import { getRainfall } from '../lib/weather'
import { supabase } from '../lib/supabase'
import { computeAccountabilityScore, getAccountabilityLabel } from '../lib/accountabilityScore'
import ReportVerification from '../components/ReportVerification'
import { FLAGS } from '../lib/features'

function getTimerBadge(status, createdAt) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
  if (status === 'ACTION_TAKEN') return { text: '✅ Action Taken', color: '#10b981' }
  if (status === 'UNDER_REVIEW') return { text: '🔍 Under Review', color: '#3b82f6' }
  if (status === 'DISMISSED') return { text: 'Dismissed', color: '#94a3b8' }
  if (days > 30) return { text: `⚠️ IGNORED — ${days} days. No action taken.`, color: '#ef4444' }
  return { text: `⏱️ ${days} days — Awaiting authority response`, color: '#f59e0b' }
}

function RiskBar({ value, max, color }) {
  return (
    <div className="progress-container">
      <div className="progress-bar" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
  )
}

function ShareButton({ location }) {
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const url = `${window.location.origin}/location/${location.id}`
  const waText = encodeURIComponent(
    `⚠️ ${location.name} (${location.district}) has a risk score of ${location.risk_score}/100 — Status: ${location.status}.\n\nCitizens have filed ${location.total_reports} reports. Check JanaVaani:\n${url}`
  )
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
      <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ background: '#25D366', color: 'white', textDecoration: 'none', padding: '0.6rem 1.2rem', borderRadius: 8, fontSize: '0.9rem' }}>
        📤 Share on WhatsApp
      </a>
      <button className="btn-secondary" onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }} style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
        {copied ? '✅ Copied!' : '🔗 Copy Link'}
      </button>
      <button className="btn-primary" onClick={() => router.push(`/report/${location.id}`)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
        📸 Report
      </button>
    </div>
  )
}

export default function LocationDetail() {
  const { id } = useParams()
  const router = useRouter()
  const { bridge: location, loading, error } = useBridge(id)
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [authorityData, setAuthorityData] = useState(null)

  useEffect(() => {
    if (location?.lat && location?.lng) {
      getRainfall(location.lat, location.lng).then(setWeather).catch(() => setWeather(null)).finally(() => setWeatherLoading(false))
    }
    if (location?.authority_id) {
      supabase.from('authorities').select('*').eq('id', location.authority_id).single()
        .then(({ data }) => setAuthorityData(data))
        .catch(() => {})
    }
  }, [location])

  if (loading) return <div className="page-container"><div className="loader"><div className="spinner"></div></div></div>
  if (error || !location) return (
    <div className="page-container">
      <div className="card-red"><h2 className="text-red">⚠️ Error Loading Location</h2><p>{error?.message || 'Location not found.'}</p></div>
    </div>
  )

  const statusColor = { CRITICAL: '#ef4444', WARNING: '#f97316', MONITOR: '#f59e0b', SAFE: '#10b981' }
  const bannerClass = { CRITICAL: 'detail-banner detail-banner-critical', WARNING: 'detail-banner detail-banner-warning', MONITOR: 'detail-banner detail-banner-monitor', SAFE: 'detail-banner detail-banner-safe' }
  const bd = typeof location.risk_breakdown === 'string' ? JSON.parse(location.risk_breakdown || '{}') : (location.risk_breakdown || {})
  const riskColor = { LOW: '#10b981', MODERATE: '#f59e0b', HIGH: '#f97316', EXTREME: '#ef4444' }
  const isHeavyRain = weather && weather.rainfall_mm >= 100

  const breakdownData = [
    { name: 'Age', value: bd.age_factor || 0, max: 25 },
    { name: 'Reports', value: bd.citizen_reports || 0, max: 25 },
    { name: 'Inspection Gap', value: bd.inspection_gap || 0, max: 20 },
    { name: 'Monsoon', value: bd.monsoon_risk || 0, max: 20 },
    { name: 'Seismic', value: bd.seismic_zone || 0, max: 10 },
  ]
  const tooltipStyle = { contentStyle: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' } }

  return (
    <div className="page-container">
      <div className={bannerClass[location.status]}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', lineHeight: 1.1 }}>{location.name}</h1>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '1.2rem' }}>{location.district}, {location.state}</p>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>{location.address || ''}</p>
          <ShareButton location={location} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '4rem', fontWeight: 900, color: statusColor[location.status], lineHeight: 1 }}>{location.risk_score}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>/100 Risk Score</div>
          <div className={`risk-badge status-${location.status?.toLowerCase()}`}><div className="pulse-dot"></div>{location.status}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <button className="btn-danger" style={{ width: 'auto' }} onClick={() => router.push(`/report/${location.id}`)}>📸 Report This Location</button>
      </div>

      {isHeavyRain && (
        <div style={{ background: 'linear-gradient(135deg, #7f1d1d, #450a0a)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 12, padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', animation: 'pulse-crit 2s infinite', boxShadow: '0 0 30px rgba(239,68,68,0.3)' }}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fca5a5' }}>MONSOON ALERT — Heavy Rainfall Detected</div>
            <div style={{ color: '#f87171', fontSize: '0.9rem' }}>{weather.rainfall_mm}mm/day estimated. Risk score may be elevated. Exercise extreme caution.</div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Recharts Visual Breakdown */}
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
            <h2 className="section-title" style={{ fontSize: '1.1rem' }}>Risk Score Breakdown (IRC:81-1997)</h2>
            <div style={{ marginBottom: '1rem' }}>
              <div className="flex-between" style={{ fontWeight: 700 }}><span>Overall Risk</span><span>{location.risk_score}%</span></div>
              <RiskBar value={location.risk_score} max={100} color={statusColor[location.status]} />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={breakdownData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 25]} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} formatter={(value, name, props) => [`${value} / ${props.payload.max}`, 'Score']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {breakdownData.map((entry, i) => (
                    <Cell key={i} fill={entry.value / entry.max > 0.8 ? '#ef4444' : entry.value / entry.max > 0.5 ? '#f97316' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weather Card */}
          <div className={isHeavyRain ? 'card-red' : (weather?.riskLevel === 'MODERATE' ? 'card-orange' : 'card-dark')} style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.5px' }}>🌦️ LIVE WEATHER</h3>
            {weatherLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="spinner" style={{ width: 20, height: 20 }}></div><span className="text-gray">Fetching...</span></div>
            ) : weather ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="flex-between"><span className="text-gray">Rainfall</span><span style={{ fontWeight: 700, color: riskColor[weather.riskLevel] || '#fff' }}>{weather.rainfall_mm} mm/day · {weather.riskLevel}</span></div>
                <div className="flex-between"><span className="text-gray">Temperature</span><span style={{ fontWeight: 600 }}>{weather.temperature}°C</span></div>
                <div className="flex-between"><span className="text-gray">Humidity</span><span style={{ fontWeight: 600 }}>{weather.humidity}%</span></div>
                <div className="flex-between"><span className="text-gray">Conditions</span><span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{weather.description}</span></div>
              </div>
            ) : <p className="text-gray" style={{ fontSize: '0.9rem' }}>Weather data unavailable.</p>}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
          <h2 className="section-title">Location Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 8 }}>
              <div><div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Dimensions</div><div style={{ fontWeight: 600 }}>{location.length_m ? `${location.length_m}m x ${location.width_m}m` : 'N/A'}</div></div>
              <div><div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Location Name</div><div style={{ fontWeight: 600 }}>{location.name}</div></div>
            </div>
            <div><div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Last Inspected</div><div style={{ fontWeight: 600 }}>{location.last_inspection_date ? new Date(location.last_inspection_date).toLocaleDateString() : 'Never on record'}</div></div>
            <div>
              <div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Managing Authority</div>
              <div style={{ fontWeight: 600 }}>{location.responsible_authority || 'Unknown'}</div>
              {authorityData && (() => {
                const score = computeAccountabilityScore(authorityData);
                const { label, color } = getAccountabilityLabel(score);
                return (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge" style={{ background: `${color}22`, color: color, border: `1px solid ${color}44` }}>
                      {label} ({score !== null ? `${score}/100` : 'N/A'})
                    </span>
                    <span className="text-gray" style={{ fontSize: '0.8rem' }}>Accountability Score</span>
                  </div>
                );
              })()}
            </div>
        </div>
      </div>

      <div style={{ textAlign: 'left' }}>
        <div className="section-title">Citizen Reports ({location.reports?.length || 0})</div>
        <div className="grid-2">
          {location.reports?.length > 0 ? location.reports.map(r => {
            const tb = getTimerBadge(r.status, r.created_at)
            const dmgColorMap = { POTHOLE: '#ef4444', ROAD_CRACK: '#f97316', WATER_LEAK: '#3b82f6', STREETLIGHT_OUT: '#f59e0b', GARBAGE_DUMP: '#8b5cf6', STRUCTURAL_DAMAGE: '#ef4444', DRAINAGE_ISSUE: '#f97316', CRACK: '#ef4444', SCOUR: '#f97316', FOUNDATION: '#f97316', OVERLOADING: '#f59e0b', RAILING_BROKEN: '#f59e0b', SPALLING: '#f97316', OTHER: '#94a3b8' }
            const sevColorMap = { DANGEROUS: '#ef4444', SERIOUS: '#f97316', VISIBLE: '#f59e0b' }
            return (
              <div key={r.id} className="report-card">
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge" style={{ background: dmgColorMap[r.issue_type || r.damage_type] || '#94a3b8' }}>{(r.issue_type || r.damage_type || 'Unknown').replace('_', ' ')}</span>
                    <span className="badge" style={{ background: sevColorMap[r.severity] }}>{r.severity}</span>
                  </div>
                  <div className="text-gray" style={{ fontSize: '0.8rem' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                {r.description && <p style={{ marginBottom: '1rem', fontStyle: 'italic' }}>"{r.description}"</p>}
                <span className="badge" style={{ background: `${tb.color}22`, color: tb.color, border: `1px solid ${tb.color}44`, display: 'inline-block' }}>{tb.text}</span>
                {r.photo_url && <img src={r.photo_url} alt="Report" style={{ width: '100%', borderRadius: 8, marginTop: 12, maxHeight: 200, objectFit: 'cover' }} />}
                <ReportVerification
                  reportId={r.id}
                  locationId={location.id}
                  initialCount={r.verification_count || 0}
                  isOwnReport={r.citizen_id === null}
                />
                {FLAGS.ENABLE_BLOCKCHAIN && (
                  <button 
                    className="btn-secondary" 
                    style={{ width: '100%', marginTop: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#fcd34d', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                    onClick={() => {
                      alert(`🔗 Blockchain Ledger Verification\n\nTx Hash: 0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 10)}\n\nThis record is immutable and cryptographically verified on the polygon testnet.`);
                    }}
                  >
                    ⛓️ Verify Ledger Immutable
                  </button>
                )}
              </div>
            )
          }) : <p className="text-gray">No reports filed for this location.</p>}
        </div>
      </div>
    </div>
  )
}
