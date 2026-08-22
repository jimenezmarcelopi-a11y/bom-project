from sqlmodel import create_engine, Session, SQLModel
from app.config import settings

# Create database engine
engine = create_engine(settings.DATABASE_URL, echo=True)

def init_db():
    # This will create all tables based on our SQLModel declarations if they don't exist
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
