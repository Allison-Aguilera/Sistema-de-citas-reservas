from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from Backend.database import get_db, engine
from Backend.models import Cita
from Backend.schemas import CitaOut, CitaCrear

app = FastAPI(title="Sistema de Citas API", version="1.0.0")

# si tienes CSS/JS propios en Frontend/, sírvelos como estáticos
app.mount("/static", StaticFiles(directory="Frontend"), name="static")

@app.get("/")
def inicio():
    return FileResponse("Frontend/index.html")

# ojo: el frontend pide "/citas/" con slash final, así que registramos ambas
@app.get("/citas", response_model=dict)
@app.get("/citas/", response_model=dict)
def obtener_citas(db: Session = Depends(get_db)):
    try:
        citas = db.query(Cita).all()
        citas_out = [CitaOut.model_validate(c) for c in citas]
        return {"total": len(citas_out), "citas": citas_out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar la tabla: {str(e)}")

@app.post("/citas", response_model=CitaOut, status_code=201)
def crear_cita(cita: CitaCrear, db: Session = Depends(get_db)):
    # weekday(): Monday=0 ... Sunday=6. Bloqueamos sábado (5) y domingo (6)
    if cita.fecha_inicio.weekday() >= 5:
        raise HTTPException(
            status_code=400,
            detail="No se pueden agendar citas en sábado o domingo."
        )

    try:
        nueva = Cita(**cita.model_dump())
        db.add(nueva)
        db.commit()
        db.refresh(nueva)
        return nueva
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar la cita: {str(e)}")