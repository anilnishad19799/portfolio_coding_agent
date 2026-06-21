def test_get_projects_empty(client):
    response = client.get("/api/projects")
    assert response.status_code == 200
    assert response.json() == []

def test_get_project_nonexistent(client):
    response = client.get("/api/projects/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"

def test_create_project_unauthorized(client):
    project_payload = {
        "name": "My Custom Project",
        "description": "Custom description",
        "html_url": "https://github.com/my/project",
        "language": "Python",
        "stargazers_count": 5,
        "topics": ["fastapi", "pytest"],
        "category": "Web Dev",
        "display_order": 1
    }
    response = client.post("/api/projects", json=project_payload)
    assert response.status_code == 401

def test_create_project_success(client):
    # Log in first to get JWT
    login_resp = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "testadminpassword"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    project_payload = {
        "name": "My Custom Project",
        "description": "Custom description",
        "html_url": "https://github.com/my/project",
        "language": "Python",
        "stargazers_count": 5,
        "topics": ["fastapi", "pytest"],
        "category": "Web Dev",
        "display_order": 1
    }
    response = client.post("/api/projects", json=project_payload, headers=headers)
    assert response.status_code == 201
    created_data = response.json()
    assert created_data["name"] == "My Custom Project"
    assert created_data["is_custom"] is True
    assert "id" in created_data

    # Fetch to check if it's there
    resp_get = client.get("/api/projects")
    assert resp_get.status_code == 200
    assert len(resp_get.json()) == 1
    assert resp_get.json()[0]["name"] == "My Custom Project"

def test_update_project(client):
    # Log in
    login_resp = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "testadminpassword"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create project
    project_payload = {"name": "Old Name", "display_order": 1}
    create_resp = client.post("/api/projects", json=project_payload, headers=headers)
    project_id = create_resp.json()["id"]

    # Update project
    update_payload = {"name": "New Name", "description": "New description"}
    update_resp = client.put(f"/api/projects/{project_id}", json=update_payload, headers=headers)
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["name"] == "New Name"
    assert updated_data["description"] == "New description"

def test_delete_project(client):
    # Log in
    login_resp = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "testadminpassword"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create project
    project_payload = {"name": "To Be Deleted"}
    create_resp = client.post("/api/projects", json=project_payload, headers=headers)
    project_id = create_resp.json()["id"]

    # Delete
    del_resp = client.delete(f"/api/projects/{project_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json() == {"status": "success", "message": f"Project {project_id} deleted."}

    # Verify not found
    get_resp = client.get(f"/api/projects/{project_id}")
    assert get_resp.status_code == 404

def test_reorder_projects(client):
    # Log in
    login_resp = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "testadminpassword"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create two projects
    p1 = client.post("/api/projects", json={"name": "Project 1", "display_order": 1}, headers=headers).json()
    p2 = client.post("/api/projects", json={"name": "Project 2", "display_order": 2}, headers=headers).json()

    # Reorder
    reorder_payload = [
        {"id": p1["id"], "display_order": 5},
        {"id": p2["id"], "display_order": 3}
    ]
    reorder_resp = client.patch("/api/projects/reorder", json=reorder_payload, headers=headers)
    assert reorder_resp.status_code == 200

    # Get projects, they should be sorted by display_order asc, so p2 (order 3) comes first now
    projects_list = client.get("/api/projects").json()
    assert projects_list[0]["name"] == "Project 2"
    assert projects_list[1]["name"] == "Project 1"
