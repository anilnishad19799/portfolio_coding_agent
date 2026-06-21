/**
 * animations.js - Scroll Animations Module
 * 
 * Provides scroll-triggered animations including element reveals,
 * number counter animations, and parallax effects. Respects
 * prefers-reduced-motion for accessibility.
 * 
 * @author Nishad Anil
 */

// ─── Main Initialization ─────────────────────────────────────────────────────

/**
 * Initialize all animation systems.
 * Sets up scroll-triggered animations, counter animations,
 * and parallax effects.
 */
function initAnimations() {
  setupScrollAnimations();
  animateCounters();
  setupParallax();
}

// ─── Scroll Animations ──────────────────────────────────────────────────────

/**
 * Set up IntersectionObserver for scroll-triggered animations.
 * Elements with the '.animate-on-scroll' class will receive a 'visible'
 * class when they enter the viewport. Children within animated parents
 * receive staggered transition delays for a cascading effect.
 */
function setupScrollAnimations() {
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  if (animatedElements.length === 0) return;

  // Apply staggered delays to children within each animated parent
  animatedElements.forEach(parent => {
    const children = parent.querySelectorAll('.animate-on-scroll');
    children.forEach((child, index) => {
      // Add 100ms delay per child for cascading entrance
      child.style.transitionDelay = `${index * 100}ms`;
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Stop observing once the animation has triggered
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '-50px',
    }
  );

  animatedElements.forEach(el => observer.observe(el));
}

// ─── Counter Animations ─────────────────────────────────────────────────────

/**
 * Animate counter elements from 0 to their target value.
 * Uses requestAnimationFrame for smooth 60fps animation with
 * easeOutQuart easing for a satisfying deceleration curve.
 * 
 * Target value is read from the data-target attribute.
 * Animation duration: 2 seconds.
 * Appends '+' suffix to the final value.
 */
function animateCounters() {
  const counters = document.querySelectorAll('.counter');
  if (counters.length === 0) return;

  /**
   * EaseOutQuart easing function.
   * Starts fast and decelerates smoothly.
   * 
   * @param {number} t - Progress (0 to 1)
   * @returns {number} Eased value (0 to 1)
   */
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  /**
   * Animate a single counter element from 0 to its target value.
   * 
   * @param {HTMLElement} counter - The counter DOM element
   */
  function animateCounter(counter) {
    const target = parseInt(counter.dataset.target, 10);
    if (isNaN(target)) return;

    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = Math.floor(easedProgress * target);

      counter.textContent = currentValue + '+';

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // Ensure we land on the exact target value
        counter.textContent = target + '+';
      }
    }

    requestAnimationFrame(update);
  }

  // Observe counters and trigger animation when they become visible
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.3,
    }
  );

  counters.forEach(counter => observer.observe(counter));
}

// ─── Parallax Effects ────────────────────────────────────────────────────────

/**
 * Set up subtle parallax movement for hero orb elements.
 * Orbs move at different rates based on scroll position,
 * creating a depth effect.
 * 
 * Only active on desktop viewports (>768px) and when the user
 * has not enabled reduced-motion preferences.
 */
function setupParallax() {
  // Respect user's motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) return;

  const orbs = document.querySelectorAll('.hero-orb');
  if (orbs.length === 0) return;

  // Parallax speeds — each orb moves at a different rate
  const speeds = [0.05, -0.03, 0.04];

  let ticking = false;

  function onScroll() {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(() => {
      // Only apply parallax on desktop viewports
      if (window.innerWidth > 768) {
        const scrollY = window.scrollY;

        orbs.forEach((orb, index) => {
          const speed = speeds[index % speeds.length];
          const yOffset = scrollY * speed;
          orb.style.transform = `translateY(${yOffset}px)`;
        });
      } else {
        // Reset transforms on mobile
        orbs.forEach(orb => {
          orb.style.transform = '';
        });
      }

      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Also listen for changes to motion preference
  prefersReducedMotion.addEventListener('change', (e) => {
    if (e.matches) {
      // User has enabled reduced motion — remove scroll listener and reset
      window.removeEventListener('scroll', onScroll);
      orbs.forEach(orb => {
        orb.style.transform = '';
      });
    } else {
      // User has disabled reduced motion — re-attach listener
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

window.Animations = {
  init: initAnimations,
};
