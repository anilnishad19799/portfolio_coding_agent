/**
 * blog.js - Blog Listing and Reading Module
 * 
 * Fetches blog content from backend, renders post lists with tag styling,
 * formats metadata, parses Markdown headings to build a TOC, and manages
 * active scroll highlights.
 * 
 * @author Nishad Anil
 */

(function () {
  const blogPostsList = document.getElementById('blogPostsList');
  const blogPostTitle = document.getElementById('blogPostTitle');
  const blogPostDate = document.getElementById('blogPostDate');
  const blogPostTags = document.getElementById('blogPostTags');
  const blogPostBody = document.getElementById('blogPostBody');
  const blogPostTOC = document.getElementById('blogPostTOC');

  /**
   * Helper to format datetime strings
   */
  function formatDate(dateString) {
    if (!dateString) return 'Draft';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Load and render the list of published posts
   */
  async function loadPostList() {
    if (!blogPostsList) return;
    blogPostsList.innerHTML = '<div class="loading-spinner">Loading article list...</div>';

    try {
      const response = await fetch('/api/posts');
      if (!response.ok) throw new Error('Failed to load posts');
      const posts = await response.json();

      if (posts.length === 0) {
        blogPostsList.innerHTML = `
          <div class="empty-blog-state" style="text-align: center; padding: 4rem 1rem;">
            <p style="font-size: 1.25rem; opacity: 0.7; margin-bottom: 1.5rem;">No blog posts have been published yet.</p>
            <a href="/" class="btn btn-secondary">Go to Home</a>
          </div>
        `;
        return;
      }

      let html = '<div class="blog-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem;">';
      posts.forEach(post => {
        const coverImg = post.cover_image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect fill="%231e293b" width="800" height="450"/><text x="400" y="240" text-anchor="middle" font-size="40" fill="%2306b6d4" font-family="sans-serif">🧠 Nishad Anil Blog</text></svg>';
        const excerptText = post.excerpt || (post.content_md.substring(0, 140) + '...');
        const dateStr = formatDate(post.published_at);
        const tagsHTML = post.tags.map(t => `<span class="blog-tag" style="background: rgba(6, 182, 212, 0.1); color: var(--color-primary); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-right: 0.5rem; font-weight: 500;">#${t}</span>`).join('');

        html += `
          <article class="blog-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.3s ease, border-color 0.3s ease;">
            <div class="blog-card-image" style="height: 180px; overflow: hidden; position: relative;">
              <img src="${coverImg}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;">
            </div>
            <div class="blog-card-content" style="padding: 1.5rem; display: flex; flex-direction: column; flex-grow: 1;">
              <div class="blog-card-meta" style="font-size: 0.8rem; opacity: 0.7; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>${dateStr}</span>
              </div>
              <h3 class="blog-card-title" style="margin-bottom: 0.75rem; font-size: 1.25rem; font-weight: 600; line-height: 1.4;">
                <a href="/blog/${post.slug}" style="color: var(--text-color); transition: color 0.3s ease;">${post.title}</a>
              </h3>
              <p class="blog-card-excerpt" style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 1.25rem; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                ${excerptText}
              </p>
              <div style="margin-top: auto;">
                <div class="blog-card-tags" style="margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 0.25rem;">
                  ${tagsHTML}
                </div>
                <a href="/blog/${post.slug}" class="btn btn-secondary btn-sm" style="width: 100%; justify-content: center;">Read Article</a>
              </div>
            </div>
          </article>
        `;
      });
      html += '</div>';
      blogPostsList.innerHTML = html;

      // Add simple hover effect on card images
      const cards = blogPostsList.querySelectorAll('.blog-card');
      cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-4px)';
          card.style.borderColor = 'var(--color-primary)';
          const img = card.querySelector('img');
          if (img) img.style.transform = 'scale(1.05)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'none';
          card.style.borderColor = 'var(--border-color)';
          const img = card.querySelector('img');
          if (img) img.style.transform = 'none';
        });
      });
    } catch (e) {
      console.error(e);
      blogPostsList.innerHTML = '<div class="error-text">Failed to fetch articles. Please try again later.</div>';
    }
  }

  /**
   * Fetch a single post detail and build the layout
   */
  async function loadPostDetail(slug) {
    if (!blogPostBody) return;
    
    // Clear out current detail
    blogPostTitle.textContent = 'Loading article...';
    blogPostDate.textContent = '';
    blogPostTags.innerHTML = '';
    blogPostBody.innerHTML = '<div class="loading-spinner">Loading article...</div>';
    blogPostTOC.innerHTML = '';

    try {
      // Fetch post details. Router sends admin token implicitly if present in headers, 
      // but let's make sure we include Auth token if it exists in localStorage for drafts view support.
      const headers = {};
      const token = localStorage.getItem('admin_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/posts/${slug}`, { headers });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Article not found.');
        } else {
          throw new Error('Failed to load article.');
        }
      }
      const post = await response.json();

      blogPostTitle.textContent = post.title;
      blogPostDate.textContent = formatDate(post.published_at || post.created_at);
      blogPostTags.innerHTML = post.tags.map(t => `<span class="blog-tag" style="background: rgba(6, 182, 212, 0.1); color: var(--color-primary); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-right: 0.5rem; font-weight: 500;">#${t}</span>`).join('');
      
      // Inject content HTML
      blogPostBody.innerHTML = post.content_html;

      // TOC Generation
      generateTOC(blogPostBody, blogPostTOC);
    } catch (e) {
      console.error(e);
      blogPostTitle.textContent = 'Error';
      blogPostBody.innerHTML = `<div class="error-text" style="color:#ef4444; font-weight:500;">${e.message}</div>`;
      blogPostTOC.parentElement.style.display = 'none';
    }
  }

  /**
   * Parse heading tags (h2/h3) from body element and create sidebar links
   */
  function generateTOC(bodyElement, tocElement) {
    tocElement.innerHTML = '';
    const headings = bodyElement.querySelectorAll('h2, h3');
    
    if (headings.length === 0) {
      tocElement.parentElement.style.display = 'none';
      return;
    }

    tocElement.parentElement.style.display = 'block';
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.padding = '0';
    ul.style.margin = '0';

    headings.forEach((heading, index) => {
      // Ensure heading has an ID
      const text = heading.textContent;
      const id = heading.id || text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      heading.id = id;

      const li = document.createElement('li');
      li.style.marginBottom = '0.5rem';
      
      const indent = heading.tagName.toLowerCase() === 'h3' ? '1rem' : '0';
      li.style.paddingLeft = indent;

      const a = document.createElement('a');
      a.href = `#${id}`;
      a.textContent = text;
      a.style.color = 'var(--text-color)';
      a.style.opacity = '0.7';
      a.style.textDecoration = 'none';
      a.style.fontSize = '0.9rem';
      a.style.transition = 'color 0.2s, opacity 0.2s';
      
      a.addEventListener('click', (e) => {
        e.preventDefault();
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, null, `#${id}`);
        
        tocElement.querySelectorAll('a').forEach(l => {
          l.style.opacity = '0.7';
          l.style.color = 'var(--text-color)';
        });
        a.style.opacity = '1';
        a.style.color = 'var(--color-primary)';
      });

      li.appendChild(a);
      ul.appendChild(li);
    });

    tocElement.appendChild(ul);
    setupTOCScrollSpy(bodyElement, tocElement);
  }

  /**
   * IntersectionObserver tracking visible sections to highlight TOC
   */
  function setupTOCScrollSpy(bodyElement, tocElement) {
    const headings = bodyElement.querySelectorAll('h2, h3');
    const tocLinks = tocElement.querySelectorAll('a');
    if (headings.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tocLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
              link.style.opacity = '1';
              link.style.color = 'var(--color-primary)';
            } else {
              link.style.opacity = '0.7';
              link.style.color = 'var(--text-color)';
            }
          });
        }
      });
    }, {
      rootMargin: '-100px 0px -75% 0px',
      threshold: 0
    });

    headings.forEach(h => observer.observe(h));
  }

  window.BlogModule = {
    loadPostList,
    loadPostDetail
  };
})();
