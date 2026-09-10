from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Municipio(Base):
    __tablename__ = "municipios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)

    estado_id: Mapped[int] = mapped_column(
        ForeignKey("estados.id"),
        nullable=False,
    )