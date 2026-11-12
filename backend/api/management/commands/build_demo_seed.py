from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from api import storage
from api.microservices.upload_data import build_records, read_uploaded_file, validate_columns


class _File:
    """Adaptador mínimo para leer un CSV del disco como si fuera una subida."""

    def __init__(self, path):
        self.name = path.name
        self._f = open(path, 'rb')

    def read(self, *args):
        return self._f.read(*args)

    def __getattr__(self, item):
        return getattr(self._f, item)


class Command(BaseCommand):
    help = (
        'Genera data/seed a partir de CSV de demo, usando la misma validación '
        'que Upload Data. Ejemplo: python manage.py build_demo_seed a.csv b.csv'
    )

    def add_arguments(self, parser):
        parser.add_argument('csv_files', nargs='+')

    def handle(self, *args, csv_files, **options):
        seed = Path(settings.DATA_SEED_DIR)
        seed.mkdir(parents=True, exist_ok=True)
        rows = []
        for csv_path in csv_files:
            uploaded = _File(Path(csv_path))
            df = read_uploaded_file(uploaded)
            validate_columns(df)
            records = build_records(df)
            for record in records:
                record['created_at'] = record['updated_at'] = '2026-01-01T00:00:00'
            rows.extend(records)
            self.stdout.write(f'{uploaded.name}: {len(records)} records')
        storage._write(seed / 'risk_exposures.json', {
            'next_id': len(rows) + 1,
            'rows': [{'id': i, **row} for i, row in enumerate(rows, start=1)],
        })
        for table in storage.TABLES:
            if table != 'risk_exposures':
                storage._write(seed / f'{table}.json', storage._empty_table())
        self.stdout.write(self.style.SUCCESS(f'Seed written: {len(rows)} records'))
