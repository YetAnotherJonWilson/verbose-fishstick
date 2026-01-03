/**
 * Navigation manager for handling view transitions in the meditation app
 */

import Store from './Store';
import {
  createButton,
  formatSessionDate,
  clearContainer,
} from './UIComponents';
import {
  createMeditationSession,
  getPresets,
  getMeditationSessions,
} from './API';
import { session } from '../app';

type ViewName =
  | 'mainMenu'
  | 'newMeditation'
  | 'presets'
  | 'sessions'
  | 'meditating';

export class NavigationManager {
  private currentView: ViewName = 'mainMenu';

  constructor() {
    // Initialize view event listeners if needed
  }

  /**
   * Returns the currently active view
   */
  getCurrentView(): ViewName {
    return this.currentView;
  }

  /**
   * Helper to toggle view visibility
   */
  private activateView(viewId: string): void {
    // Hide all views
    const views = [
      'mainMenuView',
      'newMeditationFormView',
      'presetsView',
      'sessionsView',
      'meditatingView',
    ];
    views.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });

    if (viewId !== 'mainMenuView') {
      let appStatusEl = document.getElementById('appStatus');
      if (appStatusEl) appStatusEl.remove();
    }

    // Show the requested view
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');
  }

  /**
   * Show the main menu with three action buttons
   */
  showMainMenu(): void {
    this.currentView = 'mainMenu';
    this.activateView('mainMenuView');
  }

  /**
   * Show the new meditation session form
   */
  showNewMeditationForm(): void {
    this.currentView = 'newMeditation';
    this.activateView('newMeditationFormView');

    const container = document.getElementById('newMeditationFormView');
    if (!container) return;

    clearContainer(container);

    // Create form title
    const title = document.createElement('h2');
    title.textContent = 'Start New Meditation';
    container.appendChild(title);

    // Create form
    const form = document.createElement('form');
    form.className = 'meditation-form';

    // Duration input
    const durationLabel = document.createElement('label');
    durationLabel.textContent = 'Duration (minutes):';
    const durationInput = document.createElement('input');
    durationInput.type = 'number';
    durationInput.min = '1';
    durationInput.value = '10';
    durationInput.required = true;
    durationLabel.appendChild(durationInput);
    form.appendChild(durationLabel);

    // Preset selector
    const presetLabel = document.createElement('label');
    presetLabel.textContent = 'Preset (optional):';
    const presetSelect = document.createElement('select');
    const noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = 'None';
    presetSelect.appendChild(noneOption);

    // Add presets from store
    Store.presets.forEach((preset) => {
      const option = document.createElement('option');
      option.value = preset.uri;
      option.textContent = `${preset.name} (${preset.duration}s)`;
      presetSelect.appendChild(option);
    });
    presetLabel.appendChild(presetSelect);
    form.appendChild(presetLabel);

    // Notes textarea
    const notesLabel = document.createElement('label');
    notesLabel.textContent = 'Notes (optional):';
    const notesTextarea = document.createElement('textarea');
    notesTextarea.rows = 3;
    notesLabel.appendChild(notesTextarea);
    form.appendChild(notesLabel);

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-group';

    // Start button
    const startMeditationNowButton = createButton(
      'Start Meditation',
      'primary',
      async () => {
        const duration = parseInt(durationInput.value) * 60; // Convert to seconds
        this.showMeditatingView(duration);
      }
    );

    // Cancel button
    const cancelButton = createButton('Cancel', 'secondary', () => {
      this.showMainMenu();
    });

    buttonContainer.appendChild(startMeditationNowButton);
    buttonContainer.appendChild(cancelButton);
    form.appendChild(buttonContainer);

    container.appendChild(form);
  }

  /**
   * Show the meditating view with countdown timer
   */
  showMeditatingView(durationInSeconds: number): void {
    this.currentView = 'meditating';
    this.activateView('meditatingView');

    const container = document.getElementById('meditatingView');
    if (!container) return;

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

    // Function to format seconds as MM:SS
    const formatTime = (totalSeconds: number): string => {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
    };

    // Initialize countdown display
    let remainingTime = durationInSeconds;
    countdown.textContent = formatTime(remainingTime);
    container.appendChild(countdown);

    // Start the countdown
    const intervalId = setInterval(() => {
      remainingTime--;
      countdown.textContent = formatTime(remainingTime);

      if (remainingTime <= 0) {
        clearInterval(intervalId);
        // Meditation complete - could add completion logic here
        countdown.textContent = 'Complete!';
      }
    }, 1000);

    // Add a stop button
    const stopButton = createButton('Stop Meditation', 'secondary', () => {
      clearInterval(intervalId);
      this.showMainMenu();
    });
    container.appendChild(stopButton);
  }

  /**
   * Show the list of available presets
   */
  async showPresetsList(): Promise<void> {
    this.currentView = 'presets';
    this.activateView('presetsView');

    const container = document.getElementById('presetsView');
    if (!container) return;

    clearContainer(container);

    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Meditation Presets';
    container.appendChild(title);

    // Check if we have presets
    if (Store.presets.length === 0) {
      const noData = document.createElement('p');
      noData.className = 'no-data';
      noData.textContent = 'No presets found. Create one to get started!';
      container.appendChild(noData);
    } else {
      // Create preset list
      const presetList = document.createElement('div');
      presetList.className = 'preset-list';

      Store.presets.forEach((preset) => {
        const presetItem = document.createElement('div');
        presetItem.className = 'preset-item';

        const presetName = document.createElement('strong');
        presetName.textContent = preset.name;

        const presetDuration = document.createElement('span');
        presetDuration.textContent = ` - ${preset.duration} seconds`;

        presetItem.appendChild(presetName);
        presetItem.appendChild(presetDuration);
        presetList.appendChild(presetItem);
      });

      container.appendChild(presetList);
    }

    // Back button
    const backButton = createButton('Back to Menu', 'secondary', () => {
      this.showMainMenu();
    });
    container.appendChild(backButton);
  }

  /**
   * Show the list of past meditation sessions (10 most recent)
   */
  showPastSessions(): void {
    this.currentView = 'sessions';
    this.activateView('sessionsView');

    const container = document.getElementById('sessionsView');
    if (!container) return;

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
      this.showMainMenu();
    });
    container.appendChild(backButton);
  }
}
