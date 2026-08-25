from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Populacao(Base):
    __tablename__ = "populacao"

    id: Mapped[int] = mapped_column(primary_key=True)

    municipio_id: Mapped[int] = mapped_column(
        ForeignKey("municipios.id"),
        nullable=False,
    )

    ano: Mapped[int] = mapped_column(nullable=False)

    populacao: Mapped[int] = mapped_column(nullable=False)