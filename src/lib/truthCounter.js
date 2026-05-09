/**
 * JanaVaani — Truth Counter Service
 *
 * Fetches the single-row truth counter data.
 */
import { supabase } from './supabase';

/**
 * Get the truth counter data.
 * Returns the single-row truth counter with official vs reality figures.
 */
export async function getTruthCounter() {
  try {
    const { data, error } = await supabase
      .from('truth_counter')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      // If table doesn't exist, return default values silently
      if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        return {
          officialCollapses: 0,
          realityCollapses: 0,
          gap: 0,
          realityDeaths: 0,
          realityInjured: 0,
          officialSource: 'N/A',
          realitySource: 'N/A',
          citizenReportsOnPlatform: 0,
          updatedAt: new Date().toISOString(),
        };
      }
      throw error;
    }

    return {
      officialCollapses: data.official_collapses,
      realityCollapses: data.reality_collapses,
      gap: data.gap,
      realityDeaths: data.reality_deaths,
      realityInjured: data.reality_injured,
      officialSource: data.official_source,
      realitySource: data.reality_source,
      citizenReportsOnPlatform: data.citizen_reports_on_platform,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    // Return default values on any error without logging
    return {
      officialCollapses: 0,
      realityCollapses: 0,
      gap: 0,
      realityDeaths: 0,
      realityInjured: 0,
      officialSource: 'N/A',
      realitySource: 'N/A',
      citizenReportsOnPlatform: 0,
      updatedAt: new Date().toISOString(),
    };
  }
}
