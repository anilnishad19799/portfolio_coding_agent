import sys
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure the root of the project is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.pool import StaticPool
from api.database import Base, get_db
from api.main import app
from api.models import User
from api.auth import get_password_hash

# Use StaticPool to maintain a single connection for SQLite in-memory database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Initialize in-memory database schema
    Base.metadata.create_all(bind=engine)
    db_session = TestingSessionLocal()
    
    # Seed default admin user
    hashed = get_password_hash("testadminpassword")
    admin_user = User(username="admin", hashed_password=hashed)
    db_session.add(admin_user)
    db_session.commit()
    
    yield db_session
    
    db_session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    from fastapi.testclient import TestClient
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
