/**
 * Past Sessions View
 * Renders the list of past meditation sessions (10 most recent)
 */

import { createButton, clearContainer, formatSessionDate } from '../UIComponents';
import { MeditationSessionData } from '../types';
import { secondsToMinutesRounded } from '../TimeUtils';
import { MEDITATION_LIMITS } from '../Constants';

interface PastSessionsViewCallbacks {
  onBack: () => void;
}

export function renderPastSessionsView(
  container: HTMLElement,
  sessions: MeditationSessionData[],
  callbacks: PastSessionsViewCallbacks
): void {
  clearContainer(container);

  // Create title
  const title = document.createElement('h2');
  title.textContent = 'Past Meditation Sessions';
  container.appendChild(title);

  // Check if we have sessions
  if (sessions.length === 0) {
    const noData = document.createElement('p');
    noData.className = 'no-data';
    noData.textContent = 'No meditation sessions yet. Start your first one!';
    container.appendChild(noData);
  } else {
    // Get the most recent sessions
    const recentSessions = sessions.slice(0, MEDITATION_LIMITS.RECENT_SESSIONS_COUNT);

    // Create session list
    const sessionList = document.createElement('div');
    sessionList.className = 'session-list';

    recentSessions.forEach((session) => {
      const sessionItem = document.createElement('div');
      sessionItem.className = 'session-item';

      const formattedDate = formatSessionDate(session.createdAt);
      const durationMinutes = secondsToMinutesRounded(session.duration);

      sessionItem.textContent = `${formattedDate} - ${durationMinutes} minutes`;

      sessionList.appendChild(sessionItem);
    });

    container.appendChild(sessionList);
  }

  // Back button
  const backButton = createButton('Back to Menu', 'secondary', () => {
    callbacks.onBack();
  });
  container.appendChild(backButton);
}
