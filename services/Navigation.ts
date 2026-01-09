/**
 * Navigation manager for handling view transitions in the meditation app
 */

import Store from './Store';
import { renderNewMeditationForm } from './views/NewMeditationForm';
import { renderMeditatingView } from './views/MeditatingView';
import { renderCompletedMeditationView } from './views/CompletedMeditationView';
import { renderPresetsListView } from './views/PresetsListView';
import { renderPastSessionsView } from './views/PastSessionsView';

export class NavigationManager {
  private meditationCleanup: (() => void) | null = null;

  constructor() {
    // Initialize view event listeners if needed
  }

  /**
   * Cleanup any active timers/intervals (call on sign-out)
   */
  cleanup(): void {
    if (this.meditationCleanup) {
      this.meditationCleanup();
      this.meditationCleanup = null;
    }
  }

  /**
   * Helper to toggle view visibility
   */
  private activateView(viewId: string): void {
    // Clean up any active meditation timer
    if (this.meditationCleanup) {
      this.meditationCleanup();
      this.meditationCleanup = null;
    }

    // Hide all views
    const views = [
      'mainMenuView',
      'newMeditationFormView',
      'presetsView',
      'sessionsView',
      'meditatingView',
      'completedMeditationView',
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
    this.activateView('mainMenuView');
  }

  /**
   * Show the new meditation session form
   */
  showNewMeditationForm(): void {
    this.activateView('newMeditationFormView');

    const container = document.getElementById('newMeditationFormView');
    if (!container) return;

    renderNewMeditationForm(container, Store.presets, {
      onStart: (duration, intervals, presetId) => {
        this.showMeditatingView(duration, intervals, presetId);
      },
      onCancel: () => {
        this.showMainMenu();
      },
    });
  }

  /**
   * Show the meditating view with countdown timer
   */
  showMeditatingView(
    durationInSeconds: number,
    intervalsInMinutes: number[] = [],
    presetId: string | null = null
  ): void {
    this.activateView('meditatingView');

    const container = document.getElementById('meditatingView');
    if (!container) return;

    this.meditationCleanup = renderMeditatingView(
      container,
      { durationInSeconds, intervalsInMinutes, presetId },
      {
        onComplete: (elapsed, intervals, preset) => {
          this.showCompletedMeditationView(elapsed, intervals, preset);
        },
        onStop: (elapsed, intervals, preset) => {
          this.showCompletedMeditationView(elapsed, intervals, preset);
        },
      }
    );
  }

  /**
   * Show the completed meditation view
   */
  async showCompletedMeditationView(
    durationInSeconds: number,
    intervalsInMinutes: number[] = [],
    presetId: string | null = null
  ): Promise<void> {
    this.activateView('completedMeditationView');

    const container = document.getElementById('completedMeditationView');
    if (!container) return;

    await renderCompletedMeditationView(
      container,
      { durationInSeconds, intervalsInMinutes, presetId },
      {
        onReturn: () => {
          this.showMainMenu();
        },
      }
    );
  }

  /**
   * Show the list of available presets
   */
  async showPresetsList(): Promise<void> {
    this.activateView('presetsView');

    const container = document.getElementById('presetsView');
    if (!container) return;

    renderPresetsListView(container, Store.presets, {
      onBack: () => {
        this.showMainMenu();
      },
    });
  }

  /**
   * Show the list of past meditation sessions
   */
  showPastSessions(): void {
    this.activateView('sessionsView');

    const container = document.getElementById('sessionsView');
    if (!container) return;

    renderPastSessionsView(container, Store.meditationSessions, {
      onBack: () => {
        this.showMainMenu();
      },
    });
  }
}
