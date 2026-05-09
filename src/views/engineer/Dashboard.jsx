import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../lib/auth';
import { getTasksForEngineer, updateTaskStatus } from '../../lib/tasks';
import { useToast } from '../../context/ToastContext';
import { FLAGS } from '../../lib/features';
import TaskEvidenceUpload from '../../components/TaskEvidenceUpload';

// TaskCard sub-component
function TaskCard({ task, onStatusChange }) {
  const [status, setStatus] = useState(task.status);
  const [notes, setNotes] = useState(task.completion_notes || '');
  const [saving, setSaving] = useState(false);
  // K-GRM Action Log state
  const [actionLogs, setActionLogs] = useState([]);
  const [showActions, setShowActions] = useState(false);
  const [loggingAction, setLoggingAction] = useState(false);
  // Evidence photo state
  const [showEvidence, setShowEvidence] = useState(false);
  const [hasEvidence, setHasEvidence] = useState(false);
  const evidenceRequired = FLAGS.ENABLE_TASK_EVIDENCE_PHOTOS && (task.evidence_required !== false);
  const evidenceBlocking = evidenceRequired && !hasEvidence && (status !== task.status);

  const priorityColors = {
    LOW: '#94a3b8',
    MEDIUM: '#f97316',
    HIGH: '#ef4444',
    URGENT: '#dc2626',
  };

  const statusColors = {
    OPEN: '#3b82f6',
    IN_PROGRESS: '#f97316',
    COMPLETED: '#22c55e',
    CLOSED: '#64748b',
  };

  const ACTION_TYPES = [
    { key: 'FIELD_VISIT_INITIATED', label: '🚶 Field Visit', color: '#3b82f6' },
    { key: 'ASSESSMENT_COMPLETE', label: '📋 Assessment Done', color: '#8b5cf6' },
    { key: 'MATERIAL_REQUESTED', label: '📦 Material Requested', color: '#f59e0b' },
    { key: 'MATERIAL_RECEIVED', label: '📦 Material Received', color: '#10b981' },
    { key: 'WORK_STARTED', label: '🔨 Work Started', color: '#f97316' },
    { key: 'WORK_IN_PROGRESS', label: '⚙️ Work In Progress', color: '#f97316' },
    { key: 'WORK_COMPLETE', label: '✅ Work Complete', color: '#22c55e' },
    { key: 'CITIZEN_NOTIFIED', label: '📱 Citizen Notified', color: '#60a5fa' },
  ];

  async function handleSave() {
    setSaving(true);
    try {
      await updateTaskStatus(task.id, status, notes);
      onStatusChange?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  // K-GRM: Fetch action logs
  async function fetchActionLogs() {
    try {
      const res = await fetch(`/api/engineer-actions?task_id=${task.id}`);
      if (res.ok) {
        const data = await res.json();
        setActionLogs(data.logs || []);
      }
    } catch (e) { console.error('Failed to fetch action logs:', e); }
  }

  // K-GRM: Log an action
  async function logAction(actionType, remark = '') {
    setLoggingAction(true);
    try {
      const res = await fetch('/api/engineer-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          engineer_id: task.assigned_to,
          action_type: actionType,
          remark: remark || `${actionType.replace(/_/g, ' ')} logged`,
        }),
      });
      if (res.ok) {
        await fetchActionLogs();
        onStatusChange?.();
      }
    } catch (e) { console.error('Failed to log action:', e); }
    finally { setLoggingAction(false); }
  }

  useEffect(() => {
    if (showActions && FLAGS.ENABLE_KGRM_ACTION_LOGS) fetchActionLogs();
  }, [showActions]);

  return (
    <div className="report-card" style={{ marginBottom: '1rem', textAlign: 'left' }}>
      <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
        <div>
          <strong style={{ fontSize: '1.1rem' }}>{task.title}</strong>
          <span className="badge" style={{
            background: priorityColors[task.priority] + '20',
            color: priorityColors[task.priority],
            marginLeft: '0.5rem',
            border: `1px solid ${priorityColors[task.priority]}40`
          }}>
            {task.priority}
          </span>
          <span className="badge" style={{
            background: statusColors[status] + '20',
            color: statusColors[status],
            marginLeft: '0.5rem',
            border: `1px solid ${statusColors[status]}40`
          }}>
            {status}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          {task.due_date && (
            <div className={isOverdue ? 'text-red' : 'text-gray'} style={{ fontSize: '0.8rem', fontWeight: isOverdue ? 700 : 400 }}>
              Due: {new Date(task.due_date).toLocaleDateString()}
              {isOverdue && ' ⚠️ OVERDUE'}
            </div>
          )}
          <div className="text-gray" style={{ fontSize: '0.8rem' }}>
            Assigned: {new Date(task.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {task.description && (
        <p style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.95rem' }}>
          {task.description}
        </p>
      )}

      {task.report && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>📍 Location</div>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>{task.report.location_name || 'Site'}</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            <span style={{ color: '#94a3b8' }}>Type:</span> {task.report.issue_type} · <span style={{ color: '#94a3b8' }}>Severity:</span> {task.report.severity}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select className="form-input" style={{ width: '160px', marginTop: 0 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <input className="form-input" style={{ flex: 1, minWidth: 200, marginTop: 0 }} placeholder="Completion notes..." value={notes} onChange={e => setNotes(e.target.value)} />
        <button className="btn-primary" onClick={handleSave} disabled={saving || evidenceBlocking || (status === task.status && notes === (task.completion_notes || ''))}>
          {saving ? '...' : evidenceBlocking ? '📷 Evidence Required' : 'Update'}
        </button>
        {FLAGS.ENABLE_TASK_EVIDENCE_PHOTOS && (
          <button className="btn-secondary" onClick={() => setShowEvidence(!showEvidence)} style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd', fontSize: '0.85rem' }}>
            📷 {showEvidence ? 'Hide' : 'Add'} Evidence
          </button>
        )}
        {FLAGS.ENABLE_KGRM_ACTION_LOGS && (
          <button className="btn-secondary" onClick={() => setShowActions(!showActions)} style={{ background: 'rgba(139,92,246,0.1)', color: '#c4b5fd', fontSize: '0.85rem' }}>
            📋 {showActions ? 'Hide' : 'Log'} Actions
          </button>
        )}
      </div>

      {/* Task Evidence Photos Panel */}
      {showEvidence && FLAGS.ENABLE_TASK_EVIDENCE_PHOTOS && (
        <TaskEvidenceUpload
          taskId={task.id}
          engineerId={task.assigned_to}
          required={task.evidence_required !== false}
          onEvidenceStateChange={setHasEvidence}
          onUploadComplete={() => onStatusChange?.()}
        />
      )}

      {/* K-GRM: Action Log Panel */}
      {showActions && FLAGS.ENABLE_KGRM_ACTION_LOGS && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c4b5fd' }}>📋 K-GRM Action Log</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {ACTION_TYPES.map(a => (
              <button
                key={a.key}
                className="btn-secondary"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: a.color + '15', color: a.color, border: `1px solid ${a.color}30` }}
                disabled={loggingAction}
                onClick={() => logAction(a.key)}
              >
                {a.label}
              </button>
            ))}
          </div>
          {/* Action Timeline */}
          {actionLogs.length > 0 && (
            <div style={{ borderLeft: '2px solid rgba(139,92,246,0.3)', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {actionLogs.map(log => (
                <div key={log.id} style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span style={{ color: '#c4b5fd', fontWeight: 600 }}>{new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  {' — '}
                  <span style={{ color: '#e2e8f0' }}>{log.action_type.replace(/_/g, ' ')}</span>
                  {log.remark && <span> · {log.remark}</span>}
                </div>
              ))}
            </div>
          )}
          {actionLogs.length === 0 && <p className="text-gray" style={{ fontSize: '0.8rem', margin: 0 }}>No actions logged yet.</p>}
        </div>
      )}
    </div>
  );
}

export default function EngineerDashboard() {
  const { engineer, loading: authLoading, isEngineer } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  // Auth guard: if not engineer, redirect to engineer login
  useEffect(() => {
    if (!authLoading && !isEngineer) {
      router.push('/engineer/login');
    }
  }, [authLoading, isEngineer, router]);

  // Fetch tasks
  useEffect(() => {
    if (engineer?.id) {
      fetchTasks();
    }
  }, [engineer]);

  async function fetchTasks() {
    setTasksLoading(true);
    try {
      const data = await getTasksForEngineer(engineer.id);
      setTasks(data);
    } catch (err) {
      showToast('Failed to load tasks', 'error');
      console.error(err);
    } finally {
      setTasksLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut();
      showToast('Signed out successfully', 'success');
      router.push('/');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  if (authLoading || tasksLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Stats
  const stats = {
    total: tasks.length,
    open: tasks.filter(t => t.status === 'OPEN').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'COMPLETED').length,
  };

  // Filter tasks
  const filteredTasks = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="page-container" style={{ textAlign: 'left' }}>
      {/* Header */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🔧 Engineer Dashboard</h1>
          <p className="text-gray">Welcome, {engineer?.name || 'Engineer'}</p>
          {engineer?.specialization && (
            <span className="badge" style={{ marginTop: '0.5rem' }}>
              {engineer.specialization}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={fetchTasks} title="Refresh tasks">
            🔄 Refresh
          </button>
          <button className="btn-danger" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#60a5fa' }}>{stats.total}</div>
          <div className="text-gray" style={{ fontSize: '0.85rem' }}>Total Tasks</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{stats.open}</div>
          <div className="text-gray" style={{ fontSize: '0.85rem' }}>Open</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.3)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f97316' }}>{stats.inProgress}</div>
          <div className="text-gray" style={{ fontSize: '0.85rem' }}>In Progress</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>{stats.completed}</div>
          <div className="text-gray" style={{ fontSize: '0.85rem' }}>Completed</div>
        </div>
        {stats.overdue > 0 && (
          <div className="stat-card" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>{stats.overdue}</div>
            <div className="text-gray" style={{ fontSize: '0.85rem' }}>Overdue</div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'btn-primary' : 'btn-secondary'}
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.85rem',
              opacity: filter === f ? 1 : 0.7
            }}
          >
            {f === 'ALL' ? 'All Tasks' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="section-title" style={{ marginBottom: '1rem' }}>
        My Assigned Tasks ({filteredTasks.length})
      </div>

      {filteredTasks.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p className="text-gray">
            {filter === 'ALL'
              ? 'No tasks assigned to you yet.'
              : `No ${filter.replace('_', ' ').toLowerCase()} tasks.`}
          </p>
        </div>
      ) : (
        filteredTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={fetchTasks}
          />
        ))
      )}
    </div>
  );
}
