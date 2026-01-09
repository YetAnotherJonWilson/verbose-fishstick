/**
 * Time utility functions for converting between minutes and seconds
 */

/**
 * Convert minutes to seconds
 */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}

/**
 * Convert seconds to minutes (floor)
 */
export function secondsToMinutes(seconds: number): number {
  return Math.floor(seconds / 60);
}

/**
 * Convert seconds to minutes (rounded)
 */
export function secondsToMinutesRounded(seconds: number): number {
  return Math.round(seconds / 60);
}

/**
 * Format total seconds as MM:SS string
 */
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}
