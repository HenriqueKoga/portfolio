import os
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


@router.get("/projects/can-create")
async def can_create_project(user: dict = Depends(get_current_user)):
    authorized_user_id = os.getenv("AUTHORIZED_USER_ID")
    print(f"[PROJECTS_API] User ID from token: {user.get('id')}")
    print(f"[PROJECTS_API] Authorized User ID from env: {authorized_user_id}")
    if not authorized_user_id:
        return {"can_create": False}
    return {"can_create": user.get("id") == authorized_user_id}


@router.post("/projects", response_model=Project)
async def create_project(
    project: Project,
    user: dict = Depends(get_current_user),
    service: ProjectService = Depends(get_service)
):
    authorized_user_id = os.getenv("AUTHORIZED_USER_ID")
    print(f"[PROJECTS_API] User ID from token: {user.get('id')}")
    print(f"[PROJECTS_API] Authorized User ID from env: {authorized_user_id}")

    if not authorized_user_id:
        raise HTTPException(status_code=500, detail="AUTHORIZED_USER_ID not set")

    if user.get("id") != authorized_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to create projects")
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


@router.put("/projects/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    project: Project,
    user: dict = Depends(get_current_user),
    service: ProjectService = Depends(get_service)
):
    authorized_user_id = os.getenv("AUTHORIZED_USER_ID")
    print(f"[PROJECTS_API] User ID from token: {user.get('id')}")
    print(f"[PROJECTS_API] Authorized User ID from env: {authorized_user_id}")

    if not authorized_user_id:
        raise HTTPException(status_code=500, detail="AUTHORIZED_USER_ID not set")

    if user.get("id") != authorized_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update projects")

    updated_project = await service.update_project(project_id, project)
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")

    return updated_project


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    user: dict = Depends(get_current_user),
    service: ProjectService = Depends(get_service)
):
    authorized_user_id = os.getenv("AUTHORIZED_USER_ID")
    print(f"[PROJECTS_API] User ID from token: {user.get('id')}")
    print(f"[PROJECTS_API] Authorized User ID from env: {authorized_user_id}")

    if not authorized_user_id:
        raise HTTPException(status_code=500, detail="AUTHORIZED_USER_ID not set")

    if user.get("id") != authorized_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete projects")

    success = await service.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"message": "Project deleted successfully"}
