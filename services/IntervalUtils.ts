/**
 * Utilities for handling sound intervals
 */

import { SoundInterval } from './types';
import { minutesToSeconds, secondsToMinutes } from './TimeUtils';

/**
 * Parse user input string (comma-separated minutes) to array of minutes
 * e.g., "5, 10, 15" -> [5, 10, 15]
 */
export function parseIntervalsInput(input: string): number[] {
  if (!input.trim()) return [];

  return input
    .split(',')
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n) && n > 0)
    .sort((a, b) => a - b);
}

/**
 * Convert array of minutes to SoundInterval objects for API
 */
export function toSoundIntervals(
  minutesArray: number[],
  soundType: string = 'gong'
): SoundInterval[] {
  return minutesArray.map((min) => ({
    time: minutesToSeconds(min),
    soundType,
  }));
}

/**
 * Convert SoundInterval objects to array of minutes for display
 */
export function toMinutesArray(intervals: SoundInterval[]): number[] {
  return intervals.map((si) => secondsToMinutes(si.time));
}

/**
 * Format SoundInterval array as comma-separated minutes string
 */
export function formatIntervalsForDisplay(intervals: SoundInterval[]): string {
  return toMinutesArray(intervals).join(',');
}
