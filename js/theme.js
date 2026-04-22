/* ═══════════════════════════════════════════════════════════════
   Texas Plumbing Prep — Theme Toggle
   © 2025 Oliver Granja – ViscaCode

   Handles switching between light and dark modes:
     - Saves preference to localStorage (key: 'tpp-theme')
     - Listens for system theme changes when no manual preference set
     - Initial theme detection runs in the <head> inline script
       to prevent flash of wrong theme on page load
   ═══════════════════════════════════════════════════════════════ */

(function() {
  const STORAGE_KEY = 'tpp-theme';
  const root = document.documentElement;

  /**
   * Toggle between light and dark themes.
   * Saves the new preference to localStorage.
   */
  function toggleTheme() {
    const isCurrentlyLight = root.getAttribute('data-theme') === 'light';
    const nextTheme = isCurrentlyLight ? 'dark' : 'light';

    if (nextTheme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }

    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
  }

  /**
   * Listen for system theme changes and update automatically
   * if the user hasn't manually chosen a theme.
   */
  function watchSystemTheme() {
    if (!window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    mediaQuery.addEventListener('change', function(e) {
      try {
        // Only auto-update if user has NOT manually set a preference
        if (!localStorage.getItem(STORAGE_KEY)) {
          if (e.matches) {
            root.setAttribute('data-theme', 'light');
          } else {
            root.removeAttribute('data-theme');
          }
        }
      } catch (err) {
        console.warn('System theme watcher error:', err);
      }
    });
  }

  /**
   * Wire up the toggle button.
   */
  function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleTheme);
    }
    watchSystemTheme();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle);
  } else {
    initThemeToggle();
  }
})();
