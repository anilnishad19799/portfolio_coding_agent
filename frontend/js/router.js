/**
 * router.js - SPA Client-Side Router
 * 
 * Manages route transitions, viewport swaps, and navigation states
 * using the HTML5 History API.
 * 
 * @author Nishad Anil
 */

(function () {
  const routes = [
    { pattern: /^\/$/, view: 'portfolio' },
    { pattern: /^\/blog$/, view: 'blog-list' },
    { pattern: /^\/blog\/([^/]+)$/, view: 'blog-detail' },
    { pattern: /^\/admin$/, view: 'admin' }
  ];

  const views = {
    'portfolio': document.getElementById('portfolio-view'),
    'blog-list': document.getElementById('blog-list-view'),
    'blog-detail': document.getElementById('blog-detail-view'),
    'admin': document.getElementById('admin-view')
  };

  /**
   * Hide all views and show the active one.
   * Runs page-specific lifecycle hooks.
   */
  async function handleRoute() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    let activeRoute = null;
    let params = [];

    for (const r of routes) {
      const match = path.match(r.pattern);
      if (match) {
        activeRoute = r;
        params = match.slice(1);
        break;
      }
    }

    // Default to portfolio if route not matched
    if (!activeRoute) {
      activeRoute = routes[0];
    }

    // Toggle view elements in DOM
    for (const [key, element] of Object.entries(views)) {
      if (element) {
        if (key === activeRoute.view) {
          element.classList.remove('hidden');
        } else {
          element.classList.add('hidden');
        }
      }
    }

    // Scroll to top or to hash element
    if (activeRoute.view === 'portfolio' && hash) {
      const targetId = hash.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Track analytics page view
    sendPageViewAnalytics(path);

    // Run active page hooks
    runViewHooks(activeRoute.view, params);

    // Update active nav-link highlighting
    updateNavLinks(path, hash);
  }

  /**
   * Run module initializations depending on active viewport
   */
  function runViewHooks(viewName, params) {
    if (viewName === 'blog-list') {
      if (window.BlogModule && window.BlogModule.loadPostList) {
        window.BlogModule.loadPostList();
      }
    } else if (viewName === 'blog-detail') {
      const slug = params[0];
      if (window.BlogModule && window.BlogModule.loadPostDetail) {
        window.BlogModule.loadPostDetail(slug);
      }
    } else if (viewName === 'admin') {
      if (window.AdminModule && window.AdminModule.checkSession) {
        window.AdminModule.checkSession();
      }
    }
  }

  /**
   * Keep navbar highlighted states in sync with current URL
   */
  function updateNavLinks(path, hash) {
    const navLinks = document.querySelectorAll('.nav-links .nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    if (path === '/blog') {
      const blogLink = document.getElementById('blogNavLink');
      if (blogLink) blogLink.classList.add('active');
    } else if (path === '/admin') {
      const adminLink = document.getElementById('adminNavLink');
      if (adminLink) adminLink.classList.add('active');
    } else if (path === '/' && hash) {
      const targetLink = document.querySelector(`.nav-links a[href="/${hash}"]`) || document.querySelector(`.nav-links a[href="${hash}"]`);
      if (targetLink) targetLink.classList.add('active');
    }
  }

  /**
   * Send page view record to the visitor analytics backend
   */
  async function sendPageViewAnalytics(path) {
    try {
      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'page_view',
          path: path,
          referrer: document.referrer || '',
          user_agent: navigator.userAgent
        }),
      });
    } catch (e) {
      console.debug('Analytics failure:', e);
    }
  }

  /**
   * Programmatic routing helper
   */
  function navigate(path) {
    window.history.pushState({}, '', path);
    handleRoute();
  }

  // Intercept click on local anchor links
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    // Check if external or blank target
    if (anchor.target === '_blank' || href.startsWith('http') && !href.startsWith(window.location.origin)) {
      return;
    }

    // Handle local routes
    if (href.startsWith('/') || href.startsWith('#')) {
      e.preventDefault();
      
      // Separate path and hash
      let targetPath = href;
      if (href.startsWith('#')) {
        targetPath = '/' + href;
      }
      
      navigate(targetPath);
    }
  });

  // Handle back/forward events
  window.addEventListener('popstate', handleRoute);

  // Initialize router
  window.Router = {
    navigate,
    init: handleRoute
  };
})();
