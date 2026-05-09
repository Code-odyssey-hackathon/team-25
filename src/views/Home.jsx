import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { FLAGS } from '../lib/features'
import { getReports } from '../lib/reports'
import { getRainfall } from '../lib/weather'
import { SkeletonText, SkeletonCard, SkeletonList, SkeletonLocationCard } from '../components/Skeleton'


const createMarkerIcon = (status, score) => {
  const statusLower = status.toLowerCase();
  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `<div class="custom-marker marker-${statusLower}">${score}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

function FlyTo({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (coords) map.flyTo(coords, 13, { duration: 1.2 })
  }, [coords, map])
  return null
}

function HeatmapLayer({ reports, active }) {
  if (!active) return null;
  const statusColor = { DANGEROUS: '#ef4444', WARNING: '#f97316', PENDING: '#f59e0b', ACTION_TAKEN: '#10b981' };
  return (
    <>
      {reports.map(r => {
        const color = statusColor[r.severity] || '#94a3b8';
        const radius = r.severity === 'DANGEROUS' ? 5000 : r.severity === 'WARNING' ? 4000 : 3000;
        const opacity = r.severity === 'DANGEROUS' ? 0.35 : r.severity === 'WARNING' ? 0.28 : 0.18;
        return (
          <Circle
            key={`heat-${r.id}`}
            center={[r.lat, r.lng]}
            radius={radius}
            pathOptions={{
              fillColor: color,
              fillOpacity: opacity,
              stroke: false,
              color: 'transparent',
            }}
          />
        );
      })}
    </>
  );
}

function WeatherBadge({ lat, lng }) {
  const [weather, setWeather] = useState(null)
  useEffect(() => { getRainfall(lat, lng).then(setWeather).catch(() => {}) }, [lat, lng])
  if (!weather || !weather.description) return null
  const riskColor = { LOW: '#10b981', MODERATE: '#f59e0b', HIGH: '#f97316', EXTREME: '#ef4444' }
  return (
    <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: '#f0f4f8', borderRadius: 6, fontSize: '0.8rem', color: '#333' }}>
      🌧️ {weather.rainfall_mm}mm/day · {weather.temperature}°C
      <span style={{ marginLeft: '0.4rem', fontWeight: 700, color: riskColor[weather.riskLevel] || '#555' }}>{weather.riskLevel}</span>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('ALL')
  const [flyCoords, setFlyCoords] = useState(null)
  const [heatmapMode, setHeatmapMode] = useState(false)
  const [userLocation, setUserLocation] = useState([15.3173, 75.7139]) 

  useEffect(() => {
    getReports({ limit: 100 })
      .then(setReports)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.log('Geolocation error:', error.message)
          // Keep using default location if geolocation fails
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    }
  }, [])

  const centerPosition = userLocation
  const districts = ['ALL', ...new Set(reports.map(r => r.city).filter(Boolean))]
  let filtered = reports
  if (filter !== 'ALL') filtered = filtered.filter(r => r.severity === filter)
  if (district !== 'ALL') filtered = filtered.filter(r => r.city === district)
  if (search.trim()) filtered = filtered.filter(r => (r.location_name || '').toLowerCase().includes(search.toLowerCase()))
  const borderColor = { DANGEROUS: '#ef4444', WARNING: '#f97316', PENDING: '#f59e0b', ACTION_TAKEN: '#10b981' }
  function handleCardClick(r) {
    setFlyCoords([r.lat, r.lng])
    // No bridge detail page in civil infra, maybe go to report detail?
  }

  if (loading) return (
    <div className="home-layout" style={{ paddingTop: 'calc(var(--nav-height) + 36px)' }}>
      <div className="sidebar">
        <div className="sidebar-header" style={{ textAlign: 'left' }}>
          <SkeletonText width='60%' height='1.5rem' style={{ marginBottom: '0.5rem' }} />
          <SkeletonText width='40%' height='0.9rem' />
          <SkeletonCard height='40px' style={{ marginTop: '1rem', borderRadius: '8px' }} />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} height='32px' width='60px' style={{ borderRadius: '20px' }} />
            ))}
          </div>
        </div>
        <div className="location-list">
          <SkeletonList count={6} renderItem={() => <SkeletonLocationCard />} />
        </div>
      </div>
      <div className="map-container">
        <SkeletonCard height='100%' style={{ borderRadius: 0 }} />
      </div>
    </div>
  )

  if (error) return (
    <div className="page-container">
      <div className="card-red" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <p>Failed to load location data. Please refresh the page.</p>
        <p className="text-gray" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{error.message}</p>
      </div>
    </div>
  )

  return (
    <>
      <div className="home-layout" style={{ paddingTop: 'calc(var(--nav-height) + 36px)' }}>
        <div className="sidebar">
          <div className="sidebar-header" style={{ textAlign: 'left' }}>
            <h2>Reported Issues</h2>
            <p className="text-gray">{filtered.length} reports · {reports.filter(r => r.severity === 'DANGEROUS').length} critical</p>
            <input className="form-input" placeholder="🔍 Search location..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginTop: '0.75rem', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }} />
            <select className="form-input" value={district} onChange={e => setDistrict(e.target.value)} style={{ marginTop: '0.5rem', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}>
              {districts.map(d => <option key={d} value={d}>{d === 'ALL' ? '— All Cities —' : d}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {['ALL', 'DANGEROUS', 'WARNING', 'PENDING'].map(f => (
                <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
              <button className={heatmapMode ? 'btn-primary' : 'filter-btn'} onClick={() => setHeatmapMode(m => !m)} style={{ marginLeft: 'auto' }}>
                🔥 {heatmapMode ? 'ON' : 'Heatmap'}
              </button>
            </div>
          </div>

          <div className="location-list">
            {filtered.length > 0 ? filtered.map(r => (
              <div key={r.id} className="location-card" style={{ borderLeft: `3px solid ${borderColor[r.severity] || '#94a3b8'}`, textAlign: 'left' }} onClick={() => handleCardClick(r)}>
                <div className="location-name">{r.location_name || 'Generic Location'}</div>
                <div className="location-area">{r.city}, {r.state}</div>
                <div className="flex-between">
                  <span className={`risk-badge status-${(r.severity || 'pending').toLowerCase()}`}>
                    <div className="pulse-dot"></div>{r.issue_type}
                  </span>
                </div>
              </div>
            )) : <p className="text-gray" style={{ textAlign: 'center', marginTop: '2rem' }}>No reports found.</p>}
          </div>
        </div>

        <div className="map-container">
          <MapContainer center={centerPosition} zoom={8} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FlyTo coords={flyCoords} />
            <HeatmapLayer reports={reports} active={heatmapMode} />
            {!heatmapMode && (
                filtered.map(r => (
                  <Marker key={r.id} position={[r.lat, r.lng]} icon={createMarkerIcon(r.severity || 'PENDING', r.severity === 'DANGEROUS' ? 99 : 50)}>
                    <Popup>
                      <div style={{ padding: '0.5rem', minWidth: '220px' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#111' }}>{r.issue_type}</h3>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#555', fontSize: '0.9rem' }}>{r.location_name}</p>
                        <p style={{ margin: '0 0 0.25rem 0' }}><strong>Severity:</strong> <span style={{ color: borderColor[r.severity], fontWeight: 'bold' }}>{r.severity}</span></p>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.85rem' }}>{r.description}</p>
                        <WeatherBadge lat={r.lat} lng={r.lng} />
                      </div>
                    </Popup>
                  </Marker>
                ))
            )}
          </MapContainer>
        </div>
      </div>
    </>
  )
}
