from pydantic import BaseModel


class IngestionResult(BaseModel):
    dataset: str
    inserted: int
    errors: list[str] = []
