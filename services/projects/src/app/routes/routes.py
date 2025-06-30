from typing import List

from app.domain.project import Project
from app.domain.use_cases.project_service import ProjectService
from app.infrastructure.repositories.project_mongo_repository import ProjectMongoRepository
from app.routes.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()


def get_service():
    repository = ProjectMongoRepository()
    return ProjectService(repository)


@router.post("/projects", response_model=Project)
async def create_project(
    project: Project,
    user: dict = Depends(get_current_user),
    service: ProjectService = Depends(get_service)
):
    return await service.create_project(project)


@router.get("/projects", response_model=List[Project])
async def list_projects(
    user: dict = Depends(get_current_user),
    service: ProjectService = Depends(get_service)
):
    return await service.list_projects()


@router.get("/projects/{project_id}", response_model=Project)
async def get_project(
    project_id: str,
    user: dict = Depends(get_current_user),
    service: ProjectService = Depends(get_service)
):
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
