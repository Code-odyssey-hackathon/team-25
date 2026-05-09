/**
 * JanaVaani — Engineer Tasks Service
 *
 * CRUD for engineer task assignments.
 * Uses API routes with service-role access to bypass RLS restrictions.
 */
import { supabase } from './supabase';

/**
 * Create a new task assigned to an engineer.
 * Required fields: bridge_id, assigned_by, assigned_to, title
 * Note: Task creation is done by Authorities (admins), who have proper RLS access.
 */
export async function createTask(taskData) {
  const res = await fetch('/api/engineer/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create task');
  }

  const { task } = await res.json();
  return task;
}

/**
 * Get all tasks assigned to a specific engineer.
 * Uses API route to bypass RLS.
 */
export async function getTasksForEngineer(engineerId) {
  const res = await fetch(`/api/engineer/tasks?engineerId=${engineerId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch tasks');
  }
  const { tasks } = await res.json();
  return tasks;
}

/**
 * Get all tasks assigned by a specific authority.
 */
export async function getTasksAssignedByAuthority(authorityId) {
  const res = await fetch(`/api/engineer/tasks?authorityId=${authorityId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch assigned tasks');
  }
  const { tasks } = await res.json();
  return tasks || [];
}

/**
 * Update task status (e.g., OPEN → IN_PROGRESS → COMPLETED).
 * Also sets completed_at when status becomes COMPLETED.
 * Uses API route to bypass RLS.
 */
export async function updateTaskStatus(taskId, status, completionNotes = '') {
  const res = await fetch('/api/engineer/tasks', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, status, completionNotes }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update task');
  }

  const { task } = await res.json();
  return task;
}
