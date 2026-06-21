def test_login_success(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "testadminpassword"}
    )
    assert response.status_code == 200
    json_data = response.json()
    assert "access_token" in json_data
    assert json_data["token_type"] == "bearer"

def test_login_invalid_password(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

def test_login_invalid_username(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "nonexistent", "password": "testadminpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"
