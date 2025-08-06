from abc import ABC, abstractmethod
from typing import List, Optional

from pydantic import BaseModel


class Project(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    stack: List[str]
    repo_url: str
    tags: List[str]
    visible: bool


class ProjectRepository(ABC):

    @abstractmethod
    def list_all(self) -> List[Project]: pass

    @abstractmethod
    def get_by_id(self, project_id: int) -> Optional[Project]: pass

    @abstractmethod
    def create(self, project: Project) -> Project: pass

    @abstractmethod
    def update(self, project_id: str, project: Project) -> Optional[Project]: pass

    @abstractmethod
    def delete(self, project_id: str) -> bool: pass
