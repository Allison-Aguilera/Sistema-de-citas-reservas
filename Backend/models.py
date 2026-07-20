from sqlalchemy import Column, Integer, String, Date, Numeric
from Backend.database import Base

class Cita(Base):
    __tablename__ = "cita"

    id_cita = Column(Integer, primary_key=True, index=True, autoincrement=False) # Oracle IDENTITY maneja esto
    nombre_cliente = Column(String(150), nullable=True)
    telefono = Column(String(30), nullable=True)
    servicio = Column(String(150), nullable=True)
    fecha_inicio = Column(Date, nullable=True)
    fecha_fin = Column(Date, nullable=True)
    estado = Column(Numeric, nullable=True) # Usamos Numeric/Integer para el estado numérico