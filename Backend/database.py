import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Carga las variables del archivo .env ubicado en la raíz
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_DSN = os.getenv("DB_DSN")

# Construimos la cadena de conexión para SQLAlchemy con oracledb
# Formato: oracle+oracledb://usuario:password@/?dsn=...
DATABASE_URL = f"oracle+oracledb://{DB_USER}:{DB_PASSWORD}@/?dsn={DB_DSN}"

# Creamos el motor de base de datos
engine = create_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True,   # verifica que la conexión siga viva antes de usarla; si está muerta, la descarta y abre otra
    pool_recycle=280,     # recicla conexiones cada ~4.5 min, antes de que Oracle las cierre por inactividad
    pool_size=5,
    max_overflow=10,
)

# Creamos la fábrica de sesiones para las consultas HTTP
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base declarativa para los modelos de SQLAlchemy
Base = declarative_base()

# Dependencia para obtener la sesión de base de datos en los endpoints de FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()