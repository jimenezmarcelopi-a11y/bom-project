import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.database import init_db, engine
from app.config import settings
from app.models import User, Module, Activity
from app.routers import auth, modules, activities, experts, admin, ai

# Hash helper directly in main for seeding
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_hash(password: str) -> str:
    return pwd_context.hash(password)

def seed_database(session: Session):
    # 1. SEED MODULES
    modules_to_seed = [
        Module(id=1, nombre="Recordar", nivel_bloom=1, descripcion="Recuperar y evocar conceptos básicos, unidades y fórmulas fundamentales del MRU."),
        Module(id=2, nombre="Comprender", nivel_bloom=2, descripcion="Interpretar relaciones entre distancia, tiempo y velocidad mediante explicaciones y análisis gráfico básico."),
        Module(id=3, nombre="Aplicar", nivel_bloom=3, descripcion="Resolver situaciones prácticas y cálculos cuantitativos utilizando ecuaciones y simuladores interactivos."),
        Module(id=4, nombre="Analizar", nivel_bloom=4, descripcion="Diferenciar comportamientos de movimiento, analizar gráficas segmentadas e identificar errores procedimentales."),
        Module(id=5, nombre="Evaluar", nivel_bloom=5, descripcion="Emitir juicios fundamentados sobre casos reales de tránsito y seguridad vial utilizando modelos físicos."),
        Module(id=6, nombre="Crear", nivel_bloom=6, descripcion="Generar enunciados de problemas originales, diseñar metodologías experimentales y recopilar un portafolio de evidencias.")
    ]

    for m in modules_to_seed:
        existing = session.get(Module, m.id)
        if not existing:
            session.add(m)
    session.commit()

    # 2. SEED DEFAULT USERS (Password is role name + "123")
    users_to_seed = [
        User(nombre="Profesor Carlos", correo="docente@bom.edu", contrasena_hash=get_hash("docente123"), rol="docente"),
        User(nombre="Estudiante Mateo", correo="estudiante@bom.edu", contrasena_hash=get_hash("estudiante123"), rol="estudiante"),
        User(nombre="Dr. Gómez Validador", correo="experto@bom.edu", contrasena_hash=get_hash("experto123"), rol="experto"),
        User(nombre="Administrador Sistema", correo="admin@bom.edu", contrasena_hash=get_hash("admin123"), rol="admin")
    ]

    for u in users_to_seed:
        stmt = select(User).where(User.correo == u.correo)
        existing = session.exec(stmt).first()
        if not existing:
            session.add(u)
    session.commit()

    # 3. SEED ACTIVITIES
    activities_to_seed = [
        # --- LEVEL 1: RECORDAR ---
        Activity(
            id="a1111111-1111-1111-1111-111111111111",
            modulo_id=1,
            tipo="cuestionario",
            titulo="Quiz de Reconocimiento Conceptual",
            contenido=json.dumps({
                "questions": [
                    {
                        "id": 1,
                        "question": "¿Cuál es la característica principal de la velocidad en el Movimiento Rectilíneo Uniforme (MRU)?",
                        "options": [
                            "Varía linealmente con el tiempo.",
                            "Es estrictamente constante y en línea recta.",
                            "Aumenta si la aceleración es positiva.",
                            "Disminuye exponencialmente al aumentar la distancia."
                        ],
                        "correct_idx": 1
                    },
                    {
                        "id": 2,
                        "question": "En el Sistema Internacional (SI), ¿cuál es la unidad oficial de medida para la velocidad?",
                        "options": [
                            "kilómetros por hora (km/h)",
                            "centímetros por minuto (cm/min)",
                            "metros por segundo (m/s)",
                            "millas por segundo (mph)"
                        ],
                        "correct_idx": 2
                    },
                    {
                        "id": 3,
                        "question": "Si despejamos el tiempo (t) de la ecuación fundamental d = v * t, ¿cuál es la fórmula resultante?",
                        "options": [
                            "t = v / d",
                            "t = d / v",
                            "t = d * v",
                            "t = d + v"
                        ],
                        "correct_idx": 1
                    },
                    {
                        "id": 4,
                        "question": "¿Qué valor tiene la aceleración en el MRU?",
                        "options": [
                            "Tiene un valor constante de 9.8 m/s².",
                            "Es variable y depende de la velocidad inicial.",
                            "Es estrictamente cero (a = 0).",
                            "Es igual a la distancia dividida por el tiempo."
                        ],
                        "correct_idx": 2
                    },
                    {
                        "id": 5,
                        "question": "Si un automóvil en MRU viaja con velocidad v = 8 m/s durante t = 5 s, ¿cuál es su desplazamiento?",
                        "options": [
                            "1.6 metros",
                            "13 metros",
                            "40 metros",
                            "80 metros"
                        ],
                        "correct_idx": 2
                    }
                ]
            })
        ),
        Activity(
            id="a1111111-1111-1111-1111-222222222222",
            modulo_id=1,
            tipo="emparejamiento",
            titulo="Asociación de Unidades y Variables",
            contenido=json.dumps({
                "items": [
                    {"id": "var_d", "term": "Distancia (d)", "match": "Metros (m)"},
                    {"id": "var_v", "term": "Velocidad (v)", "match": "Metros por segundo (m/s)"},
                    {"id": "var_t", "term": "Tiempo (t)", "match": "Segundos (s)"},
                    {"id": "var_a", "term": "Aceleración (a)", "match": "Nula o 0 m/s²"}
                ]
            })
        ),
        
        # --- LEVEL 2: COMPRENDER ---
        Activity(
            id="b2222222-2222-2222-2222-111111111111",
            modulo_id=2,
            tipo="emparejamiento",
            titulo="Interpretación de Descripciones y Gráficos",
            contenido=json.dumps({
                "items": [
                    {"id": "desc_1", "term": "Una línea recta horizontal en una gráfica de velocidad-tiempo (v-t)", "match": "Representa un cuerpo moviéndose con velocidad constante (MRU)"},
                    {"id": "desc_2", "term": "Una línea recta inclinada ascendente en una gráfica de posición-tiempo (x-t)", "match": "Representa un cuerpo alejándose del origen con velocidad constante positiva"},
                    {"id": "desc_3", "term": "Una línea recta horizontal sobre el eje temporal en una gráfica posición-tiempo (x-t)", "match": "Representa un cuerpo en reposo absoluto (velocidad = 0)"},
                    {"id": "desc_4", "term": "Una línea recta inclinada descendente en una gráfica posición-tiempo (x-t)", "match": "Representa un cuerpo regresando hacia el origen con velocidad constante negativa"}
                ]
            })
        ),

        # --- LEVEL 3: APLICAR ---
        Activity(
            id="c3333333-3333-3333-3333-111111111111",
            modulo_id=3,
            tipo="simulacion",
            titulo="Reto Práctico del Simulador",
            contenido=json.dumps({
                "challenge": "Configurar la velocidad necesaria en el simulador para que un cuerpo que parte de la posición inicial x0 = 10 m llegue a la posición x = 90 m en un lapso exacto de t = 8 segundos.",
                "datos": {"x0": 10.0, "x_target": 90.0, "t_target": 8.0},
                "respuesta_esperada": 10.0,  # speed = (90 - 10) / 8 = 10 m/s
                "unidad": "m/s"
            })
        ),

        # --- LEVEL 4: ANALIZAR ---
        Activity(
            id="d4444444-4444-4444-4444-111111111111",
            modulo_id=4,
            tipo="error_debug",
            titulo="Análisis de Errores Procedimentales",
            contenido=json.dumps({
                "enunciado": "Un estudiante resolvió el siguiente problema: 'Un ciclista viaja a una velocidad constante de 36 km/h durante 45 segundos. ¿Qué distancia recorre?'. El estudiante hizo lo siguiente: d = v * t => d = 36 * 45 = 1620 metros. ¿Dónde está el error y cuál es la solución correcta?",
                "opciones_diagnostico": [
                    "Multiplicó mal: 36 * 45 no es 1620.",
                    "No convirtió la velocidad de km/h a m/s antes de multiplicar por los segundos.",
                    "Usó una fórmula incorrecta: la fórmula para distancia es d = v / t.",
                    "El tiempo debía convertirse a horas dividiendo por 60."
                ],
                "correct_idx": 1,
                "solucion_correcta": "Velocidad en m/s = 36 / 3.6 = 10 m/s. Distancia d = 10 m/s * 45 s = 450 metros. El estudiante obtuvo 1620 m porque multiplicó directamente sin homogeneizar las unidades."
            })
        ),

        # --- LEVEL 5: EVALUAR ---
        Activity(
            id="e5555555-5555-5555-5555-111111111111",
            modulo_id=5,
            tipo="debate",
            titulo="Evaluación de Caso: La Fotomulta de Tránsito",
            contenido=json.dumps({
                "caso": "Un conductor recibe una sanción por exceso de velocidad mediante cámaras automáticas instaladas en dos puntos de control rectos espaciados exactamente a 3 km de distancia. La cámara A registró la entrada del auto a las 14:00:00 y la cámara B registró la salida a las 14:02:00. El límite máximo permitido en la vía es de 80 km/h. El conductor argumenta que nunca excedió el límite en el velocímetro de su tablero.",
                "preguntas_guia": [
                    "¿Cuál fue la velocidad promedio del vehículo en km/h durante el trayecto?",
                    "Aplica las fórmulas de MRU para demostrar científicamente si el conductor cometió la infracción.",
                    "Evalúa el descargo del conductor: ¿es posible que no viera más de 80 km/h en su tablero pero haya cometido la infracción según el cálculo físico?"
                ]
            })
        ),

        # --- LEVEL 6: CREAR ---
        Activity(
            id="f6666666-6666-6666-6666-111111111111",
            modulo_id=6,
            tipo="portafolio",
            titulo="Diseño del Producto Original y Experimento",
            contenido=json.dumps({
                "proyecto_1": "Diseño de un problema inédito de MRU basado en tu entorno (contexto local).",
                "proyecto_2": "Diseño de un protocolo experimental casero utilizando elementos sencillos (cronómetro, cinta métrica, un juguete móvil) para comprobar el MRU y estimar el error de medición."
            })
        )
    ]

    for act in activities_to_seed:
        existing = session.get(Activity, act.id)
        if not existing:
            session.add(act)
    session.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    init_db()
    
    # Seed data
    with Session(engine) as session:
        seed_database(session)
        
    yield

app = FastAPI(
    title="BOM (Bloom-Oriented MRU) API",
    description="Backend API supporting the Virtual Learning Object structured under Bloom's Taxonomy",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
allowed_origins = [origin.strip() for origin in settings.FRONTEND_URL.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=bool(allowed_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(modules.router, prefix="/api")
app.include_router(activities.router, prefix="/api")
app.include_router(experts.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "¡Bienvenido a la API del OVA BOM (Bloom-Oriented MRU)!"}
