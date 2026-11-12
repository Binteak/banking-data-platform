"""Almacenamiento en archivos JSON (sustituye a PostgreSQL).

Cada tabla es un archivo ``<tabla>.json`` con esta forma::

    {"next_id": 11, "rows": [{"id": 1, ...}, ...]}

- ``data/seed/``    estado inicial de la demo (versionado en git).
- ``data/runtime/`` datos vivos: crecen al subir CSV y se reducen con
  Housekeeping. Si no existen se copian desde ``seed``. En Render el disco no
  es persistente, así que cada reinicio devuelve la demo a su estado inicial.

Las escrituras son atómicas (archivo temporal + ``os.replace``) y se
serializan con un bloqueo de archivo, para que varios workers de gunicorn
no se pisen. En Windows (desarrollo con ``runserver``) se usa un bloqueo
de hilo, suficiente para un único proceso.
"""

import json
import os
import shutil
import tempfile
import threading
from contextlib import contextmanager
from pathlib import Path

from django.conf import settings

try:
    import fcntl
except ImportError:  # Windows
    fcntl = None


TABLES = (
    'risk_exposures',
    'data_quality_results',
    'reporting_results',
    'audit_log',
)

_thread_lock = threading.RLock()


def seed_dir() -> Path:
    return Path(settings.DATA_SEED_DIR)


def data_dir() -> Path:
    return Path(settings.DATA_DIR)


def _table_path(table: str) -> Path:
    if table not in TABLES:
        raise ValueError(f'Unknown table: {table}')
    return data_dir() / f'{table}.json'


@contextmanager
def _locked():
    """Bloqueo exclusivo entre procesos (y entre hilos del mismo proceso)."""
    data_dir().mkdir(parents=True, exist_ok=True)
    with _thread_lock:
        if fcntl is None:
            yield
            return
        with open(data_dir() / '.lock', 'a') as lock_file:
            fcntl.flock(lock_file, fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(lock_file, fcntl.LOCK_UN)


def _empty_table() -> dict:
    return {'next_id': 1, 'rows': []}


def _ensure_table(table: str) -> None:
    """Crea el archivo vivo a partir del seed (o vacío) si todavía no existe."""
    path = _table_path(table)
    if path.exists():
        return
    seed = seed_dir() / f'{table}.json'
    if seed.exists():
        shutil.copyfile(seed, path)
    else:
        _write(path, _empty_table())


def _read(path: Path) -> dict:
    with open(path, encoding='utf-8') as f:
        doc = json.load(f)
    doc.setdefault('next_id', 1)
    doc.setdefault('rows', [])
    return doc


def _write(path: Path, doc: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=path.stem, suffix='.tmp')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise


# ============================================================
# API pública
# ============================================================

def all_rows(table: str) -> list[dict]:
    """Copia de todas las filas de una tabla."""
    with _locked():
        _ensure_table(table)
        return [dict(row) for row in _read(_table_path(table))['rows']]


@contextmanager
def modify(table: str):
    """Lectura-modificación-escritura atómica de una tabla.

    Uso::

        with storage.modify('risk_exposures') as doc:
            doc['rows'].append(...)

    Si el bloque lanza una excepción, no se guarda nada (todo o nada).
    """
    with _locked():
        _ensure_table(table)
        path = _table_path(table)
        doc = _read(path)
        yield doc
        _write(path, doc)


def insert_many(table: str, rows: list[dict]) -> list[int]:
    """Inserta filas asignando ids consecutivos. Devuelve los ids."""
    with modify(table) as doc:
        ids = []
        for row in rows:
            row_id = doc['next_id']
            doc['next_id'] += 1
            doc['rows'].append({'id': row_id, **row})
            ids.append(row_id)
        return ids


def delete_where(table: str, predicate) -> int:
    """Borra las filas que cumplen ``predicate``. Devuelve cuántas."""
    with modify(table) as doc:
        before = len(doc['rows'])
        doc['rows'] = [row for row in doc['rows'] if not predicate(row)]
        return before - len(doc['rows'])


def reset_to_seed() -> None:
    """Devuelve todas las tablas al estado inicial de la demo."""
    with _locked():
        for table in TABLES:
            path = _table_path(table)
            if path.exists():
                path.unlink()
            _ensure_table(table)
