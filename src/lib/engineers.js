/**
 * JanaVaani — Engineers Service
 *
 * Helpers for fetching and creating engineer profiles.
 */
import { supabase } from './supabase';

/**
 * Fetch all active engineers (for authority assignment dropdowns).
 * Returns array of { id, name, email, specialization, department }.
 */
export async function getActiveEngineers() {
  const res = await fetch('/api/engineers');
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch engineers');
  }
  const { engineers } = await res.json();
  return engineers;
}

/**
 * Create a new engineer record.
 * Uses API route to bypass RLS.
 */
export async function createEngineer(engineerData) {
  const res = await fetch('/api/engineers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(engineerData),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create engineer');
  }

  const { engineer } = await res.json();
  return engineer;
}
