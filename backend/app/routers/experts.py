from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select
from app.database import get_session
from app.models import ExpertValidation, ExpertValidationResponse, User
from app.routers.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/experts", tags=["Expert Validation"])

class ExpertValuationBatch(BaseModel):
    pedagogica_valoracion: int = Field(..., ge=1, le=5)
    pedagogica_observaciones: str
    tecnica_valoracion: int = Field(..., ge=1, le=5)
    tecnica_observaciones: str
    disciplinar_valoracion: int = Field(..., ge=1, le=5)
    disciplinar_observaciones: str

# --- ENDPOINTS ---

@router.post("/validate", response_model=List[ExpertValidationResponse])
def submit_validation(
    batch: ExpertValuationBatch,
    session: Session = Depends(get_session),
    current_user: User = Depends(RoleChecker(["experto", "admin"]))
):
    # Remove previous validations by this expert to allow overwrite/editing
    stmt_delete = select(ExpertValidation).where(ExpertValidation.experto_id == current_user.id)
    old_validations = session.exec(stmt_delete).all()
    for ov in old_validations:
        session.delete(ov)
    session.commit()

    # Create new validation records
    v_ped = ExpertValidation(
        experto_id=current_user.id,
        dimension="pedagogica",
        valoracion=batch.pedagogica_valoracion,
        observaciones=batch.pedagogica_observaciones
    )
    v_tec = ExpertValidation(
        experto_id=current_user.id,
        dimension="tecnica",
        valoracion=batch.tecnica_valoracion,
        observaciones=batch.tecnica_observaciones
    )
    v_dis = ExpertValidation(
        experto_id=current_user.id,
        dimension="disciplinar",
        valoracion=batch.disciplinar_valoracion,
        observaciones=batch.disciplinar_observaciones
    )

    session.add(v_ped)
    session.add(v_tec)
    session.add(v_dis)
    session.commit()

    # Retrieve and return saved records
    saved_stmt = select(ExpertValidation).where(ExpertValidation.experto_id == current_user.id)
    saved_records = session.exec(saved_stmt).all()
    
    return [
        ExpertValidationResponse(
            id=r.id,
            experto_id=r.experto_id,
            experto_nombre=current_user.nombre,
            dimension=r.dimension,
            valoracion=r.valoracion,
            observaciones=r.observaciones,
            fecha_creacion=r.fecha_creacion
        )
        for r in saved_records
    ]

@router.get("/my-validation", response_model=List[ExpertValidationResponse])
def get_my_validation(
    session: Session = Depends(get_session),
    current_user: User = Depends(RoleChecker(["experto", "admin"]))
):
    statement = select(ExpertValidation).where(ExpertValidation.experto_id == current_user.id)
    records = session.exec(statement).all()
    
    return [
        ExpertValidationResponse(
            id=r.id,
            experto_id=r.experto_id,
            experto_nombre=current_user.nombre,
            dimension=r.dimension,
            valoracion=r.valoracion,
            observaciones=r.observaciones,
            fecha_creacion=r.fecha_creacion
        )
        for r in records
    ]

@router.get("/aggregate")
def get_aggregate_validations(
    session: Session = Depends(get_session),
    current_user: User = Depends(RoleChecker(["admin", "docente", "experto"]))
):
    statement = select(ExpertValidation, User.nombre).join(User, ExpertValidation.experto_id == User.id)
    results = session.exec(statement).all()
    
    pedagogica_scores = []
    tecnica_scores = []
    disciplinar_scores = []
    
    by_expert = {}
    
    for val, expert_name in results:
        if val.dimension == "pedagogica":
            pedagogica_scores.append(val.valoracion)
        elif val.dimension == "tecnica":
            tecnica_scores.append(val.valoracion)
        elif val.dimension == "disciplinar":
            disciplinar_scores.append(val.valoracion)
            
        exp_id = val.experto_id
        if exp_id not in by_expert:
            by_expert[exp_id] = {
                "nombre": expert_name,
                "pedagogica": None,
                "tecnica": None,
                "disciplinar": None,
                "fecha": val.fecha_creacion
            }
        by_expert[exp_id][val.dimension] = {
            "valoracion": val.valoracion,
            "observaciones": val.observaciones
        }
        
    avg_ped = sum(pedagogica_scores) / len(pedagogica_scores) if pedagogica_scores else 0.0
    avg_tec = sum(tecnica_scores) / len(tecnica_scores) if tecnica_scores else 0.0
    avg_dis = sum(disciplinar_scores) / len(disciplinar_scores) if disciplinar_scores else 0.0
    avg_global = (avg_ped + avg_tec + avg_dis) / 3 if (pedagogica_scores or tecnica_scores or disciplinar_scores) else 0.0
    
    return {
        "promedios": {
            "pedagogica": round(avg_ped, 2),
            "tecnica": round(avg_tec, 2),
            "disciplinar": round(avg_dis, 2),
            "global": round(avg_global, 2)
        },
        "conteos": {
            "pedagogica": len(pedagogica_scores),
            "tecnica": len(tecnica_scores),
            "disciplinar": len(disciplinar_scores),
            "total_expertos": len(by_expert)
        },
        "detalles_por_experto": list(by_expert.values())
    }
