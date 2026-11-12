"""Registro de auditoría (tabla audit_log en JSON)."""

from datetime import datetime

from api import storage

DEMO_USER = 'demo_admin'


def log_action(action: str, table_name: str, records_affected: int, details: str) -> None:
    storage.insert_many('audit_log', [{
        'username': DEMO_USER,
        'action': action,
        'table_name': table_name,
        'records_affected': int(records_affected),
        'execution_date': datetime.now().isoformat(timespec='seconds'),
        'details': details,
    }])
