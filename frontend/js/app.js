/**
 * app.js - Main Application Entry Point
 * 
 * Bootstraps the portfolio application by initializing theme
 * management, navigation, projects, and animations.
 * This file should be loaded AFTER all other modules.
 * 
 * @author Nishad Anil
 */

// ─── SVG Icons for Theme Toggle ──────────────────────────────────────────────

/** Sun icon — displayed when theme is dark (click to switch to light) */
const SUN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

/** Moon icon — displayed when theme is light (click to switch to dark) */
const MOON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

/** localStorage key for persisting theme preference */
const THEME_STORAGE_KEY = 'portfolio_theme';

// ─── Theme Management ────────────────────────────────────────────────────────

/**
 * Initialize the theme on page load.
 * Priority order:
 *   1. Saved preference in localStorage
 *   2. System preference via prefers-color-scheme
 *   3. Default to 'dark'
 */
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  let theme;
  if (savedTheme) {
    theme = savedTheme;
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme = 'dark';
  } else {
    theme = 'light';
  }

  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

/**
 * Toggle between light and dark themes.
 * Updates the DOM, persists the choice, and swaps the toggle icon.
 */
function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  updateThemeIcon(newTheme);
}

/**
 * Set up the theme toggle button click handler.
 * Finds the .theme-toggle element and attaches the toggle function.
 */
function setupThemeToggle() {
  const toggleBtn = document.querySelector('.theme-toggle');
  if (!toggleBtn) {
    console.warn('Theme toggle button (.theme-toggle) not found');
    return;
  }

  toggleBtn.addEventListener('click', toggleTheme);
}

/**
 * Update the theme toggle button icon based on the current theme.
 * Shows the sun icon in dark mode (indicating "switch to light")
 * and the moon icon in light mode (indicating "switch to dark").
 * 
 * @param {string} theme - The current theme ('dark' or 'light')
 */
function updateThemeIcon(theme) {
  const toggleBtn = document.querySelector('.theme-toggle');
  if (!toggleBtn) return;

  if (theme === 'dark') {
    toggleBtn.innerHTML = SUN_ICON;
    toggleBtn.setAttribute('aria-label', 'Switch to light theme');
  } else {
    toggleBtn.innerHTML = MOON_ICON;
    toggleBtn.setAttribute('aria-label', 'Switch to dark theme');
  }
}

// ─── Application Bootstrap ──────────────────────────────────────────────────

/**
 * Initialize the entire portfolio application.
 * Called on DOMContentLoaded. Boots up all modules in the correct order.
 */
function initApp() {
  // Theme must be initialized first to prevent flash of wrong theme
  initTheme();
  setupThemeToggle();

  // Initialize navigation (smooth scroll, sticky nav, mobile menu, etc.)
  if (window.Navigation && window.Navigation.init) {
    window.Navigation.init();
  }

  // Initialize projects (fetch repos, render cards and filters)
  if (window.Projects && window.Projects.init) {
    window.Projects.init();
  }

  // Initialize scroll animations (reveal, counters, parallax)
  if (window.Animations && window.Animations.init) {
    window.Animations.init();
  }

  // Phase 2: Initialize contact form submission
  setupContactForm();

  // Phase 3: Initialize SPA Client Router
  if (window.Router && window.Router.init) {
    window.Router.init();
  }

  console.log('Portfolio initialized');
}

/**
 * Intercept contact form submission, send data to the backend API,
 * and display appropriate success/error feedback to the user.
 */
function setupContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // Clear HTML5 action/method to handle via AJAX
  form.removeAttribute('action');
  form.removeAttribute('method');
  form.removeAttribute('enctype');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    const originalBtnHTML = submitBtn.innerHTML;

    // Retrieve input values
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const subjectInput = document.getElementById('subject');
    const messageInput = document.getElementById('message');

    if (!nameInput || !emailInput || !messageInput) return;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const subject = subjectInput ? subjectInput.value.trim() : '';
    const message = messageInput.value.trim();

    // Disable button & indicate loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending...';

    // Remove any previous alerts
    const existingAlert = form.querySelector('.form-alert');
    if (existingAlert) existingAlert.remove();

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to submit contact message.');
      }

      // Render success alert
      const alert = document.createElement('div');
      alert.className = 'form-alert success';
      alert.style.color = '#10b981';
      alert.style.marginTop = '1rem';
      alert.style.fontWeight = '500';
      alert.style.fontSize = '0.875rem';
      alert.textContent = result.message || 'Your message has been sent successfully!';
      form.appendChild(alert);

      form.reset();
    } catch (error) {
      console.error('Contact form submission error:', error);
      // Render error alert
      const alert = document.createElement('div');
      alert.className = 'form-alert error';
      alert.style.color = '#ef4444';
      alert.style.marginTop = '1rem';
      alert.style.fontWeight = '500';
      alert.style.fontSize = '0.875rem';
      alert.textContent = error.message || 'An error occurred. Please try again later.';
      form.appendChild(alert);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
    }
  });
}

/**
 * Send a page view analytics event to the backend API.
 */
async function sendAnalyticsPageView() {
  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'page_view',
        path: window.location.pathname,
        referrer: document.referrer || '',
        user_agent: navigator.userAgent
      }),
    });
  } catch (error) {
    // Fail silently to prevent console clutter for users
    console.debug('Failed to record page view analytics:', error);
  }
}

// ─── DOM Ready Listener ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// ─── Public API ──────────────────────────────────────────────────────────────

window.App = {
  init: initApp,
  toggleTheme,
};
