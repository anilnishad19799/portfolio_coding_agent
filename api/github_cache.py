import os
import logging
from datetime import datetime
import httpx
from sqlalchemy.orm import Session
from .models import Project

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GITHUB_USERNAME = os.getenv("GITHUB_USERNAME", "anilnishad19799")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

def categorize_repo(name: str, description: str) -> str:
    name_lower = name.lower()
    desc_lower = (description or "").lower()
    
    # Matching rules
    if "rag" in name_lower or "retrieval" in name_lower or "vector" in name_lower:
        return "RAG"
    elif "agent" in name_lower or "langgraph" in name_lower or "mcp" in name_lower or "guardrail" in name_lower or "a2a" in name_lower:
        return "Agentic AI"
    elif any(kw in name_lower or kw in desc_lower for kw in ["ml", "classification", "mlflow", "finetuning", "peft", "lora", "diffusion", "image", "vision", "research"]):
        return "AI/ML"
    elif any(kw in name_lower or kw in desc_lower for kw in ["cicd", "ci-cd", "aws", "docker", "kubernetes", "dvc", "floci"]):
        return "DevOps"
    elif any(kw in name_lower or kw in desc_lower for kw in ["django", "full_stack", "web", "frontend"]):
        return "Web Dev"
    elif "nlp" in name_lower or "text" in name_lower or "language" in name_lower:
        # Prevent "langgraph" from matching NLP
        if "langgraph" not in name_lower:
            return "NLP"
    elif any(kw in name_lower or kw in desc_lower for kw in ["python", "dsa", "basic", "algorithm"]):
        return "Programming"
    
    # Fallback to description checks if category still not found
    if "rag" in desc_lower or "retrieval" in desc_lower or "vector" in desc_lower:
        return "RAG"
    elif "agent" in desc_lower or "langgraph" in desc_lower or "mcp" in desc_lower or "guardrail" in desc_lower or "a2a" in desc_lower:
        return "Agentic AI"
        
    return "Other"

async def sync_github_projects(db: Session):
    """Fetches public repositories from GitHub and synchronizes them with the SQLite database cache."""
    url = f"https://api.github.com/users/{GITHUB_USERNAME}/repos?per_page=100&sort=updated"
    headers = {"Accept": "application/vnd.github.v3+json"}
    
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
        logger.info("Using GITHUB_TOKEN for authenticated API requests.")
    else:
        logger.warning("No GITHUB_TOKEN set. Using unauthenticated requests (subject to rate limit).")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code != 200:
                logger.error(f"GitHub API returned status {response.status_code}: {response.text}")
                return False
            
            repos = response.json()
            logger.info(f"Successfully fetched {len(repos)} repositories from GitHub.")
            
            # Track GitHub repository IDs we found in this sync
            active_github_ids = set()
            
            for repo in repos:
                repo_id = str(repo["id"])
                active_github_ids.add(repo_id)
                
                # Extract details
                name = repo["name"]
                description = repo.get("description")
                html_url = repo.get("html_url")
                language = repo.get("language")
                stargazers_count = repo.get("stargazers_count", 0)
                topics = repo.get("topics", [])
                
                category = categorize_repo(name, description)
                
                # Check if project already exists in the database
                existing_project = db.query(Project).filter(Project.id == repo_id).first()
                
                if existing_project:
                    # Update fields, but preserve manual overrides if it became custom
                    if not existing_project.is_custom:
                        existing_project.name = name
                        existing_project.description = description
                        existing_project.html_url = html_url
                        existing_project.language = language
                        existing_project.stargazers_count = stargazers_count
                        existing_project.topics = topics
                        existing_project.category = category
                        existing_project.updated_at = datetime.utcnow()
                else:
                    # Create new cached project
                    new_project = Project(
                        id=repo_id,
                        name=name,
                        description=description,
                        html_url=html_url,
                        language=language,
                        stargazers_count=stargazers_count,
                        topics=topics,
                        category=category,
                        is_custom=False,
                        display_order=999 # default low priority
                    )
                    db.add(new_project)
            
            # Clean up old GitHub projects in the database that were deleted or made private on GitHub
            # (i.e. is_custom=False and not in active_github_ids)
            db.query(Project).filter(
                Project.is_custom == False,
                ~Project.id.in_(list(active_github_ids))
            ).delete(synchronize_session=False)
            
            db.commit()
            logger.info("GitHub projects synchronization completed.")
            return True
            
    except Exception as e:
        logger.error(f"Error during GitHub projects sync: {str(e)}")
        db.rollback()
        return False
