from typing import List

from app.application.comment_service import CommentService
from app.domain.comment import Comment, CommentCreate
from app.infrastructure.comment_mongo_repository import CommentMongoRepository
from app.infrastructure.publisher import RabbitMQPublisher
from app.routes.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter()


def get_service():
    publisher = RabbitMQPublisher()
    repository = CommentMongoRepository()
    return CommentService(repository, publisher)


@router.get("/comments/public", response_model=List[Comment])
def get_comments(user: dict = Depends(get_current_user), service: CommentService = Depends(get_service)):
    return service.get_public_comments()


@router.post("/comments", status_code=status.HTTP_201_CREATED)
def post_comment(comment: CommentCreate, user: dict = Depends(get_current_user), service: CommentService = Depends(get_service)):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return {"id": service.create_comment(comment, user["id"], user["name"])}
