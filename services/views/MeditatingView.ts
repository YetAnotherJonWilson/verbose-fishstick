/**
 * Meditating View
 * Renders the active meditation countdown timer
 */

import { createButton, clearContainer } from '../UIComponents';
import { playGong } from '../Audio';
import { formatTime, minutesToSeconds } from '../TimeUtils';

interface MeditatingViewParams {
  durationInSeconds: number;
  intervalsInMinutes: number[];
  presetId: string | null;
}

interface MeditatingViewCallbacks {
  onComplete: (
    elapsedSeconds: number,
    intervalsInMinutes: number[],
    presetId: string | null
  ) => void;
  onStop: (
    elapsedSeconds: number,
    intervalsInMinutes: number[],
    presetId: string | null
  ) => void;
}

/**
 * Renders the meditating view with countdown timer
 * @returns cleanup function to stop the timer
 */
export function renderMeditatingView(
  container: HTMLElement,
  params: MeditatingViewParams,
  callbacks: MeditatingViewCallbacks
): () => void {
  const { durationInSeconds, intervalsInMinutes, presetId } = params;

  clearContainer(container);

  // Create title
  const title = document.createElement('h2');
  title.textContent = 'Meditating...';
  container.appendChild(title);

  // Create countdown display
  const countdown = document.createElement('div');
  countdown.className = 'countdown-timer';
  countdown.style.fontSize = '48px';
  countdown.style.fontWeight = 'bold';
  countdown.style.margin = '40px 0';
  countdown.style.textAlign = 'center';

  // Initialize countdown display
  let remainingTime = durationInSeconds;
  countdown.textContent = formatTime(remainingTime);
  container.appendChild(countdown);

  // Play gong sound to start meditation
  playGong();

  // Convert interval minutes to seconds and track which have been played
  const intervalSeconds = intervalsInMinutes.map(minutesToSeconds);
  const playedIntervals = new Set<number>();

  // Start the countdown
  const intervalId = setInterval(() => {
    remainingTime--;
    countdown.textContent = formatTime(remainingTime);

    // Check if we've reached an interval time
    const elapsedTime = durationInSeconds - remainingTime;
    for (const intervalTime of intervalSeconds) {
      if (elapsedTime >= intervalTime && !playedIntervals.has(intervalTime)) {
        playGong();
        playedIntervals.add(intervalTime);
      }
    }

    if (remainingTime <= 0) {
      clearInterval(intervalId);
      // Play gong sound on completion
      playGong();
      // Meditation complete - transition to completion view with full duration
      callbacks.onComplete(durationInSeconds, intervalsInMinutes, presetId);
    }
  }, 1000);

  // Add a stop button
  const stopButton = createButton('Stop Meditation', 'secondary', () => {
    clearInterval(intervalId);
    // Play gong sound on stop
    playGong();
    // Calculate elapsed time (what was completed before stopping)
    const elapsedTime = durationInSeconds - remainingTime;
    callbacks.onStop(elapsedTime, intervalsInMinutes, presetId);
  });
  container.appendChild(stopButton);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
}
