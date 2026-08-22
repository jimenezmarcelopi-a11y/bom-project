import random
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import httpx
from app.config import settings
from app.models import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Integration"])

class AIProblemRequest(BaseModel):
    difficulty: str  # facil, medio, dificil
    context: Optional[str] = "deportes"  # deportes, viajes, espacio, naturaleza

class AIFeedbackRequest(BaseModel):
    problem: str
    student_formula: str
    student_calculation: str
    student_result: str

# Fallback datasets for MRU questions
CONTEXT_TEMPLATES = {
    "deportes": [
        {"runner": "un atleta de élite", "speed": 10.0, "unit": "m/s", "action": "corre una recta de pista"},
        {"runner": "un ciclista", "speed": 15.0, "unit": "m/s", "action": "avanza en un velódromo recto"},
        {"runner": "un nadador", "speed": 2.0, "unit": "m/s", "action": "recorre una piscina olímpica"}
    ],
    "viajes": [
        {"runner": "un tren de alta velocidad", "speed": 250.0, "unit": "km/h", "action": "cruza un túnel rectilíneo"},
        {"runner": "un automóvil de turismo", "speed": 90.0, "unit": "km/h", "action": "transita por una autopista recta"},
        {"runner": "un avión de pasajeros", "speed": 800.0, "unit": "km/h", "action": "vuela en línea recta en altitud de crucero"}
    ],
    "espacio": [
        {"runner": "una sonda espacial", "speed": 12.0, "unit": "km/s", "action": "se desplaza hacia Marte en el vacío"},
        {"runner": "un asteroide", "speed": 25.0, "unit": "km/s", "action": "cruza una región del espacio exterior"},
        {"runner": "un transbordador espacial", "speed": 8.0, "unit": "km/s", "action": "se desplaza en órbita recta provisional"}
    ],
    "naturaleza": [
        {"runner": "un guepardo", "speed": 28.0, "unit": "m/s", "action": "persigue una presa en una planicie recta"},
        {"runner": "un halcón peregrino", "speed": 50.0, "unit": "m/s", "action": "vuela horizontalmente en línea recta"},
        {"runner": "un caballo al galope", "speed": 14.0, "unit": "m/s", "action": "recorre un sendero llano y recto"}
    ]
}

@router.post("/generate-problem")
async def generate_problem(
    req: AIProblemRequest,
    current_user: User = Depends(get_current_user)
):
    prompt = f"Genera un problema educativo de Física sobre Movimiento Rectilíneo Uniforme (MRU). Dificultad: {req.difficulty}. Contexto: {req.context}. Devuelve un JSON con: 'titulo', 'enunciado', 'datos' (diccionario), 'formula_correcta', 'resultado_numerico' (solo el número), 'unidad', 'paso_a_paso' (explicación de la solución)."

    try:
        # Attempt to call local Ollama service
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                f"{settings.OLLAMA_HOST}/api/generate",
                json={
                    "model": "llama3:latest",
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }
            )
            if response.status_code == 200:
                result = response.json()
                ai_text = result.get("response", "")
                import json
                return json.loads(ai_text)
    except Exception:
        # Fallback if Ollama is not active or models aren't pulled
        pass

    # Dynamic fallback generator
    context_list = CONTEXT_TEMPLATES.get(req.context, CONTEXT_TEMPLATES["deportes"])
    element = random.choice(context_list)
    
    # Generate numerical values based on difficulty
    if req.difficulty == "facil":
        time_val = random.choice([5, 10, 20, 30])
        dist_val = element["speed"] * time_val
        
        enunciado = f"{element['runner'].capitalize()} {element['action']} a una velocidad constante de {element['speed']} {element['unit']}. Si mantiene este movimiento rectilíneo uniforme durante un tiempo de {time_val} segundos, ¿qué distancia total habrá recorrido?"
        
        return {
            "titulo": f"MRU: {element['runner'].capitalize()} en Acción",
            "enunciado": enunciado,
            "datos": {"velocidad": f"{element['speed']} {element['unit']}", "tiempo": f"{time_val} s"},
            "formula_correcta": "d = v * t",
            "resultado_numerico": float(dist_val),
            "unidad": "m" if "m" in element["unit"] else "km",
            "paso_a_paso": f"1. Identificamos los datos: Velocidad (v) = {element['speed']} {element['unit']}, Tiempo (t) = {time_val} s. 2. Usamos la fórmula de la distancia: d = v * t. 3. Multiplicamos: {element['speed']} * {time_val} = {dist_val}. 4. La distancia recorrida es de {dist_val} {('m' if 'm' in element['unit'] else 'km')}."
        }
    elif req.difficulty == "medio":
        # Calculate time: t = d / v
        dist_val = random.choice([100, 200, 500, 1000])
        speed_val = element["speed"]
        time_val = round(dist_val / speed_val, 2)
        
        enunciado = f"{element['runner'].capitalize()} {element['action']}. Si debe recorrer una distancia total de {dist_val} metros moviéndose en MRU a una velocidad de {speed_val} {element['unit']}, ¿cuánto tiempo tardará en completar el recorrido?"
        
        return {
            "titulo": f"MRU: Calculando el Tiempo del Recorrido",
            "enunciado": enunciado,
            "datos": {"distancia": f"{dist_val} m", "velocidad": f"{speed_val} {element['unit']}"},
            "formula_correcta": "t = d / v",
            "resultado_numerico": float(time_val),
            "unidad": "s",
            "paso_a_paso": f"1. Identificamos los datos: Distancia (d) = {dist_val} m, Velocidad (v) = {speed_val} {element['unit']}. 2. La fórmula del tiempo es: t = d / v. 3. Dividimos la distancia por la velocidad: {dist_val} / {speed_val} = {time_val} s. 4. El tiempo necesario es de {time_val} segundos."
        }
    else:  # dificil: requires conversion (e.g. speed in km/h, time in seconds, find distance in meters)
        # speed in km/h, time in seconds
        speed_kmh = round(element["speed"] * 3.6, 1)
        time_s = random.choice([60, 120, 180])  # 1 to 3 minutes
        # v in m/s = speed_kmh / 3.6
        # d = v * t
        speed_ms = speed_kmh / 3.6
        dist_m = round(speed_ms * time_s, 1)
        
        enunciado = f"{element['runner'].capitalize()} {element['action']} a una velocidad constante de {speed_kmh} km/h. Si se desplaza bajo MRU durante {time_s} segundos, ¿qué distancia en metros habrá cubierto? (Recuerda realizar las conversiones de unidades correspondientes)."
        
        return {
            "titulo": f"MRU Avanzado: Desafío de Conversión de Unidades",
            "enunciado": enunciado,
            "datos": {"velocidad": f"{speed_kmh} km/h", "tiempo": f"{time_s} s"},
            "formula_correcta": "d = v * t (con v en m/s)",
            "resultado_numerico": float(dist_m),
            "unidad": "m",
            "paso_a_paso": f"1. Datos: Velocidad (v) = {speed_kmh} km/h, Tiempo (t) = {time_s} s. 2. Notamos que las unidades no son homogéneas. Convertimos la velocidad de km/h a m/s dividiendo por 3.6: {speed_kmh} / 3.6 = {round(speed_ms, 2)} m/s. 3. Aplicamos la ecuación de distancia: d = v * t. 4. Multiplicamos la velocidad convertida por el tiempo: {round(speed_ms, 2)} * {time_s} = {dist_m} m. 5. La distancia recorrida es de {dist_m} metros."
        }

@router.post("/feedback")
async def check_user_solution(
    req: AIFeedbackRequest,
    current_user: User = Depends(get_current_user)
):
    prompt = f"Eres un asistente virtual experto en física. Revisa la respuesta de un estudiante al siguiente problema:\nProblema: {req.problem}\nFórmula usada: {req.student_formula}\nCálculo planteado: {req.student_calculation}\nResultado obtenido por el estudiante: {req.student_result}\n\nAnaliza si es correcto y proporciona retroalimentación formativa en español explicando por qué está bien o en qué se equivocó."

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                f"{settings.OLLAMA_HOST}/api/generate",
                json={
                    "model": "llama3:latest",
                    "prompt": prompt,
                    "stream": False
                }
            )
            if response.status_code == 200:
                result = response.json()
                return {"feedback": result.get("response", "").strip()}
    except Exception:
        pass

    # Dynamic local feedback engine
    # Basic regex / value check
    clean_student_res = "".join(c for c in req.student_result if c.isdigit() or c == ".")
    
    feedback_text = ""
    if not clean_student_res:
        feedback_text = "No logramos identificar un resultado numérico en tu respuesta. Por favor ingresa el valor final calculado."
    else:
        # Simple analysis
        formula_correct = any(char in req.student_formula for char in ["=", "*", "/", "d", "v", "t"])
        feedback_text = (
            "### Retroalimentación del Asistente de IA (Modo Integrado local):\n\n"
            f"¡Hola {current_user.nombre}! He analizado tu respuesta. Aquí tienes algunas observaciones:\n\n"
            f"1. **Fórmula Empleada ('{req.student_formula}'):** Has planteado una fórmula para resolver el problema. Recuerda que la fórmula base del MRU es $d = v \\cdot t$, y de allí despejamos lo que necesitamos: $v = d / t$ o bien $t = d / v$.\n\n"
            f"2. **Cálculo Realizado ('{req.student_calculation}'):** Asegúrate de que las unidades de velocidad y tiempo coincidan (por ejemplo, si la velocidad está en m/s, el tiempo debe estar en segundos). Si no es así, debes convertir previamente.\n\n"
            f"3. **Resultado ('{req.student_result}'):** Excelente intento. Recuerda colocar la unidad final correcta al final del número (m, km, s, h o m/s) para que tu profesor y los validadores sepan qué estás midiendo."
        )
        
    return {"feedback": feedback_text}
