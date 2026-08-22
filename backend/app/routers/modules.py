from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import Module, ModuleResponse, User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/modules", tags=["Modules"])

@router.get("/", response_model=List[ModuleResponse])
def get_all_modules(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = select(Module).order_by(Module.nivel_bloom)
    modules = session.exec(statement).all()
    return modules

@router.get("/{module_id}", response_model=ModuleResponse)
def get_module(module_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    module = session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    return module

@router.get("/{module_id}/glossary", response_model=List[Dict[str, Any]])
def get_glossary(module_id: int, current_user: User = Depends(get_current_user)):
    # The glossary is used primarily in Level 1 (Recordar)
    if module_id != 1:
        raise HTTPException(status_code=400, detail="Este recurso solo está disponible para el Módulo 1 (Recordar)")
    
    return [
        {
            "term": "Movimiento Rectilíneo Uniforme (MRU)",
            "definition": "Es el movimiento en el cual un objeto se desplaza en una trayectoria recta con una velocidad constante, lo que implica que recorre distancias iguales en intervalos de tiempo iguales.",
            "formula": None,
            "unit": None
        },
        {
            "term": "Velocidad (v)",
            "definition": "Magnitud física vectorial que indica la tasa de cambio de la posición con respecto al tiempo. En el MRU, su magnitud es constante y coincide con la rapidez.",
            "formula": "v = d / t",
            "unit": "metros por segundo (m/s) o kilómetros por hora (km/h)"
        },
        {
            "term": "Distancia (d)",
            "definition": "La longitud medida sobre la trayectoria recorrida por el móvil. En el MRU rectilíneo unidireccional coincide con la magnitud del desplazamiento.",
            "formula": "d = v * t",
            "unit": "metros (m) o kilómetros (km)"
        },
        {
            "term": "Tiempo (t)",
            "definition": "Magnitud física que mide el intervalo transcurrido entre el inicio y el fin del movimiento.",
            "formula": "t = d / v",
            "unit": "segundos (s) o horas (h)"
        },
        {
            "term": "Aceleración (a)",
            "definition": "Magnitud que mide el cambio de velocidad por unidad de tiempo. En el MRU, al ser la velocidad constante, la aceleración es estrictamente nula.",
            "formula": "a = 0",
            "unit": "metros por segundo al cuadrado (m/s²)"
        },
        {
            "term": "Posición (x)",
            "definition": "Punto del espacio de una dimensión (línea recta) donde se encuentra el móvil en un instante determinado con respecto a un origen de coordenadas.",
            "formula": "x = x0 + v * t",
            "unit": "metros (m)"
        }
    ]

@router.get("/{module_id}/timeline", response_model=List[Dict[str, Any]])
def get_timeline(module_id: int, current_user: User = Depends(get_current_user)):
    if module_id != 1:
        raise HTTPException(status_code=400, detail="Este recurso solo está disponible para el Módulo 1 (Recordar)")
        
    return [
        {
            "era": "Aristóteles (~350 a.C.)",
            "title": "La Física de la Fuerza",
            "description": "Aristóteles propuso que un cuerpo se mueve solo si actúa una fuerza sobre él. Afirmaba que el movimiento uniforme requería la aplicación de un motor constante, y que el vacío era imposible porque la velocidad de movimiento sería infinita.",
            "icon": "aristotle"
        },
        {
            "era": "Galileo Galilei (1638)",
            "title": "El Principio de Inercia",
            "description": "Galileo desafió la idea aristotélica. Descubrió que los cuerpos mantienen su movimiento si no hay fricción. Diseñó planos inclinados y definió matemáticamente por primera vez la relación constante de velocidad: recorrer espacios iguales en tiempos iguales.",
            "icon": "galileo"
        },
        {
            "era": "Isaac Newton (1687)",
            "title": "Primera Ley de Newton",
            "description": "En su obra 'Principia', Newton formalizó la Primera Ley del Movimiento: 'Todo cuerpo permanece en su estado de reposo o movimiento rectilíneo uniforme a menos que sea obligado a cambiar ese estado por fuerzas aplicadas sobre él.' Estructuró el MRU como el estado natural de la materia libre de fuerzas.",
            "icon": "newton"
        },
        {
            "era": "Albert Einstein (1905)",
            "title": "La Velocidad Máxima del Universo",
            "description": "Con la Relatividad Especial, Einstein postuló que la velocidad de la luz en el vacío (c) es constante, independiente del estado de movimiento del emisor y del receptor. El rayo de luz se convierte en el Movimiento Rectilíneo Uniforme absoluto y fundamental del cosmos.",
            "icon": "einstein"
        }
    ]
