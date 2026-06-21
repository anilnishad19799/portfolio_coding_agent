/**
 * github.js - GitHub API Integration Module
 * 
 * Handles all GitHub API communication with localStorage caching.
 * Provides repo categorization, language color mapping, and
 * fallback data for when the API is rate-limited.
 * 
 * @author Nishad Anil
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const GITHUB_USERNAME = 'anilnishad19799';
const GITHUB_API_BASE = 'https://api.github.com';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const CACHE_KEY_REPOS = 'portfolio_repos';
const CACHE_KEY_PROFILE = 'portfolio_profile';

// ─── Fallback Repository Data ────────────────────────────────────────────────
// Used when the GitHub API is rate-limited (60 req/hr for unauthenticated)

const FALLBACK_REPOS = [
  {
    name: 'Advanced-RAG',
    full_name: `${GITHUB_USERNAME}/Advanced-RAG`,
    html_url: `https://github.com/${GITHUB_USERNAME}/Advanced-RAG`,
    description: 'Advanced Retrieval-Augmented Generation techniques and implementations',
    language: 'Python',
    stargazers_count: 0,
    forks_count: 0,
    topics: ['rag', 'retrieval', 'vector'],
    updated_at: new Date().toISOString(),
    fork: false,
  },
  {
    name: 'AI-Powered-Code-Review-Agent-System',
    full_name: `${GITHUB_USERNAME}/AI-Powered-Code-Review-Agent-System`,
    html_url: `https://github.com/${GITHUB_USERNAME}/AI-Powered-Code-Review-Agent-System`,
    description: 'A production-ready multi-agent system that automatically reviews your Pull Requests using AI',
    language: 'Python',
    stargazers_count: 1,
    forks_count: 0,
    topics: ['agent', 'ai', 'code-review'],
    updated_at: new Date().toISOString(),
    fork: false,
  },
  {
    name: 'agent-memory-system-langgraph',
    full_name: `${GITHUB_USERNAME}/agent-memory-system-langgraph`,
    html_url: `https://github.com/${GITHUB_USERNAME}/agent-memory-system-langgraph`,
    description: 'Agent memory system built with LangGraph',
    language: 'Python',
    stargazers_count: 0,
    forks_count: 0,
    topics: ['agent', 'langgraph', 'memory'],
    updated_at: new Date().toISOString(),
    fork: false,
  },
  {
    name: 'agentic-ai-guardrails',
    full_name: `${GITHUB_USERNAME}/agentic-ai-guardrails`,
    html_url: `https://github.com/${GITHUB_USERNAME}/agentic-ai-guardrails`,
    description: 'Production-ready guardrails for Agentic AI',
    language: 'Jupyter Notebook',
    stargazers_count: 0,
    forks_count: 0,
    topics: ['guardrails', 'agentic-ai', 'safety'],
    updated_at: new Date().toISOString(),
    fork: false,
  },
  {
    name: 'Langgraph',
    full_name: `${GITHUB_USERNAME}/Langgraph`,
    html_url: `https://github.com/${GITHUB_USERNAME}/Langgraph`,
    description: 'LangGraph agent workflows and implementations',
    language: 'Python',
    stargazers_count: 0,
    forks_count: 0,
    topics: ['langgraph', 'agent'],
    updated_at: new Date().toISOString(),
    fork: false,
  },
  {
    name: 'MCP_server',
    full_name: `${GITHUB_USERNAME}/MCP_server`,
    html_url: `https://github.com/${GITHUB_USERNAME}/MCP_server`,
    description: 'MCP server with local database, playwright, local Math tool and agent',
    language: 'Python',
    stargazers_count: 0,
    forks_count: 0,
    topics: ['mcp', 'server', 'agent'],
    updated_at: new Date().toISOString(),
    fork: false,
  },
  {
    name: 'fastapi-cicd-demo',
    full_name: `${GITHUB_USERNAME}/fastapi-cicd-demo`,
    html_url: `https://github.com/${GITHUB_USERNAME}/fastapi-cicd-demo`,
    description: 'FastAPI CI/CD pipeline demo with Docker',
    language: 'Dockerfile',
    stargazers_count: 0,
    forks_count: 0,
    topics: ['cicd', 'fastapi', 'docker'],
    updated_at: new Date().toISOString(),
    fork: false,
  },
  {
    name: 'GraphRAG',
    full_name: `${GITHUB_USERNAME}/GraphRAG`,
    html_url: `https://github.com/${GITHUB_USERNAME}/GraphRAG`,
    description: 'Graph-based Retrieval-Augmented Generation',
    language: 'Python',
    stargazers_count: 0,
    forks_count: 0,
    topics: ['rag', 'graph', 'retrieval'],
    updated_at: new Date().toISOString(),
    fork: false,
  },
  {
    name: 'realtime-rag-pipeline',
    full_name: `${GITHUB_USERNAME}/realtime-rag-pipeline`,
    html_url: `https://github.com/${GITHUB_USERNAME}/realtime-rag-pipeline`,
    description: 'Real-time RAG pipeline for live data retrieval',
    language: 'Python',
    stargazers_count: 0,
    forks_count: 0,
    topics: ['rag', 'pipeline', 'realtime'],
    updated_at: new Date().toISOString(),
    fork: false,
  },
  {
    name: 'peft-lora-llm-finetuning',
    full_name: `${GITHUB_USERNAME}/peft-lora-llm-finetuning`,
    html_url: `https://github.com/${GITHUB_USERNAME}/peft-lora-llm-finetuning`,
    description: 'Parameter-Efficient Fine-Tuning with LoRA for LLMs',
    language: 'Python',
    stargazers_count: 0,
    forks_count: 0,
    topics: ['peft', 'lora', 'finetuning', 'llm'],
    updated_at: new Date().toISOString(),
    fork: false,
  },
];

// ─── Language Color Mapping ──────────────────────────────────────────────────

/** Maps programming language names to their GitHub-style hex colors */
const LANGUAGE_COLORS = {
  'Python': '#3572A5',
  'JavaScript': '#f1e05a',
  'Jupyter Notebook': '#DA5B0B',
  'Dockerfile': '#384d54',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'Shell': '#89e051',
  'TypeScript': '#3178c6',
};

// ─── Cache Functions ─────────────────────────────────────────────────────────

/**
 * Retrieve cached data from localStorage.
 * Returns null if the cache key doesn't exist or the data has expired.
 * 
 * @param {string} key - The localStorage key to look up
 * @returns {*|null} The cached data, or null if expired/missing
 */
function getCachedData(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    const now = Date.now();

    // Check if the cached data has expired
    if (now - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }

    return cached.data;
  } catch (error) {
    // If JSON parsing fails or any other error, clear the corrupt entry
    console.warn(`Cache read error for key "${key}":`, error);
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Store data in localStorage with a timestamp for TTL-based expiration.
 * 
 * @param {string} key - The localStorage key
 * @param {*} data - The data to cache (must be JSON-serializable)
 */
function setCachedData(key, data) {
  try {
    const entry = {
      timestamp: Date.now(),
      data: data,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    // localStorage might be full or unavailable (e.g., private browsing)
    console.warn(`Cache write error for key "${key}":`, error);
  }
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Fetch the user profile. Returns cached data if available,
 * otherwise returns static profile data.
 * 
 * @returns {Promise<Object>} The user profile object
 */
async function fetchProfile() {
  // Return a static profile
  return {
    login: GITHUB_USERNAME,
    name: 'Nishad Anil',
    avatar_url: `https://github.com/${GITHUB_USERNAME}.png`,
    html_url: `https://github.com/${GITHUB_USERNAME}`,
    bio: 'Senior AI/ML Engineer',
    public_repos: 40,
    followers: 0,
    following: 0,
  };
}

/**
 * Fetch all public repositories from the backend API.
 * Falls back to FALLBACK_REPOS on error.
 * 
 * @returns {Promise<Array>} Array of repository objects
 */
async function fetchRepos() {
  try {
    const response = await fetch('/api/projects');

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const repos = await response.json();
    console.log(`Fetched ${repos.length} repos from backend API`);
    return repos;
  } catch (error) {
    console.warn('Failed to fetch repos from backend API, using fallback data:', error);
    
    // Map fallback repositories to backend-like schema
    return FALLBACK_REPOS.map((repo, idx) => ({
      id: repo.id || `fallback-${idx}`,
      name: repo.name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count || 0,
      topics: repo.topics || [],
      category: repo.category || categorizeRepo(repo),
      is_custom: false,
      display_order: idx,
      updated_at: repo.updated_at || new Date().toISOString()
    }));
  }
}

// ─── Categorization ─────────────────────────────────────────────────────────

/**
 * Categorize a repository based on its name, description, and topics.
 * Categories are matched in priority order — the first match wins.
 * 
 * @param {Object} repo - A GitHub repository object
 * @returns {string} The category name
 */
function categorizeRepo(repo) {
  // Combine name, description, and topics into a single searchable string
  const name = (repo.name || '').toLowerCase();
  const description = (repo.description || '').toLowerCase();
  const topics = (repo.topics || []).join(' ').toLowerCase();
  const searchText = `${name} ${description} ${topics}`;

  // Category rules in priority order
  // Each rule: [category, keywords[], excludeKeywords[]]
  const rules = [
    {
      category: 'RAG',
      keywords: ['rag', 'retrieval', 'vector'],
    },
    {
      category: 'Agentic AI',
      keywords: ['agent', 'langgraph', 'mcp', 'guardrail', 'a2a'],
    },
    {
      category: 'AI/ML',
      keywords: [
        'ml', 'classification', 'mlflow', 'finetuning', 'peft',
        'lora', 'diffusion', 'image', 'vision', 'research',
      ],
    },
    {
      category: 'DevOps',
      keywords: ['cicd', 'ci-cd', 'aws', 'docker', 'kubernetes', 'dvc', 'floci'],
    },
    {
      category: 'Web Dev',
      keywords: ['django', 'full_stack', 'web', 'frontend'],
    },
    {
      category: 'NLP',
      keywords: ['nlp', 'text', 'language'],
      exclude: ['langgraph'], // "langgraph" contains "language" but isn't NLP
    },
    {
      category: 'Programming',
      keywords: ['python', 'dsa', 'basic', 'algorithm'],
    },
  ];

  for (const rule of rules) {
    const matchesKeyword = rule.keywords.some(kw => searchText.includes(kw));

    if (matchesKeyword) {
      // Check exclusions if any
      if (rule.exclude && rule.exclude.some(ex => searchText.includes(ex))) {
        continue; // Skip this rule if exclusion matches
      }
      return rule.category;
    }
  }

  return 'Other';
}

/**
 * Get the hex color associated with a programming language.
 * Returns a default slate color for unknown languages.
 * 
 * @param {string} language - The programming language name
 * @returns {string} Hex color code
 */
function getLanguageColor(language) {
  return LANGUAGE_COLORS[language] || '#94a3b8';
}

// ─── Public API ──────────────────────────────────────────────────────────────

window.GitHubAPI = {
  fetchProfile,
  fetchRepos,
  categorizeRepo,
  getLanguageColor,
};
