"""
Schemas para el chat contextual con IA
"""

from typing import Any, Dict, List

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Mensaje del chat"""
    role: str = Field(..., description="'user' o 'assistant'")
    content: str = Field(..., description="Contenido del mensaje")


class PageContext(BaseModel):
    """Contexto de la página actual del usuario"""
    pageId: str = Field(..., description="ID de la página: capture, statistics, etc.")
    pageName: str = Field(..., description="Nombre legible de la página")
    summary: str = Field(default="", description="Resumen textual del estado actual")
    data: Dict[str, Any] = Field(default_factory=dict, description="Datos relevantes de la página")


class ChatRequest(BaseModel):
    """Solicitud de chat con contexto"""
    message: str = Field(..., description="Mensaje del usuario")
    context: PageContext = Field(..., description="Contexto de la página actual")
    history: List[ChatMessage] = Field(default_factory=list, description="Historial reciente (máx 10)")
    stream: bool = Field(default=True, description="Si debe hacer streaming de la respuesta")


class ChatResponse(BaseModel):
    """Respuesta completa del chat (modo no-stream)"""
    role: str = "assistant"
    content: str
    suggestions: List[str] = Field(default_factory=list, description="Acciones sugeridas")
