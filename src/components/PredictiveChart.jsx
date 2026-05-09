import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function PredictiveChart({ data }) {
  // Mock data if none provided
  const plotData = data || [
    { day: 'Day 1', risk: 12 },
    { day: 'Day 5', risk: 15 },
    { day: 'Day 10', risk: 25 },
    { day: 'Day 15', risk: 40 },
    { day: 'Day 20', risk: 48 },
    { day: 'Day 25', risk: 75 },
    { day: 'Day 30', risk: 92 },
  ];

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 12, border: '1px solid var(--color-glass-border)' }}>
      <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>🔮</span> Predictive Infrastructure AI
      </h3>
      <p className="text-gray" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        30-day failure probability forecast based on historical wear and weather patterns.
      </p>
      <div style={{ height: 250, width: '100%' }}>
        <ResponsiveContainer>
          <AreaChart data={plotData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip 
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }}
              itemStyle={{ color: '#ef4444', fontWeight: 600 }}
            />
            <Area type="monotone" dataKey="risk" stroke="#ef4444" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
