from app.domain.project import Project, ProjectRepository
from app.infrastructure.db.mongo import get_mongo_collection
from bson import ObjectId


class ProjectMongoRepository(ProjectRepository):
    def __init__(self):
        self.collection = get_mongo_collection("projects")

    async def list_all(self) -> list[Project]:
        cursor = self.collection.find({})
        docs = await cursor.to_list(length=None)
        return [Project(**{**doc, "id": str(doc["_id"])}) for doc in docs]

    async def get_by_id(self, project_id: str) -> Project | None:
        doc = await self.collection.find_one({"_id": ObjectId(project_id)})
        if doc:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            return Project(**doc)
        return None

    async def create(self, project: Project) -> Project:
        data = project.dict()
        data["_id"] = ObjectId()  # novo ObjectId
        del data["id"]

        await self.collection.insert_one(data)
        project.id = str(data["_id"])
        return project
