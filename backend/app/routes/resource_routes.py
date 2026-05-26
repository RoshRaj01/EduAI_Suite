from fastapi import APIRouter
from app.models.resource import Resource

resource_router = APIRouter(prefix="/resources", tags=["Resources"])

@resource_router.get("/{course_id}")
async def get_resources(course_id: int):
    return await Resource.find(Resource.course_id == course_id).to_list()