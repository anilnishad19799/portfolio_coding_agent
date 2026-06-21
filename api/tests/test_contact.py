def test_submit_contact_success(client):
    payload = {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "subject": "Inquiry",
        "message": "Hello, I would like to query about your work."
    }
    response = client.post("/api/contact", json=payload)
    assert response.status_code == 201
    assert response.json()["status"] == "success"

def test_submit_contact_invalid_email(client):
    payload = {
        "name": "John Doe",
        "email": "not-an-email",
        "subject": "Inquiry",
        "message": "Hello"
    }
    response = client.post("/api/contact", json=payload)
    assert response.status_code == 422 # Pydantic validation error

def test_submit_contact_missing_fields(client):
    payload = {
        "name": "John Doe"
    }
    response = client.post("/api/contact", json=payload)
    assert response.status_code == 422

def test_get_contacts_unauthorized(client):
    response = client.get("/api/contacts")
    assert response.status_code == 401

def test_get_contacts_success(client):
    # Log in
    login_resp = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "testadminpassword"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Submit a contact
    client.post("/api/contact", json={
        "name": "Alice Smith",
        "email": "alice@example.com",
        "message": "Hello message!"
    })

    # Get contacts list as admin
    response = client.get("/api/contacts", headers=headers)
    assert response.status_code == 200
    contacts = response.json()
    assert len(contacts) >= 1
    assert contacts[0]["name"] == "Alice Smith"

def test_delete_contact(client):
    # Log in
    login_resp = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "testadminpassword"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Submit contact
    client.post("/api/contact", json={
        "name": "Bob Jones",
        "email": "bob@example.com",
        "message": "Delete me please."
    })

    # Retrieve contacts to get ID
    contacts = client.get("/api/contacts", headers=headers).json()
    contact_id = contacts[0]["id"]

    # Delete
    del_resp = client.delete(f"/api/contacts/{contact_id}", headers=headers)
    assert del_resp.status_code == 200

    # Verify not in list anymore
    contacts_after = client.get("/api/contacts", headers=headers).json()
    assert not any(c["id"] == contact_id for c in contacts_after)
