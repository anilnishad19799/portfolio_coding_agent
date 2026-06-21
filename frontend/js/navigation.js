/**
 * navigation.js - Navigation & Smooth Scroll Module
 * 
 * Manages all navigation-related behaviors: smooth scrolling,
 * sticky navbar, active section highlighting, mobile hamburger
 * menu, and scroll progress indicator.
 * 
 * @author Nishad Anil
 */

// ─── Main Initialization ─────────────────────────────────────────────────────

/**
 * Initialize all navigation behaviors.
 * Call this once on DOMContentLoaded.
 */
function initNavigation() {
  setupSmoothScroll();
  setupStickyNav();
  setupActiveSection();
  setupMobileMenu();
  setupScrollProgress();
}

// ─── Smooth Scrolling ────────────────────────────────────────────────────────

/**
 * Set up smooth scroll behavior for all anchor links
 * that reference on-page sections (href starts with '#').
 * Closes the mobile menu if it's currently open.
 */
function setupSmoothScroll() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');

      // Skip empty hash links
      if (href === '#') return;

      e.preventDefault();

      const targetId = href.substring(1);
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });

        // Close mobile menu if it's open
        closeMobileMenu();
      }
    });
  });
}

// ─── Sticky Navigation ──────────────────────────────────────────────────────

/**
 * Toggle a 'scrolled' class on the navbar when the user scrolls
 * past 50px. This allows CSS to apply different styles (e.g.,
 * background blur, shadow) to the navbar when sticky.
 */
function setupStickyNav() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let ticking = false;

  function onScroll() {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(() => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      ticking = false;
    });
  }

  // Set initial state
  onScroll();

  window.addEventListener('scroll', onScroll, { passive: true });
}

// ─── Active Section Tracking ─────────────────────────────────────────────────

/**
 * Highlight the navigation link corresponding to the currently
 * visible section. Uses IntersectionObserver with a root margin
 * that accounts for the sticky navbar height (~72px).
 */
function setupActiveSection() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (sections.length === 0 || navLinks.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('id');

          // Remove active class from all nav links
          navLinks.forEach(link => link.classList.remove('active'));

          // Add active class to the matching nav link
          const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
          if (activeLink) {
            activeLink.classList.add('active');
          }
        }
      });
    },
    {
      threshold: 0.3,
      rootMargin: '-72px 0px -50% 0px',
    }
  );

  sections.forEach(section => observer.observe(section));
}

// ─── Mobile Menu ─────────────────────────────────────────────────────────────

/**
 * Set up the mobile hamburger menu toggle.
 * Toggles .active on both the menu button and the nav links container.
 * Closes on nav-link click, Escape key press, and prevents body scroll
 * when the menu is open.
 */
function setupMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (!menuBtn || !navLinks) return;

  // Toggle menu on hamburger click
  menuBtn.addEventListener('click', () => {
    const isOpen = navLinks.classList.contains('active');

    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  // Close menu when a nav link is clicked
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
    }
  });
}

/**
 * Open the mobile navigation menu.
 * Adds active classes and prevents body scrolling.
 */
function openMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (menuBtn) menuBtn.classList.add('active');
  if (navLinks) navLinks.classList.add('active');
  document.body.classList.add('no-scroll');
}

/**
 * Close the mobile navigation menu.
 * Removes active classes and restores body scrolling.
 */
function closeMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (menuBtn) menuBtn.classList.remove('active');
  if (navLinks) navLinks.classList.remove('active');
  document.body.classList.remove('no-scroll');
}

// ─── Scroll Progress ─────────────────────────────────────────────────────────

/**
 * Update the scroll progress indicator bar.
 * Calculates the scroll percentage and sets the width of the
 * .scroll-progress element proportionally.
 */
function setupScrollProgress() {
  const progressBar = document.querySelector('.scroll-progress');
  if (!progressBar) return;

  let ticking = false;

  function onScroll() {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(() => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      // Avoid division by zero on pages shorter than the viewport
      const scrollPercent = docHeight > 0
        ? (scrollTop / docHeight) * 100
        : 0;

      progressBar.style.width = `${scrollPercent}%`;
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

// ─── Public API ──────────────────────────────────────────────────────────────

window.Navigation = {
  init: initNavigation,
};
