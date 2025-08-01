from app.domain.project import Project

def test_project_creation():
    project = Project(
        name="Test Project",
        description="A test project",
        stack=["Python", "FastAPI"],
        repo_url="http://github.com/test/test-project",
        tags=["test", "testing"],
        visible=True
    )
    assert project.name == "Test Project"
    assert project.description == "A test project"
    assert project.stack == ["Python", "FastAPI"]
    assert project.repo_url == "http://github.com/test/test-project"
    assert project.tags == ["test", "testing"]
    assert project.visible is True
