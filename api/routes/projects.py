from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import ProjectOut, ProjectCreate, ProjectUpdate, ProjectReorder
from ..auth import get_current_user
from .. import crud

router = APIRouter(
    prefix="/api/projects",
    tags=["Projects"]
)

@router.get("", response_model=List[ProjectOut])
def get_projects(db: Session = Depends(get_db)):
    return crud.get_projects(db)

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("", response_model=ProjectOut, status_code=201)
def create_custom_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if project_data.id:
        existing = crud.get_project(db, project_data.id)
        if existing:
            raise HTTPException(status_code=400, detail="Project ID already exists")
    
    return crud.create_custom_project(db, project_data)

@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return crud.update_project(db, project, project_data)

@router.delete("/{project_id}", status_code=200)
def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    crud.delete_project(db, project)
    return {"status": "success", "message": f"Project {project_id} deleted."}

@router.patch("/reorder", status_code=200)
def reorder_projects(
    order_data: List[ProjectReorder],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    crud.reorder_projects(db, [item.dict() for item in order_data])
    return {"status": "success", "message": "Project order updated."}
