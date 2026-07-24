from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class CitaBase(BaseModel):
    nombre_cliente: Optional[str] = None
    telefono: Optional[str] = None
    servicio: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    estado: Optional[int] = None  # 1=Pendiente, 2=Confirmada, 3=Cancelada, 4=Completada

class CitaCrear(CitaBase):
    nombre_cliente: str
    fecha_inicio: datetime

class CitaOut(CitaBase):
    id_cita: int
    model_config = ConfigDict(from_attributes=True)