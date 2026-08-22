from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid
from sqlmodel import SQLModel, Field, Relationship

# --- USER MODELS ---
class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True)
    correo: str = Field(index=True, unique=True)
    contrasena_hash: str
    rol: str = Field(default="estudiante")  # admin, docente, estudiante, experto
    fecha_creacion: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    evaluaciones: List["Evaluation"] = Relationship(back_populates="estudiante")
    analytics: List["LearningAnalytics"] = Relationship(back_populates="estudiante")
    validaciones: List["ExpertValidation"] = Relationship(back_populates="experto")

class UserCreate(SQLModel):
    nombre: str
    correo: str
    contrasena: str
    rol: str = "estudiante"

class UserLogin(SQLModel):
    correo: str
    contrasena: str

class UserResponse(SQLModel):
    id: int
    nombre: str
    correo: str
    rol: str
    fecha_creacion: datetime

class Token(SQLModel):
    access_token: str
    token_type: str
    rol: str
    nombre: str

class TokenData(SQLModel):
    correo: Optional[str] = None
    rol: Optional[str] = None


# --- BLOOM MODULE MODELS ---
class Module(SQLModel, table=True):
    __tablename__ = "modules"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str  # Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear
    nivel_bloom: int  # 1 to 6
    descripcion: str

    activities: List["Activity"] = Relationship(back_populates="modulo")
    analytics: List["LearningAnalytics"] = Relationship(back_populates="modulo")

class ModuleResponse(SQLModel):
    id: int
    nombre: str
    nivel_bloom: int
    descripcion: str


# --- ACTIVITY MODELS ---
class Activity(SQLModel, table=True):
    __tablename__ = "activities"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    modulo_id: int = Field(foreign_key="modules.id")
    tipo: str  # cuestionario, emparejamiento, simulacion, error_debug, debate, portafolio
    titulo: str
    contenido: str  # Store JSON string containing the questions or parameters

    modulo: Module = Relationship(back_populates="activities")
    evaluaciones: List["Evaluation"] = Relationship(back_populates="actividad")


# --- EVALUATION MODELS (STUDENT ATTEMPTS / WORK) ---
class Evaluation(SQLModel, table=True):
    __tablename__ = "evaluaciones"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    estudiante_id: int = Field(foreign_key="users.id")
    actividad_id: uuid.UUID = Field(foreign_key="activities.id")
    puntuacion: float = Field(default=0.0)  # 0 to 100 or specific score
    respuestas: str  # Store JSON string containing student's answers
    evidencia: Optional[str] = Field(default=None)  # Text or URL of uploaded evidence (esp. for level 6)
    comentario_docente: Optional[str] = Field(default=None)  # Teacher grading remarks
    completada: bool = Field(default=False)
    fecha_actualizacion: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    estudiante: User = Relationship(back_populates="evaluaciones")
    actividad: Activity = Relationship(back_populates="evaluaciones")

class EvaluationCreate(SQLModel):
    actividad_id: uuid.UUID
    puntuacion: float
    respuestas: Dict[str, Any]  # Dictionary to be stored as JSON string
    evidencia: Optional[str] = None
    completada: bool = True

class EvaluationGrade(SQLModel):
    puntuacion: float
    comentario_docente: str

class EvaluationResponse(SQLModel):
    id: uuid.UUID
    estudiante_id: int
    actividad_id: uuid.UUID
    puntuacion: float
    respuestas: Any  # Decoded JSON
    evidencia: Optional[str]
    comentario_docente: Optional[str]
    completada: bool
    fecha_actualizacion: datetime


# --- EXPERT VALIDATION MODELS ---
class ExpertValidation(SQLModel, table=True):
    __tablename__ = "expert_validations"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    experto_id: int = Field(foreign_key="users.id")
    dimension: str  # pedagogica | tecnica | disciplinar
    valoracion: int  # 1 to 5 stars
    observaciones: str
    fecha_creacion: datetime = Field(default_factory=datetime.utcnow)

    experto: User = Relationship(back_populates="validaciones")

class ExpertValidationCreate(SQLModel):
    dimension: str
    valoracion: int
    observaciones: str

class ExpertValidationResponse(SQLModel):
    id: uuid.UUID
    experto_id: int
    experto_nombre: str
    dimension: str
    valoracion: int
    observaciones: str
    fecha_creacion: datetime


# --- LEARNING ANALYTICS MODELS ---
class LearningAnalytics(SQLModel, table=True):
    __tablename__ = "learning_analytics"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    estudiante_id: int = Field(foreign_key="users.id")
    modulo_id: int = Field(foreign_key="modules.id")
    fecha_acceso: datetime = Field(default_factory=datetime.utcnow)
    tiempo_permanencia: int = Field(default=0)  # Accumulative seconds spent in the module
    actividades_completadas: int = Field(default=0)
    progreso_porcentaje: float = Field(default=0.0)

    estudiante: User = Relationship(back_populates="analytics")
    modulo: Module = Relationship(back_populates="analytics")

class AnalyticsSessionUpdate(SQLModel):
    modulo_id: int
    tiempo_adicional: int  # Seconds to add to time spent
    actividades_completadas: Optional[int] = None
    progreso_porcentaje: Optional[float] = None
