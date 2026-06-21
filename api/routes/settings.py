import logging
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import SettingOut, SettingUpdate
from ..auth import get_current_user
from .. import crud

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/settings",
    tags=["Settings"]
)

@router.get("", response_model=List[SettingOut])
def get_settings(db: Session = Depends(get_db)):
    return crud.get_settings(db)

@router.put("/{key}", response_model=SettingOut)
def update_setting(
    key: str,
    setting_data: SettingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    setting = crud.update_setting(db, key, setting_data)
    logger.info(f"Admin updated setting: {key}")
    return setting
