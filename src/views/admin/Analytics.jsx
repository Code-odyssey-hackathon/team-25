import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Analytics() {
  const { loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/admin/login')
  }, [authLoading, isAdmin, router])

  useEffect(() => {
    if (isAdmin) {
      async function fetchReports() {
        try {
          const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false })
          if (error) throw error
          setReports(data || [])
        } catch (err) {
          console.error(err)
        } finally {
          setReportsLoading(false)
        }
      }
      fetchReports()
    }
  }, [isAdmin])

  if (authLoading || reportsLoading) {
    return <div className="page-container"><div className="loader"><div className="spinner"></div></div></div>
  }
  if (!isAdmin) return null

  const totalReports = reports.length
  const actionedReports = reports.filter(r => r.status === 'ACTION_TAKEN')
  const avgResponseDays = actionedReports.length > 0
    ? Math.round(actionedReports.reduce((sum, r) => {
        const filed = new Date(r.created_at)
        const responded = new Date(r.responded_at || r.created_at)
        return sum + Math.max(0, Math.floor((responded - filed) / 86400000))
      }, 0) / actionedReports.length)
    : 0

  // Chart 3: Reports over time (last 6 months)
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthName = d.toLocaleString('default', { month: 'short', year: '2-digit' })
    const count = reports.filter(r => {
      const rd = new Date(r.created_at)
      return `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}` === monthKey
    }).length
    monthlyData.push({ name: monthName, reports: count })
  }

  const tooltipStyle = {
    contentStyle: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' },
    labelStyle: { color: '#94a3b8' }
  }

  return (
    <div className="page-container">
      <div className="flex-between" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>📊 Analytics</h1>
        <button className="btn-primary" onClick={() => router.push('/admin/dashboard')}>← Back to Dashboard</button>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid-2" style={{ marginBottom: '3rem' }}>
        <div className="card-dark">
          <div className="stat-number text-orange" style={{ fontSize: '3.5rem' }}>{totalReports}</div>
          <div className="stat-title text-orange">Total Reports</div>
        </div>
        <div className="card-dark">
          <div className="stat-number text-green" style={{ fontSize: '3.5rem' }}>{avgResponseDays}d</div>
          <div className="stat-title text-green">Avg Response Time</div>
        </div>
      </div>

      {/* Row 3: Area Chart */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Reports Over Time (Last 6 Months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="reports" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#gradientRed)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
