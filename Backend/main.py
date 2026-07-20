from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from Backend.database import get_db, engine
from Backend.models import Cita

app = FastAPI(title="Sistema de Citas API", version="1.0.0")

@app.get("/")
def inicio():
    return FileResponse("Frontend/index.html")

@app.get("/probar-conexion")
def probar_conexion(db: Session = Depends(get_db)):
    try:
        # Ejecutamos una consulta rápida para verificar la conexión
        resultado = db.execute(text("SELECT CURRENT_TIMESTAMP FROM DUAL")).fetchone()
        return {
            "estado": "¡Conexión exitosa a Oracle!",
            "timestamp_db": str(resultado[0])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de conexión: {str(e)}")

@app.get("/citas")
def obtener_citas(db: Session = Depends(get_db)):
    try:
        # Consultamos la tabla 'cita' que te pasó tu amigo
        citas = db.query(Cita).all()
        return {"total": len(citas), "citas": citas}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar la tabla: {str(e)}")