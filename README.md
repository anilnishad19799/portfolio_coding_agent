# 🚀 Portfolio

A modern, production-ready personal portfolio website with a clean architecture, containerised deployment, and a phased roadmap for backend integration.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Portfolio.git
cd Portfolio

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your NGROK_AUTHTOKEN (optional)

# 3. Start the development server
make dev
# → http://localhost:8080

# 4. (Optional) Expose via ngrok
make ngrok
# → Dashboard at http://localhost:4040
```

---

## 📋 Available Commands

| Command      | Description                                       |
| ------------ | ------------------------------------------------- |
| `make help`  | Show all available commands                       |
| `make dev`   | Start local dev server with live-reload           |
| `make prod`  | Build & start full production stack               |
| `make ngrok` | Start ngrok tunnel (requires token in `.env`)     |
| `make stop`  | Stop all running containers                       |
| `make logs`  | Tail container logs                               |
| `make clean` | Stop containers & remove volumes/images           |
| `make build` | Rebuild all images from scratch (no cache)        |

---

## 📁 Project Structure

```
Portfolio/
├── frontend/               # Static website files
│   ├── index.html           # Main HTML page
│   ├── css/                 # Stylesheets
│   │   └── styles.css
│   ├── js/                  # JavaScript modules
│   │   └── main.js
│   └── assets/              # Static assets
│       └── images/
├── docker/                  # Docker configuration
│   └── Dockerfile           # Nginx-based container
├── nginx/                   # Nginx configuration
│   └── nginx.conf           # Production-ready server config
├── docker-compose.yml       # Service orchestration
├── Makefile                 # Developer workflow commands
├── .env.example             # Environment variable template
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

---

## 🗺️ Roadmap

### Phase 1 — Static Frontend ✅
- [x] HTML/CSS/JS portfolio site
- [x] Dockerised Nginx serving
- [x] Gzip compression & cache headers
- [x] Security headers
- [x] Ngrok tunnel for public access
- [x] Makefile dev workflow

### Phase 2 — Backend API
- [ ] FastAPI backend service
- [ ] Contact form API endpoint
- [ ] Nginx reverse proxy to `/api/`
- [ ] SQLite/PostgreSQL integration
- [ ] Docker multi-service compose

### Phase 3 — Enhancements
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Custom domain & SSL (Let's Encrypt)
- [ ] Analytics integration
- [ ] CMS for blog/content management
- [ ] Performance monitoring

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
