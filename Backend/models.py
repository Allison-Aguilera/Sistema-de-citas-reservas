from sqlalchemy import Column, Integer, String, DateTime, Numeric, Identity
from Backend.database import Base

class Cita(Base):
    __tablename__ = "cita"

    id_cita = Column(Integer, Identity(start=1, always=False), primary_key=True)
    nombre_cliente = Column(String(150), nullable=True)
    telefono = Column(String(30), nullable=True)
    servicio = Column(String(150), nullable=True)
    fecha_inicio = Column(DateTime, nullable=True)
    fecha_fin = Column(DateTime, nullable=True)
    estado = Column(Numeric, nullable=True)