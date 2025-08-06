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
        data = project.model_dump()
        data["_id"] = ObjectId()  # novo ObjectId
        del data["id"]

        await self.collection.insert_one(data)
        project.id = str(data["_id"])
        return project

    async def update(self, project_id: str, project: Project) -> Project | None:
        try:
            data = project.model_dump()
            del data["id"]  # Remove id from update data

            result = await self.collection.update_one(
                {"_id": ObjectId(project_id)},
                {"$set": data}
            )

            if result.modified_count > 0:
                # Return the updated project
                return await self.get_by_id(project_id)
            return None
        except Exception as e:
            print(f"Error updating project {project_id}: {e}")
            return None

    async def delete(self, project_id: str) -> bool:
        try:
            result = await self.collection.delete_one({"_id": ObjectId(project_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting project {project_id}: {e}")
            return False
