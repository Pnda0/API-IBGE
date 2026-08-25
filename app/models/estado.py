from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Estado(Base):
    __tablename__ = "estados"

    id: Mapped[int] = mapped_column(primary_key=True)
    sigla: Mapped[str] = mapped_column(String(2), unique=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)