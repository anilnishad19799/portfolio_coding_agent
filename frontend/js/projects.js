/**
 * projects.js - Project Filtering & Rendering Module
 * 
 * Handles dynamic rendering of GitHub repository cards with
 * category filtering, search, skeleton loading states, and
 * error handling with retry capability.
 * 
 * @author Nishad Anil
 */

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const FOLDER_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;

const EXTERNAL_LINK_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;

// ─── State ───────────────────────────────────────────────────────────────────

/** Currently active category filter */
let activeCategory = 'All';

/** Stores all categorized repos after initial fetch */
let allRepos = [];

// ─── Main Initialization ─────────────────────────────────────────────────────

/**
 * Initialize the projects section.
 * Shows skeleton loading, fetches repos, categorizes them,
 * then renders filters and the project grid.
 */
async function initProjects() {
  const grid = document.querySelector('.projects-grid');
  if (!grid) {
    console.warn('Projects grid container not found');
    return;
  }

  // Show loading skeletons while data is being fetched
  renderSkeleton();

  try {
    const repos = await window.GitHubAPI.fetchRepos();

    // Categorize each repo and attach the category as a property, prioritizing backend value
    allRepos = repos.map(repo => ({
      ...repo,
      category: repo.category || window.GitHubAPI.categorizeRepo(repo),
    }));

    // Render the filter bar and project cards
    renderFilters(allRepos);
    renderProjects(allRepos);

    // Wire up search input if it exists
    const searchInput = document.querySelector('.project-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchProjects(e.target.value.trim());
      });
    }
  } catch (error) {
    console.error('Failed to initialize projects:', error);
    renderError();
  }
}

// ─── Filter Rendering ────────────────────────────────────────────────────────

/**
 * Render category filter buttons above the project grid.
 * Extracts unique categories from repos and creates interactive
 * filter pills with 'All' as the default active filter.
 * 
 * @param {Array} repos - Array of categorized repo objects
 */
function renderFilters(repos) {
  const filterContainer = document.querySelector('.project-filters');
  if (!filterContainer) return;

  // Extract unique categories and sort alphabetically
  const categories = [...new Set(repos.map(r => r.category))].sort();

  // 'All' always comes first
  const allCategories = ['All', ...categories];

  filterContainer.innerHTML = allCategories
    .map(cat => {
      const count = cat === 'All'
        ? repos.length
        : repos.filter(r => r.category === cat).length;

      return `
        <button 
          class="filter-btn ${cat === 'All' ? 'active' : ''}" 
          data-category="${cat}"
          aria-label="Filter by ${cat}"
        >
          ${cat}
          <span class="filter-count">${count}</span>
        </button>
      `;
    })
    .join('');

  // Add click handlers to each filter button
  filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      activeCategory = btn.dataset.category;
      filterProjects(activeCategory);
    });
  });
}

// ─── Project Rendering ───────────────────────────────────────────────────────

/**
 * Render project cards into the .projects-grid container.
 * Each card displays repo metadata: name, description, language,
 * stars, topics, and last update time.
 * 
 * @param {Array} repos - Array of categorized repo objects
 */
function renderProjects(repos) {
  const grid = document.querySelector('.projects-grid');
  if (!grid) return;

  if (repos.length === 0) {
    grid.innerHTML = `
      <div class="no-projects">
        <p>No projects found matching your criteria.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = repos
    .map(repo => {
      const languageColor = window.GitHubAPI.getLanguageColor(repo.language);
      const displayName = cleanRepoName(repo.name);
      const description = repo.description || 'No description provided';
      const date = formatDate(repo.updated_at);

      // Build topics pills HTML
      const topicsHTML = (repo.topics && repo.topics.length > 0)
        ? `<div class="project-topics">
            ${repo.topics.slice(0, 4).map(t =>
              `<span class="topic-pill">${t}</span>`
            ).join('')}
           </div>`
        : '';

      return `
        <article 
          class="project-card animate-on-scroll" 
          data-category="${repo.category}"
          data-name="${repo.name.toLowerCase()}"
          data-description="${description.toLowerCase()}"
        >
          <div class="project-header">
            <span class="project-icon">${FOLDER_ICON}</span>
            <a href="${repo.html_url}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="project-link" 
               aria-label="View ${displayName} on GitHub"
            >
              ${EXTERNAL_LINK_ICON}
            </a>
          </div>

          <h3 class="project-title">${displayName}</h3>
          <p class="project-description">${description}</p>

          ${topicsHTML}

          <div class="project-footer">
            <div class="project-meta">
              ${repo.language
                ? `<span class="project-language">
                    <span class="language-dot" style="background-color: ${languageColor}"></span>
                    ${repo.language}
                   </span>`
                : ''
              }
              ${repo.stargazers_count > 0
                ? `<span class="project-stars">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    ${repo.stargazers_count}
                   </span>`
                : ''
              }
            </div>
            <span class="project-date">${date}</span>
          </div>
        </article>
      `;
    })
    .join('');

  // Re-initialize scroll animations for the new cards
  if (window.Animations && window.Animations.init) {
    // Slight delay to let DOM settle before observing
    requestAnimationFrame(() => {
      setupCardAnimations();
    });
  }
}

/**
 * Set up IntersectionObserver for newly rendered project cards.
 * This ensures cards animate in when they scroll into view.
 */
function setupCardAnimations() {
  const cards = document.querySelectorAll('.project-card.animate-on-scroll:not(.visible)');
  if (cards.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger the animation for sequential cards
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, index * 80);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '-50px' }
  );

  cards.forEach(card => observer.observe(card));
}

// ─── Filtering ───────────────────────────────────────────────────────────────

/**
 * Filter visible projects by category.
 * Shows all cards if category is 'All', otherwise hides
 * non-matching cards and re-triggers scroll animations.
 * 
 * @param {string} category - The category to filter by
 */
function filterProjects(category) {
  const cards = document.querySelectorAll('.project-card');

  cards.forEach(card => {
    if (category === 'All' || card.dataset.category === category) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });

  // Check if a search query is also active
  const searchInput = document.querySelector('.project-search');
  if (searchInput && searchInput.value.trim()) {
    searchProjects(searchInput.value.trim());
  }

  // Re-trigger scroll animations on visible cards
  setupCardAnimations();
}

/**
 * Filter projects by search query, combined with active category filter.
 * Matches against repo name and description.
 * 
 * @param {string} query - The search query string
 */
function searchProjects(query) {
  const cards = document.querySelectorAll('.project-card');
  const normalizedQuery = query.toLowerCase();

  cards.forEach(card => {
    const name = card.dataset.name || '';
    const description = card.dataset.description || '';
    const category = card.dataset.category;

    // Must match both search query AND active category filter
    const matchesSearch = !normalizedQuery ||
      name.includes(normalizedQuery) ||
      description.includes(normalizedQuery);

    const matchesCategory = activeCategory === 'All' || category === activeCategory;

    if (matchesSearch && matchesCategory) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Format a date string into a human-readable relative time.
 * 
 * @param {string} dateString - ISO 8601 date string
 * @returns {string} Relative time (e.g., '3 days ago')
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffMonths < 12) return `${diffMonths} months ago`;
  return `${diffYears} years ago`;
}

/**
 * Clean a repository name for display.
 * Replaces hyphens and underscores with spaces and title-cases each word.
 * 
 * @param {string} name - Raw repository name
 * @returns {string} Human-readable project name
 */
function cleanRepoName(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

// ─── Loading & Error States ──────────────────────────────────────────────────

/**
 * Render 6 skeleton placeholder cards while data is loading.
 * Provides visual feedback that content is being fetched.
 */
function renderSkeleton() {
  const grid = document.querySelector('.projects-grid');
  if (!grid) return;

  const skeletonCards = Array.from({ length: 6 }, () => `
    <article class="project-card skeleton">
      <div class="skeleton-header">
        <div class="skeleton-line skeleton-icon"></div>
        <div class="skeleton-line skeleton-link"></div>
      </div>
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line skeleton-desc"></div>
      <div class="skeleton-line skeleton-desc short"></div>
      <div class="skeleton-footer">
        <div class="skeleton-line skeleton-meta"></div>
        <div class="skeleton-line skeleton-date"></div>
      </div>
    </article>
  `).join('');

  grid.innerHTML = skeletonCards;
}

/**
 * Render an error message with a retry button.
 * Replaces the grid content with a user-friendly error state.
 */
function renderError() {
  const grid = document.querySelector('.projects-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="projects-error">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h3>Unable to load projects</h3>
      <p>There was a problem fetching the repositories. Please try again.</p>
      <button class="retry-btn" onclick="window.Projects.init()">
        Retry
      </button>
    </div>
  `;
}

// ─── Public API ──────────────────────────────────────────────────────────────

window.Projects = {
  init: initProjects,
};
