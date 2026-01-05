/**
 * Audio utilities for meditation app
 */

/**
 * Play the meditation gong sound
 */
export function playGong(): void {
  const audio = new Audio('media/gong1/361494__tec_studio__gong-002.wav');
  audio.play().catch((error) => {
    console.error('Failed to play gong sound:', error);
  });
}
