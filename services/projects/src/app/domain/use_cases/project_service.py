from typing import List, Optional

from app.domain.project import Project, ProjectRepository


class ProjectService:
    def __init__(self, repository: ProjectRepository):
        self.repository = repository

    async def list_projects(self) -> List[Project]:
        return await self.repository.list_all()

    async def get_project(self, project_id: str) -> Optional[Project]:
        return await self.repository.get_by_id(project_id)

    async def create_project(self, project: Project) -> Project:
        return await self.repository.create(project)
