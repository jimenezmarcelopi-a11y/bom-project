import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models import User, Evaluation, LearningAnalytics, Activity, Module
from app.routers.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/admin", tags=["Teacher/Admin Panel"])

@router.get("/students-report")
def get_students_report(
    session: Session = Depends(get_session),
    current_user: User = Depends(RoleChecker(["docente", "admin"]))
):
    # Fetch all students
    students_stmt = select(User).where(User.rol == "estudiante")
    students = session.exec(students_stmt).all()
    
    report = []
    for student in students:
        # Fetch analytics for this student
        analytics_stmt = select(LearningAnalytics, Module.nombre).join(
            Module, LearningAnalytics.modulo_id == Module.id
        ).where(LearningAnalytics.estudiante_id == student.id)
        
        analytics_results = session.exec(analytics_stmt).all()
        
        modules_prog = {}
        total_time = 0
        total_completed = 0
        
        for analytic, mod_name in analytics_results:
            modules_prog[mod_name] = {
                "progreso": analytic.progreso_porcentaje,
                "tiempo": analytic.tiempo_permanencia,
                "completadas": analytic.actividades_completadas
            }
            total_time += analytic.tiempo_permanencia
            total_completed += analytic.actividades_completadas

        # Fetch evaluations
        eval_stmt = select(Evaluation, Activity.titulo).join(
            Activity, Evaluation.actividad_id == Activity.id
        ).where(Evaluation.estudiante_id == student.id)
        evals_results = session.exec(eval_stmt).all()
        
        evaluations_list = []
        for ev, act_title in evals_results:
            evaluations_list.append({
                "evaluacion_id": ev.id,
                "actividad_titulo": act_title,
                "puntuacion": ev.puntuacion,
                "completada": ev.completada,
                "evidencia": ev.evidencia,
                "comentario_docente": ev.comentario_docente,
                "fecha": ev.fecha_actualizacion
            })

        report.append({
            "id": student.id,
            "nombre": student.nombre,
            "correo": student.correo,
            "modulos": modules_prog,
            "tiempo_total_segundos": total_time,
            "actividades_totales_completadas": total_completed,
            "evaluaciones": evaluations_list
        })
        
    return report

@router.get("/pending-grades")
def get_pending_grades(
    session: Session = Depends(get_session),
    current_user: User = Depends(RoleChecker(["docente", "admin"]))
):
    # Pending evaluations are those belonging to students where activity type is debate or portafolio
    # and comment is null or grade is 0
    statement = select(Evaluation, User.nombre, Activity.titulo, Activity.tipo).join(
        User, Evaluation.estudiante_id == User.id
    ).join(
        Activity, Evaluation.actividad_id == Activity.id
    ).where(
        Activity.tipo.in_(["debate", "portafolio"]),
        Evaluation.completada == True
    )
    
    results = session.exec(statement).all()
    pending = []
    
    for ev, student_name, act_title, act_type in results:
        # We classify as pending if ugraded (comentario_docente is None)
        if ev.comentario_docente is None:
            pending.append({
                "evaluacion_id": ev.id,
                "estudiante_nombre": student_name,
                "actividad_titulo": act_title,
                "tipo": act_type,
                "respuestas": json.loads(ev.respuestas) if ev.respuestas else {},
                "evidencia": ev.evidencia,
                "puntuacion": ev.puntuacion,
                "fecha": ev.fecha_actualizacion
            })
            
    return pending

@router.get("/system-stats")
def get_system_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(RoleChecker(["admin", "docente"]))
):
    users_stmt = select(User)
    users = session.exec(users_stmt).all()
    
    counts = {
        "admin": 0,
        "docente": 0,
        "experto": 0,
        "estudiante": 0
    }
    for u in users:
        if u.rol in counts:
            counts[u.rol] += 1
            
    evals_stmt = select(Evaluation)
    evals = session.exec(evals_stmt).all()
    
    avg_score = 0.0
    completed_evals = [e for e in evals if e.completada]
    if completed_evals:
        avg_score = sum(e.puntuacion for e in completed_evals) / len(completed_evals)
        
    return {
        "usuarios_conteo": counts,
        "total_evaluaciones": len(evals),
        "total_evaluaciones_completadas": len(completed_evals),
        "promedio_calificaciones": round(avg_score, 2)
    }
