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


@router.get("/comments/all_public", response_model=List[Comment])
def get_all_public_comments(service: CommentService = Depends(get_service)):
    return service.get_all_public_comments()


@router.get("/comments/my", response_model=List[Comment])
def get_my_comments(user: dict = Depends(get_current_user), service: CommentService = Depends(get_service)):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return service.get_comments_by_user(user["id"])


@router.post("/comments", response_model=Comment, status_code=status.HTTP_201_CREATED)
def post_comment(comment: CommentCreate, user: dict = Depends(get_current_user), service: CommentService = Depends(get_service)):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    created_comment = service.create_comment(comment, user["id"], user["name"])
    return created_comment
