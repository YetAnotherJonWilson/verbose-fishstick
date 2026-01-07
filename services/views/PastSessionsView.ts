/**
 * Past Sessions View
 * Renders the list of past meditation sessions (10 most recent)
 */

import Store from '../Store';
import { createButton, clearContainer, formatSessionDate } from '../UIComponents';

interface PastSessionsViewCallbacks {
  onBack: () => void;
}

export function renderPastSessionsView(
  container: HTMLElement,
  callbacks: PastSessionsViewCallbacks
): void {
  clearContainer(container);

  // Create title
  const title = document.createElement('h2');
  title.textContent = 'Past Meditation Sessions';
  container.appendChild(title);

  // Check if we have sessions
  if (Store.meditationSessions.length === 0) {
    const noData = document.createElement('p');
    noData.className = 'no-data';
    noData.textContent = 'No meditation sessions yet. Start your first one!';
    container.appendChild(noData);
  } else {
    // Get the 10 most recent sessions
    const recentSessions = Store.meditationSessions.slice(0, 10);

    // Create session list
    const sessionList = document.createElement('div');
    sessionList.className = 'session-list';

    recentSessions.forEach((session) => {
      const sessionItem = document.createElement('div');
      sessionItem.className = 'session-item';

      const formattedDate = formatSessionDate(session.createdAt);
      const durationMinutes = Math.round(session.duration / 60);

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
