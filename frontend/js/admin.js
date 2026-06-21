/**
 * admin.js - Admin CMS Control Panel
 * 
 * Manages JWT authorization session state, CRUD operations for projects
 * and blog posts, inbox rendering, live markdown preview parsing, and 
 * responsive CSS-based analytics charts.
 * 
 * @author Nishad Anil
 */

(function () {
  // View Containers
  const loginContainer = document.getElementById('adminLoginContainer');
  const dashboardContainer = document.getElementById('adminDashboardContainer');
  
  // Forms
  const loginForm = document.getElementById('adminLoginForm');
  const loginErrorMsg = document.getElementById('loginErrorMessage');
  const projectForm = document.getElementById('projectForm');
  const postForm = document.getElementById('postForm');

  // Modals
  const projectModal = document.getElementById('projectModal');
  const postModal = document.getElementById('postModal');

  // Tables & Lists
  const projectsTableBody = document.querySelector('#adminProjectsTable tbody');
  const postsTableBody = document.querySelector('#adminPostsTable tbody');
  const inboxList = document.getElementById('adminInboxList');

  // Check login session
  function checkSession() {
    const token = localStorage.getItem('admin_token');
    if (token) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    loginContainer.classList.remove('hidden');
    dashboardContainer.classList.add('hidden');
    if (loginForm) loginForm.reset();
    if (loginErrorMsg) loginErrorMsg.classList.add('hidden');
  }

  function showDashboard() {
    loginContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    loadDashboardData();
  }

  // Handle Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginErrorMsg.classList.add('hidden');

      const username = document.getElementById('adminUsername').value;
      const password = document.getElementById('adminPassword').value;

      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Incorrect credentials');
        }

        // Save token
        localStorage.setItem('admin_token', data.access_token);
        showDashboard();
      } catch (err) {
        console.error(err);
        loginErrorMsg.textContent = err.message;
        loginErrorMsg.classList.remove('hidden');
      }
    });
  }

  // Handle Logout
  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('admin_token');
      showLogin();
    });
  }

  // Tab switching
  const tabs = document.querySelectorAll('.admin-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetTab = tab.getAttribute('data-tab');
      const tabContents = document.querySelectorAll('.admin-tab-content');
      tabContents.forEach(content => {
        if (content.id === `tab-${targetTab}`) {
          content.classList.remove('hidden');
          content.classList.add('active');
        } else {
          content.classList.add('hidden');
          content.classList.remove('active');
        }
      });
    });
  });

  // Global Modal Close helper
  window.closeModal = function (modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('hidden');
  };

  function getHeaders() {
    const token = localStorage.getItem('admin_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Core Data Loader
  async function loadDashboardData() {
    loadProjectsCMS();
    loadPostsCMS();
    loadAnalyticsDashboard();
    loadContactsInbox();
  }

  // 1. Projects CMS Loader
  async function loadProjectsCMS() {
    if (!projectsTableBody) return;
    projectsTableBody.innerHTML = '<tr><td colspan="7" style="padding: 1rem; text-align: center;">Loading projects...</td></tr>';
    
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error();
      const projects = await response.json();

      if (projects.length === 0) {
        projectsTableBody.innerHTML = '<tr><td colspan="7" style="padding: 1rem; text-align: center;">No projects configured.</td></tr>';
        return;
      }

      let html = '';
      projects.forEach(p => {
        html += `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 1rem;">
              <input type="number" value="${p.display_order}" data-id="${p.id}" class="proj-order-input" style="width: 50px; padding: 0.25rem; background: var(--bg-body); border: 1px solid var(--border-color); color: var(--text-color); border-radius: 4px;">
            </td>
            <td style="padding: 1rem; font-weight: 500;">${p.name}</td>
            <td style="padding: 1rem;">${p.category}</td>
            <td style="padding: 1rem;">${p.language || 'N/A'}</td>
            <td style="padding: 1rem;">${p.stargazers_count}</td>
            <td style="padding: 1rem;">${p.is_custom ? '✅ Yes' : '🐙 Git'}</td>
            <td style="padding: 1rem; display: flex; gap: 0.5rem;">
              <button class="btn btn-secondary btn-sm edit-proj-btn" data-id="${p.id}">Edit</button>
              <button class="btn btn-danger btn-sm delete-proj-btn" style="background: #ef4444; border-color: #ef4444; color: white;" data-id="${p.id}">Delete</button>
            </td>
          </tr>
        `;
      });
      projectsTableBody.innerHTML = html;

      // Attach inline reordering change triggers
      const orderInputs = projectsTableBody.querySelectorAll('.proj-order-input');
      orderInputs.forEach(input => {
        input.addEventListener('change', async () => {
          const id = input.getAttribute('data-id');
          const order = parseInt(input.value) || 0;
          await updateProjectOrder(id, order);
        });
      });

      // Attach actions
      projectsTableBody.querySelectorAll('.edit-proj-btn').forEach(btn => {
        btn.addEventListener('click', () => openProjectModal(btn.getAttribute('data-id')));
      });
      projectsTableBody.querySelectorAll('.delete-proj-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteProject(btn.getAttribute('data-id')));
      });
    } catch (e) {
      projectsTableBody.innerHTML = '<tr><td colspan="7" style="padding: 1rem; text-align: center; color: #ef4444;">Failed to load projects.</td></tr>';
    }
  }

  async function updateProjectOrder(id, order) {
    try {
      const response = await fetch('/api/projects/reorder', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify([{ id, display_order: order }])
      });
      if (!response.ok) throw new Error();
      // Reload projects list to reflect sorting
      loadProjectsCMS();
    } catch (err) {
      alert('Failed to update project order');
    }
  }

  // 2. Blog CMS Loader
  async function loadPostsCMS() {
    if (!postsTableBody) return;
    postsTableBody.innerHTML = '<tr><td colspan="5" style="padding: 1rem; text-align: center;">Loading blog articles...</td></tr>';

    try {
      const response = await fetch('/api/admin/posts', {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error();
      const posts = await response.json();

      if (posts.length === 0) {
        postsTableBody.innerHTML = '<tr><td colspan="5" style="padding: 1rem; text-align: center;">No posts created yet.</td></tr>';
        return;
      }

      let html = '';
      posts.forEach(post => {
        const pubDate = post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Unpublished';
        const statusBadge = post.status === 'published' 
          ? `<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight:600;">Published</span>`
          : `<span style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight:600;">Draft</span>`;

        html += `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 1rem; font-weight: 500;">${post.title}</td>
            <td style="padding: 1rem;">${post.slug}</td>
            <td style="padding: 1rem;">${statusBadge}</td>
            <td style="padding: 1rem;">${pubDate}</td>
            <td style="padding: 1rem; display: flex; gap: 0.5rem;">
              <button class="btn btn-secondary btn-sm edit-post-btn" data-id="${post.id}">Edit</button>
              <button class="btn btn-danger btn-sm delete-post-btn" style="background: #ef4444; border-color: #ef4444; color: white;" data-id="${post.id}">Delete</button>
            </td>
          </tr>
        `;
      });
      postsTableBody.innerHTML = html;

      // Attach actions
      postsTableBody.querySelectorAll('.edit-post-btn').forEach(btn => {
        btn.addEventListener('click', () => openPostModal(parseInt(btn.getAttribute('data-id'))));
      });
      postsTableBody.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.addEventListener('click', () => deletePost(parseInt(btn.getAttribute('data-id'))));
      });
    } catch (e) {
      postsTableBody.innerHTML = '<tr><td colspan="5" style="padding: 1rem; text-align: center; color: #ef4444;">Failed to load posts.</td></tr>';
    }
  }

  // 3. Analytics Dashboard Loader
  async function loadAnalyticsDashboard() {
    const totalViewsEl = document.getElementById('analyticTotalViews');
    const uniqueVisitorsEl = document.getElementById('analyticUniqueVisitors');

    try {
      const response = await fetch('/api/analytics/summary', {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error();
      const analytics = await response.json();

      if (totalViewsEl) totalViewsEl.textContent = analytics.total_views.toLocaleString();
      if (uniqueVisitorsEl) uniqueVisitorsEl.textContent = analytics.unique_visitors.toLocaleString();

      // Render CSS Charts
      renderBarChart('chartPaths', analytics.top_paths, 'path', 'count');
      renderBarChart('chartReferrers', analytics.top_referrers, 'referrer', 'count');
      renderBarChart('chartDevices', analytics.device_breakdown, 'device', 'count');
      renderBarChart('chartBrowsers', analytics.browser_breakdown, 'browser', 'count');
    } catch (err) {
      console.error('Analytics load error:', err);
    }
  }

  function renderBarChart(containerId, data, keyField, countField) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
      container.innerHTML = '<div style="opacity: 0.5; padding: 1.5rem; text-align: center; font-size: 0.875rem;">No views recorded yet.</div>';
      return;
    }
    
    const maxCount = Math.max(...data.map(d => d[countField] || 0));
    
    let html = '<div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.5rem;">';
    data.forEach(item => {
      const label = item[keyField] || 'Direct / Other';
      const count = item[countField] || 0;
      const percent = maxCount > 0 ? (count / maxCount) * 100 : 0;
      
      html += `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.25rem;">
            <span style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 75%;" title="${label}">${label}</span>
            <span style="font-weight: 600; opacity: 0.9;">${count}</span>
          </div>
          <div style="height: 8px; border-radius: 4px; background: rgba(255,255,255,0.05); overflow: hidden; position: relative;">
            <div style="width: ${percent}%; height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--color-primary), var(--color-secondary)); transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  // 4. Contacts Inbox Loader
  async function loadContactsInbox() {
    if (!inboxList) return;
    inboxList.innerHTML = '<div class="loading-spinner">Loading inbox messages...</div>';

    try {
      const response = await fetch('/api/contacts', {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error();
      const contacts = await response.json();

      if (contacts.length === 0) {
        inboxList.innerHTML = '<div style="opacity: 0.5; padding: 2rem; text-align: center;">No contact messages received.</div>';
        return;
      }

      let html = '';
      contacts.forEach(msg => {
        const sendDate = new Date(msg.created_at).toLocaleString();
        html += `
          <div class="inbox-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h4 style="font-size: 1.1rem; margin-bottom: 0.25rem;">${msg.name}</h4>
                <p style="font-size: 0.85rem; opacity: 0.7;">
                  <a href="mailto:${msg.email}" style="color: var(--color-primary);">${msg.email}</a> &bull; ${sendDate}
                </p>
              </div>
              <button class="btn btn-danger btn-sm delete-msg-btn" style="background: #ef4444; border-color: #ef4444; color: white;" data-id="${msg.id}">Delete</button>
            </div>
            <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
              <p style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.5rem;">Subject: ${msg.subject || 'No Subject'}</p>
              <p style="font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap; opacity: 0.85;">${msg.message}</p>
            </div>
          </div>
        `;
      });
      inboxList.innerHTML = html;

      // Attach actions
      inboxList.querySelectorAll('.delete-msg-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteContactMessage(parseInt(btn.getAttribute('data-id'))));
      });
    } catch (e) {
      inboxList.innerHTML = '<div class="error-text">Failed to load contact messages.</div>';
    }
  }

  async function deleteContactMessage(id) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error();
      loadContactsInbox();
    } catch (err) {
      alert('Failed to delete message');
    }
  }

  // Project CRUD Actions
  async function openProjectModal(id = null) {
    if (projectForm) projectForm.reset();
    
    const titleEl = document.getElementById('projectModalTitle');
    const idInput = document.getElementById('projectFormId');
    const idHidden = document.getElementById('projectModalId');

    if (id) {
      titleEl.textContent = 'Edit Project';
      idInput.disabled = true; // Cannot edit original ID
      
      try {
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) throw new Error();
        const p = await response.json();

        idHidden.value = p.id;
        idInput.value = p.id;
        document.getElementById('projectFormName').value = p.name;
        document.getElementById('projectFormDescription').value = p.description || '';
        document.getElementById('projectFormUrl').value = p.html_url || '';
        document.getElementById('projectFormLanguage').value = p.language || '';
        document.getElementById('projectFormCategory').value = p.category;
        document.getElementById('projectFormStars').value = p.stargazers_count;
        document.getElementById('projectFormTopics').value = p.topics ? p.topics.join(', ') : '';
        document.getElementById('projectFormOrder').value = p.display_order;
      } catch (err) {
        alert('Failed to load project details');
        return;
      }
    } else {
      titleEl.textContent = 'Add Custom Project';
      idInput.disabled = false;
      idHidden.value = '';
    }

    projectModal.classList.remove('hidden');
  }

  if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const modalId = document.getElementById('projectModalId').value;
      const payload = {
        name: document.getElementById('projectFormName').value,
        description: document.getElementById('projectFormDescription').value,
        html_url: document.getElementById('projectFormUrl').value || null,
        language: document.getElementById('projectFormLanguage').value || null,
        category: document.getElementById('projectFormCategory').value,
        stargazers_count: parseInt(document.getElementById('projectFormStars').value) || 0,
        topics: document.getElementById('projectFormTopics').value.split(',').map(s => s.trim()).filter(Boolean),
        display_order: parseInt(document.getElementById('projectFormOrder').value) || 0
      };

      try {
        let response;
        if (modalId) {
          // Update
          response = await fetch(`/api/projects/${modalId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
          });
        } else {
          // Create
          payload.id = document.getElementById('projectFormId').value;
          response = await fetch('/api/projects', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
          });
        }

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to save project');
        }

        projectModal.classList.add('hidden');
        loadProjectsCMS();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  async function deleteProject(id) {
    if (!confirm(`Are you sure you want to delete project: ${id}?`)) return;
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error();
      loadProjectsCMS();
    } catch (err) {
      alert('Failed to delete project');
    }
  }

  // Blog CRUD Actions
  async function openPostModal(id = null) {
    if (postForm) postForm.reset();
    
    const titleEl = document.getElementById('postModalTitle');
    const idHidden = document.getElementById('postModalId');
    const previewEl = document.getElementById('postFormPreview');
    if (previewEl) previewEl.innerHTML = '';

    if (id) {
      titleEl.textContent = 'Edit Blog Post';
      
      try {
        // Fetch post. Need authentication headers to read drafts.
        const response = await fetch(`/api/admin/posts`, { headers: getHeaders() });
        if (!response.ok) throw new Error();
        const posts = await response.json();
        const post = posts.find(p => p.id === id);

        if (!post) throw new Error('Post not found');

        idHidden.value = post.id;
        document.getElementById('postFormTitle').value = post.title;
        document.getElementById('postFormSlug').value = post.slug;
        document.getElementById('postFormExcerpt').value = post.excerpt || '';
        document.getElementById('postFormTags').value = post.tags ? post.tags.join(', ') : '';
        document.getElementById('postFormCover').value = post.cover_image || '';
        document.getElementById('postFormStatus').value = post.status;
        document.getElementById('postFormContent').value = post.content_md;
        
        updateMarkdownPreview(post.content_md);
      } catch (err) {
        alert('Failed to load post details');
        return;
      }
    } else {
      titleEl.textContent = 'Write New Blog Post';
      idHidden.value = '';
    }

    postModal.classList.remove('hidden');
  }

  // Live Preview Event
  const contentTextarea = document.getElementById('postFormContent');
  if (contentTextarea) {
    contentTextarea.addEventListener('input', () => {
      updateMarkdownPreview(contentTextarea.value);
    });
  }

  function updateMarkdownPreview(markdownText) {
    const previewEl = document.getElementById('postFormPreview');
    if (previewEl) {
      previewEl.innerHTML = parseMarkdownSimple(markdownText);
    }
  }

  /**
   * Minimal dependency-free Markdown to HTML parser
   */
  function parseMarkdownSimple(md) {
    if (!md) return '';
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Paragraphs
    html = html.split('\n\n').map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<pre') || p.trim().startsWith('<ul') || p.trim().startsWith('<ol')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
    
    return html;
  }

  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const modalId = document.getElementById('postModalId').value;
      const payload = {
        title: document.getElementById('postFormTitle').value,
        slug: document.getElementById('postFormSlug').value,
        excerpt: document.getElementById('postFormExcerpt').value || null,
        tags: document.getElementById('postFormTags').value.split(',').map(s => s.trim()).filter(Boolean),
        cover_image: document.getElementById('postFormCover').value || null,
        status: document.getElementById('postFormStatus').value,
        content_md: document.getElementById('postFormContent').value
      };

      try {
        let response;
        if (modalId) {
          // Update
          response = await fetch(`/api/posts/${modalId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
          });
        } else {
          // Create
          response = await fetch('/api/posts', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
          });
        }

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to save blog post');
        }

        postModal.classList.add('hidden');
        loadPostsCMS();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  async function deletePost(id) {
    if (!confirm(`Are you sure you want to delete this blog post?`)) return;
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error();
      loadPostsCMS();
    } catch (err) {
      alert('Failed to delete blog post');
    }
  }

  // Trigger setup buttons
  const addProjBtn = document.getElementById('addNewProjectBtn');
  if (addProjBtn) {
    addProjBtn.addEventListener('click', () => openProjectModal());
  }

  const addPostBtn = document.getElementById('addNewPostBtn');
  if (addPostBtn) {
    addPostBtn.addEventListener('click', () => openPostModal());
  }

  // Export module globally
  window.AdminModule = {
    checkSession,
    showLogin,
    showDashboard
  };
})();
