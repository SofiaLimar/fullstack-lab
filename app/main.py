"""API de eventos usada em todas as etapas do projeto."""

from datetime import date

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, make_engine
from app.db_session import find_event, get_session
from app.models import Event
from app.registrations import count_registrations, router


class EventInput(BaseModel):
    """Dados enviados pelo cliente ao cadastrar um evento."""

    title: str
    date: date
    capacity: int


def event_to_dict(session: Session, event: Event) -> dict:
    """Monta a resposta de um evento, incluindo as vagas disponíveis."""
    return {
        "id": event.id,
        "title": event.title,
        "date": event.date,
        "capacity": event.capacity,
        "available_slots": event.capacity - count_registrations(session, event.id),
    }


def create_app(database_url: str = "sqlite://") -> FastAPI:
    """Cria uma API ligada ao banco indicado pela URL."""
    app = FastAPI(title="Eventos do Trilha")
    app.state.engine = make_engine(database_url)
    Base.metadata.create_all(app.state.engine)

    @app.get("/events")
    def list_events(session: Session = Depends(get_session)):
        events = session.scalars(select(Event).order_by(Event.id)).all()
        return [event_to_dict(session, event) for event in events]

    @app.get("/events/{event_id}")
    def get_event(event_id: int, session: Session = Depends(get_session)):
        event = find_event(session, event_id)
        if event is None:
            raise HTTPException(status_code=404, detail="Evento não encontrado")
        return event_to_dict(session, event)

    @app.post("/events", status_code=201)
    def create_event(data: EventInput, session: Session = Depends(get_session)):
        if data.title == "":
            raise HTTPException(status_code=422, detail="Título não pode ser vazio")
        if data.capacity <= 0:
            raise HTTPException(status_code=422, detail="Capacidade deve ser maior que zero")

        event = Event(title=data.title, date=data.date, capacity=data.capacity)
        session.add(event)
        session.commit()
        return event_to_dict(session, event)

    app.include_router(router)
    return app


app = create_app("sqlite:///events.db")