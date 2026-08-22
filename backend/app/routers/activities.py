import json
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models import (
    Activity, Evaluation, EvaluationCreate, EvaluationGrade, 
    EvaluationResponse, LearningAnalytics, AnalyticsSessionUpdate, User
)
from app.routers.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/activities", tags=["Activities"])

# --- ENDPOINTS ---

@router.get("/module/{module_id}", response_model=List[Activity])
def get_activities_by_module(
    module_id: int, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    statement = select(Activity).where(Activity.modulo_id == module_id)
    return session.exec(statement).all()

@router.get("/my-evaluations", response_model=List[EvaluationResponse])
def get_my_evaluations(
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    statement = select(Evaluation).where(Evaluation.estudiante_id == current_user.id)
    evaluations = session.exec(statement).all()
    
    response = []
    for ev in evaluations:
        response.append(EvaluationResponse(
            id=ev.id,
            estudiante_id=ev.estudiante_id,
            actividad_id=ev.actividad_id,
            puntuacion=ev.puntuacion,
            respuestas=json.loads(ev.respuestas),
            evidencia=ev.evidencia,
            comentario_docente=ev.comentario_docente,
            completada=ev.completada,
            fecha_actualizacion=ev.fecha_actualizacion
        ))
    return response

@router.post("/submit", response_model=EvaluationResponse)
def submit_activity(
    eval_in: EvaluationCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify activity exists
    activity = session.get(Activity, eval_in.actividad_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    # Check if this student already has an evaluation for this activity
    statement = select(Evaluation).where(
        Evaluation.estudiante_id == current_user.id,
        Evaluation.actividad_id == eval_in.actividad_id
    )
    db_eval = session.exec(statement).first()

    if db_eval:
        # Update existing evaluation
        db_eval.puntuacion = eval_in.puntuacion
        db_eval.respuestas = json.dumps(eval_in.respuestas)
        db_eval.evidencia = eval_in.evidencia
        db_eval.completada = eval_in.completada
        db_eval.fecha_actualizacion = datetime.utcnow()
    else:
        # Create new evaluation
        db_eval = Evaluation(
            estudiante_id=current_user.id,
            actividad_id=eval_in.actividad_id,
            puntuacion=eval_in.puntuacion,
            respuestas=json.dumps(eval_in.respuestas),
            evidencia=eval_in.evidencia,
            completada=eval_in.completada,
            fecha_actualizacion=datetime.utcnow()
        )
        session.add(db_eval)

    session.commit()
    session.refresh(db_eval)

    # --- UPDATE LEARNING ANALYTICS ---
    # Find total activities in this module
    total_activities_stmt = select(Activity).where(Activity.modulo_id == activity.modulo_id)
    total_activities = len(session.exec(total_activities_stmt).all())

    # Find completed activities by this student in this module
    completed_evals_stmt = select(Evaluation).join(Activity).where(
        Evaluation.estudiante_id == current_user.id,
        Activity.modulo_id == activity.modulo_id,
        Evaluation.completada == True
    )
    completed_activities = len(session.exec(completed_evals_stmt).all())

    # Update/Create learning analytics row
    analytics_stmt = select(LearningAnalytics).where(
        LearningAnalytics.estudiante_id == current_user.id,
        LearningAnalytics.modulo_id == activity.modulo_id
    )
    analytics = session.exec(analytics_stmt).first()

    prog_percent = (completed_activities / total_activities * 100) if total_activities > 0 else 0.0

    if analytics:
        analytics.actividades_completadas = completed_activities
        analytics.progreso_porcentaje = min(prog_percent, 100.0)
    else:
        analytics = LearningAnalytics(
            estudiante_id=current_user.id,
            modulo_id=activity.modulo_id,
            actividades_completadas=completed_activities,
            progreso_porcentaje=min(prog_percent, 100.0),
            tiempo_permanencia=0
        )
        session.add(analytics)

    session.commit()

    return EvaluationResponse(
        id=db_eval.id,
        estudiante_id=db_eval.estudiante_id,
        actividad_id=db_eval.actividad_id,
        puntuacion=db_eval.puntuacion,
        respuestas=json.loads(db_eval.respuestas),
        evidencia=db_eval.evidencia,
        comentario_docente=db_eval.comentario_docente,
        completada=db_eval.completada,
        fecha_actualizacion=db_eval.fecha_actualizacion
    )

@router.put("/grade/{evaluation_id}", response_model=EvaluationResponse)
def grade_activity(
    evaluation_id: uuid.UUID,
    grade_in: EvaluationGrade,
    session: Session = Depends(get_session),
    current_user: User = Depends(RoleChecker(["docente", "admin"]))
):
    # Retrieve evaluation record
    evaluation = session.get(Evaluation, evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")

    evaluation.puntuacion = grade_in.puntuacion
    evaluation.comentario_docente = grade_in.comentario_docente
    evaluation.fecha_actualizacion = datetime.utcnow()
    
    session.add(evaluation)
    session.commit()
    session.refresh(evaluation)

    return EvaluationResponse(
        id=evaluation.id,
        estudiante_id=evaluation.estudiante_id,
        actividad_id=evaluation.actividad_id,
        puntuacion=evaluation.puntuacion,
        respuestas=json.loads(evaluation.respuestas),
        evidencia=evaluation.evidencia,
        comentario_docente=evaluation.comentario_docente,
        completada=evaluation.completada,
        fecha_actualizacion=evaluation.fecha_actualizacion
    )

@router.post("/analytics/update")
def update_analytics(
    update_in: AnalyticsSessionUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Fetch or create analytics row
    analytics_stmt = select(LearningAnalytics).where(
        LearningAnalytics.estudiante_id == current_user.id,
        LearningAnalytics.modulo_id == update_in.modulo_id
    )
    analytics = session.exec(analytics_stmt).first()

    if analytics:
        analytics.tiempo_permanencia += update_in.tiempo_adicional
        if update_in.progreso_porcentaje is not None:
            analytics.progreso_porcentaje = update_in.progreso_porcentaje
    else:
        analytics = LearningAnalytics(
            estudiante_id=current_user.id,
            modulo_id=update_in.modulo_id,
            tiempo_permanencia=update_in.tiempo_adicional,
            actividades_completadas=update_in.actividades_completadas or 0,
            progreso_porcentaje=update_in.progreso_porcentaje or 0.0
        )
        session.add(analytics)

    session.commit()
    return {"message": "Analíticas actualizadas exitosamente", "tiempo_total": analytics.tiempo_permanencia}

@router.get("/analytics/my-progress")
def get_my_progress(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(LearningAnalytics).where(LearningAnalytics.estudiante_id == current_user.id)
    rows = session.exec(statement).all()
    
    results = {}
    for row in rows:
        results[row.modulo_id] = {
            "tiempo_permanencia": row.tiempo_permanencia,
            "actividades_completadas": row.actividades_completadas,
            "progreso_porcentaje": row.progreso_porcentaje
        }
    return results
