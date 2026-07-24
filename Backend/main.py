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
    
ESTADOS_VALIDOS = {1, 2, 3, 4}  # 1=Pendiente, 2=Confirmada, 3=Cancelada, 4=Completada

@app.post("/citas", response_model=CitaOut, status_code=201)
def crear_cita(cita: CitaCrear, db: Session = Depends(get_db)):
    if cita.fecha_inicio.weekday() >= 5:
        raise HTTPException(status_code=400, detail="No se pueden agendar citas en sábado o domingo.")

    try:
        datos = cita.model_dump()
        if datos.get("estado") is None:
            datos["estado"] = 1  # toda cita nueva nace como Pendiente

        nueva = Cita(**datos)
        db.add(nueva)
        db.commit()
        db.refresh(nueva)
        return nueva
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar la cita: {str(e)}")

@app.put("/citas/{cita_id}", response_model=CitaOut)
def actualizar_cita(cita_id: int, cita_actualizada: CitaCrear, db: Session = Depends(get_db)):
    if cita_actualizada.fecha_inicio.weekday() >= 5:
        raise HTTPException(status_code=400, detail="No se pueden agendar citas en sábado o domingo.")

    if cita_actualizada.estado is not None and cita_actualizada.estado not in ESTADOS_VALIDOS:
        raise HTTPException(status_code=400, detail="Estado inválido. Usa 1, 2, 3 o 4.")

    db_cita = db.query(Cita).filter(Cita.id_cita == cita_id).first()
    if not db_cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    try:
        datos = cita_actualizada.model_dump()
        if datos.get("estado") is None:
            datos["estado"] = db_cita.estado  # si no mandan estado, conserva el actual

        for key, value in datos.items():
            setattr(db_cita, key, value)

        db.commit()
        db.refresh(db_cita)
        return db_cita
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar la cita: {str(e)}")

@app.delete("/citas/{cita_id}", status_code=200)
def eliminar_cita(cita_id: int, db: Session = Depends(get_db)):
    cita = db.query(Cita).filter(Cita.id_cita == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    if cita.estado != 3:
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden eliminar citas en estado Cancelada."
        )

    try:
        db.delete(cita)
        db.commit()
        return {"mensaje": f"Cita #{cita_id} eliminada correctamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar la cita: {str(e)}")