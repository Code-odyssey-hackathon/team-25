/**
 * JanaVaani — K-GRM District Leaderboard
 * 
 * Karnataka district performance rankings based on K-GRM scoring formula:
 * DISTRICT_SCORE = (Resolution_Rate × 40) + (Speed_Bonus × 30) + (Quality × 20) - penalties
 * 
 * Also shows legacy authority leaderboard for backward compatibility.
 */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { computeAccountabilityScore, getAccountabilityLabel, computeDistrictScore, getDistrictLabel, getAvgResolutionHours } from '../lib/accountabilityScore';
import { FLAGS } from '../lib/features';
import { KARNATAKA_DISTRICTS } from '../lib/karnatakaDistricts';
import { SkeletonText, SkeletonCard } from '../components/Skeleton';

export default function Leaderboard() {
  const [authorities, setAuthorities] = useState([]);
  const [districtScores, setDistrictScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(FLAGS.ENABLE_KGRM_DISTRICT_LEADERBOARD ? 'districts' : 'authorities');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch authorities for legacy leaderboard
        const { data: authData, error: authError } = await supabase
          .from('authorities')
          .select('id, name, jurisdiction, role, total_actioned, total_ignored, created_at')
          .eq('is_active', true)
          .order('total_actioned', { ascending: false });

        if (!authError) {
          const withScores = (authData || []).map(a => {
            const score = computeAccountabilityScore(a);
            const label = getAccountabilityLabel(score);
            return { ...a, score: score ?? 0, label };
          }).sort((a, b) => b.score - a.score);
          setAuthorities(withScores);
        }

        // Fetch reports for K-GRM district scoring
        if (FLAGS.ENABLE_KGRM_DISTRICT_LEADERBOARD) {
          const { data: reports, error: repError } = await supabase
            .from('reports')
            .select('id, city, district_code, status, severity, priority, escalation_level, created_at, responded_at, citizen_rating')
            .order('created_at', { ascending: false });

          if (!repError && reports) {
            // Group by district (use master list to normalize variations like Hubli -> Dharwad)
            const districtMap = {};
            for (const r of reports) {
              let key = r.district_code;
              
              if (!key && r.city) {
                // Try to find matching district from master list
                const matched = KARNATAKA_DISTRICTS.find(d => 
                  d.name.toLowerCase() === r.city.toLowerCase() || 
                  r.city.toLowerCase().includes(d.name.toLowerCase()) ||
                  (r.city.toLowerCase().includes('hubli') && d.code === 'DWD')
                );
                key = matched?.code || r.city;
              }

              // Skip obvious test data or unknowns
              if (!key || key === 'Unknown' || key === 'Test City') continue;

              if (!districtMap[key]) districtMap[key] = [];
              districtMap[key].push(r);
            }

            // Compute K-GRM scores per district
            const scored = Object.entries(districtMap).map(([distKey, distReports]) => {
              const district = KARNATAKA_DISTRICTS.find(d => d.code === distKey || d.name === distKey);
              const total = distReports.length;
              const resolved = distReports.filter(r => r.status === 'ACTION_TAKEN').length;
              const resolvedWithinSLA = distReports.filter(r => {
                if (r.status !== 'ACTION_TAKEN' || !r.responded_at) return false;
                const hrs = (new Date(r.responded_at) - new Date(r.created_at)) / 3600000;
                return hrs <= 4; // K-GRM: 4 hour standard SLA
              }).length;
              const ratings = distReports.filter(r => r.citizen_rating).map(r => r.citizen_rating);
              const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 3;
              const rejected = distReports.filter(r => r.status === 'DISMISSED').length;
              const dcEscalations = distReports.filter(r => r.escalation_level === 'DC' || r.escalation_level === 'MINISTRY').length;
              const ministryEscalations = distReports.filter(r => r.escalation_level === 'MINISTRY').length;

              const { score, breakdown } = computeDistrictScore({
                totalComplaints: total,
                resolvedComplaints: resolved,
                resolvedWithinSLA,
                avgCitizenRating: avgRating,
                rejectedComplaints: rejected,
                dcEscalations,
                ministryEscalations,
              });

              const label = getDistrictLabel(score);
              const avgHours = getAvgResolutionHours(distReports);

              return {
                districtCode: distKey,
                districtName: district?.name || distKey,
                hasCorporation: district?.hasCorporation || false,
                dcPortal: district?.dcPortal || '',
                total,
                resolved,
                pending: total - resolved - rejected,
                avgHours,
                score,
                label,
                breakdown,
              };
            }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

            setDistrictScores(scored);
          }
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const medals = ['🥇', '🥈', '🥉'];
  const month = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          🏆 {tab === 'districts' ? 'Karnataka District Leaderboard' : 'Authority Leaderboard'}
        </h1>
        <p className="text-gray" style={{ fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
          {tab === 'districts' 
            ? `K-GRM performance rankings for ${month}. Districts scored on resolution rate, speed, citizen satisfaction, and escalation penalties.`
            : 'Government authorities ranked by responsiveness to citizen safety reports.'}
        </p>
      </div>

      {/* Tab Switcher */}
      {FLAGS.ENABLE_KGRM_DISTRICT_LEADERBOARD && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <button className={tab === 'districts' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('districts')} style={{ padding: '0.5rem 1.5rem' }}>
            🏛️ District Rankings
          </button>
          <button className={tab === 'authorities' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('authorities')} style={{ padding: '0.5rem 1.5rem' }}>
            👤 Authority Rankings
          </button>
        </div>
      )}

      {/* K-GRM District Leaderboard */}
      {tab === 'districts' && (
        <>
          {/* Stats Overview */}
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div className="card-dark">
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24' }}>
                {districtScores.filter(d => d.label.action === 'recognition').length}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Top Performers ★★★★+</div>
            </div>
            <div className="card-dark">
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f59e0b' }}>
                {districtScores.filter(d => d.label.action === 'none').length}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Average Performance</div>
            </div>
            <div className="card-dark">
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ef4444' }}>
                {districtScores.filter(d => d.label.action === 'warning' || d.label.action === 'notice').length}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Notice Issued</div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} height="100px" />)}
            </div>
          ) : districtScores.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <p className="text-gray">No district data available yet. Reports need to be submitted with district codes.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {districtScores.map((d, i) => (
                <div
                  key={d.districtCode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    background: i < 3 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${i < 3 ? d.label.color + '40' : 'rgba(255,255,255,0.05)'}`,
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', fontWeight: 800,
                    background: i < 3 ? d.label.color + '20' : 'rgba(255,255,255,0.05)',
                    color: i < 3 ? d.label.color : '#94a3b8',
                    flexShrink: 0,
                  }}>
                    {medals[i] || `#${i + 1}`}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1.1rem' }}>{d.districtName}</strong>
                      {d.hasCorporation && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>★ Corp</span>}
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                        background: d.label.color + '20', color: d.label.color, border: `1px solid ${d.label.color}40`,
                      }}>
                        {d.label.badge} {d.label.label}
                      </span>
                    </div>
                    <p className="text-gray" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {d.total} complaints · {d.resolved} resolved ({d.total > 0 ? Math.round(d.resolved / d.total * 100) : 0}%) · Avg {d.avgHours}hrs
                    </p>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: d.label.color }}>
                      {d.score ?? '—'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Score</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* K-GRM Formula Legend */}
          <div style={{
            marginTop: '2rem', padding: '1.5rem', borderRadius: '12px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>K-GRM Scoring Formula</h3>
            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem', color: '#94a3b8' }}>
              <p>📊 <strong>Resolution Rate (40%):</strong> Percentage of complaints resolved</p>
              <p>⚡ <strong>Speed Bonus (30%):</strong> Resolved within SLA deadline (4 hours)</p>
              <p>⭐ <strong>Quality Score (20%):</strong> Average citizen satisfaction rating (1-5 stars)</p>
              <p>⚠️ <strong>Penalties:</strong> DC Escalation (−5), Ministry Escalation (−20), Rejections (−10%)</p>
              <p>🎯 <strong>Ranges:</strong> 90+ Excellence | 80+ Star Performer | 70+ Commendable | 50+ Average | &lt;35 Notice Issued</p>
            </div>
          </div>
        </>
      )}

      {/* Legacy Authority Leaderboard */}
      {tab === 'authorities' && (
        <>
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div className="card-dark">
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24' }}>
                {authorities.filter(a => a.score >= 75).length}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Accountable (75+)</div>
            </div>
            <div className="card-dark">
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f97316' }}>
                {authorities.filter(a => a.score >= 25 && a.score < 75).length}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Needs Improvement</div>
            </div>
            <div className="card-dark">
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ef4444' }}>
                {authorities.filter(a => a.score < 25).length}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>At Risk (&lt;25)</div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} height="100px" />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {authorities.map((a, i) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
                    borderRadius: '12px',
                    background: i < 3 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${i < 3 ? a.label.color + '40' : 'rgba(255,255,255,0.05)'}`,
                  }}
                >
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', fontWeight: 800,
                    background: i < 3 ? a.label.color + '20' : 'rgba(255,255,255,0.05)',
                    color: i < 3 ? a.label.color : '#94a3b8', flexShrink: 0,
                  }}>
                    {medals[i] || `#${i + 1}`}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1.1rem' }}>{a.name}</strong>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                        background: a.label.color + '20', color: a.label.color, border: `1px solid ${a.label.color}40`,
                      }}>
                        {a.label.label}
                      </span>
                    </div>
                    <p className="text-gray" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {a.role?.replace('_', ' ')} · {a.jurisdiction ? Object.values(a.jurisdiction).flat().slice(0, 2).join(', ') : 'Karnataka'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: a.label.color }}>
                      {a.score}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Score</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{
            marginTop: '2rem', padding: '1.5rem', borderRadius: '12px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>How We Calculate Scores</h3>
            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem', color: '#94a3b8' }}>
              <p>📊 <strong>Response Rate (60%):</strong> Percentage of citizen reports that received action</p>
              <p>⚡ <strong>Efficiency Bonus (40%):</strong> Extra points for resolving more than ignoring</p>
              <p>🎯 <strong>Score Ranges:</strong> 75+ Accountable | 50-74 Partial | 25-49 Poor | &lt;25 Negligent</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
