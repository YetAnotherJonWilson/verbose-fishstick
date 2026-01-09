/**
 * Application constants and validation limits
 */

export const MEDITATION_LIMITS = {
  /** Minimum duration in seconds (1 minute) */
  MIN_DURATION_SECONDS: 60,

  /** Maximum duration in seconds (24 hours) */
  MAX_DURATION_SECONDS: 86400,

  /** Maximum number of sound intervals per session/preset */
  MAX_INTERVALS: 20,

  /** Maximum preset name length */
  MAX_PRESET_NAME_LENGTH: 100,

  /** Maximum notes length */
  MAX_NOTES_LENGTH: 5000,

  /** Number of recent sessions to display */
  RECENT_SESSIONS_COUNT: 10,
} as const;

export const SOUND_TYPES = {
  GONG: 'gong',
} as const;
