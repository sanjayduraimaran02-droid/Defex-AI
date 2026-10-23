from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Integer, JSON, String, Text
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Part(Base):
    __tablename__ = "parts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    material = Column(String(150), nullable=True)
    defect_classes = Column(JSON, default=list)  # e.g. ["crack", "porosity", "scratch", "dent", "burr"]
    nominal_dimensions = Column(JSON, default=dict)  # {"length": 150.0, "width": 80.0, "height": 45.0, "unit": "mm"}
    tolerances = Column(JSON, default=dict)  # {"length": 0.05, "width": 0.05, "height": 0.08}
    cad_reference = Column(String(255), nullable=True)
    sample_image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
