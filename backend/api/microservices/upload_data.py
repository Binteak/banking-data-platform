from datetime import datetime
from decimal import Decimal, InvalidOperation

import pandas as pd

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from api import storage
from api.audit_log import log_action
from api.permissions import IsDataAdminForWrites


# ============================================================
# Columnas obligatorias del CSV / XLSX
# ============================================================

REQUIRED_COLUMNS = [
    'reporting_date',
    'entity_id',
    'entity_name',
    'country',
    'portfolio',
    'product_type',
    'exposure_amount',
    'ead_amount',
    'pd',
    'lgd',
    'risk_stage',
    'rating',
    'default_flag',
    'default_date',
    'currency',
    'data_source'
]


# ============================================================
# Reglas de cada columna (las mismas que tenía la tabla SQL)
#   tipo, obligatorio, longitud máxima (texto) o límite (números)
# ============================================================

TEXT, NUMBER, DATE, BOOLEAN = 'text', 'number', 'date', 'boolean'

COLUMN_RULES = {
    'reporting_date':  (DATE,    True,  None),
    'entity_id':       (TEXT,    True,  50),
    'entity_name':     (TEXT,    True,  255),
    'country':         (TEXT,    True,  2),
    'portfolio':       (TEXT,    True,  50),
    'product_type':    (TEXT,    True,  50),
    'exposure_amount': (NUMBER,  True,  (18, 2)),   # NUMERIC(18,2)
    'ead_amount':      (NUMBER,  True,  (18, 2)),
    'pd':              (NUMBER,  True,  (8, 6)),    # NUMERIC(8,6)
    'lgd':             (NUMBER,  True,  (8, 6)),
    'risk_stage':      (TEXT,    True,  20),
    'rating':          (TEXT,    False, 10),
    'default_flag':    (BOOLEAN, True,  None),
    'default_date':    (DATE,    False, None),
    'currency':        (TEXT,    True,  3),
    'data_source':     (TEXT,    False, 100),
}

TRUE_VALUES = {'true', 't', 'yes', 'y', '1'}
FALSE_VALUES = {'false', 'f', 'no', 'n', '0'}


class UploadRowError(Exception):
    """Una fila del fichero no cumple las reglas: no se guarda ninguna."""

    def __init__(self, row_number, column, detail):
        super().__init__(
            f"Row {row_number}: {detail} in '{column}'. No records were inserted."
            if detail != 'required'
            else f"Row {row_number}: required field '{column}' is empty. "
                 f"No records were inserted."
        )


# ============================================================
# Función: leer archivo
# ============================================================

def read_uploaded_file(uploaded_file):

    filename = uploaded_file.name.lower()

    # Todo se lee como texto: la conversión y validación se hace aquí,
    # columna a columna, con las reglas de COLUMN_RULES.
    if filename.endswith('.csv'):

        df = pd.read_csv(uploaded_file, dtype=str, keep_default_na=False)

    elif filename.endswith('.xlsx'):

        df = pd.read_excel(uploaded_file, dtype=str, keep_default_na=False)

    else:

        raise ValueError(
            'File format not supported. Please upload CSV or XLSX.'
        )

    df.columns = [str(column).strip() for column in df.columns]

    return df


# ============================================================
# Función: validar columnas
# ============================================================

def validate_columns(df):

    missing_columns = [
        column
        for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]

    if missing_columns:

        raise ValueError(
            f'Missing columns: {", ".join(missing_columns)}'
        )


# ============================================================
# Conversión y validación de un valor
# ============================================================

def _convert(value, column, row_number):

    kind, required, limit = COLUMN_RULES[column]

    text = '' if value is None else str(value).strip()

    if text == '' or text.lower() in ('nan', 'nat', 'none', 'null'):
        if required:
            raise UploadRowError(row_number, column, 'required')
        return None

    if kind == TEXT:
        if len(text) > limit:
            raise UploadRowError(row_number, column, f'text longer than {limit} characters')
        return text

    if kind == NUMBER:
        try:
            number = Decimal(text)
        except InvalidOperation:
            raise UploadRowError(row_number, column, 'invalid number')
        if not number.is_finite():
            raise UploadRowError(row_number, column, 'invalid number')
        precision, scale = limit
        if abs(number) >= Decimal(10) ** (precision - scale):
            raise UploadRowError(row_number, column, 'number out of range')
        return float(round(number, scale))

    if kind == DATE:
        try:
            return datetime.strptime(text[:10], '%Y-%m-%d').date().isoformat()
        except ValueError:
            raise UploadRowError(row_number, column, 'invalid date (expected YYYY-MM-DD)')

    if kind == BOOLEAN:
        lowered = text.lower()
        if lowered in TRUE_VALUES:
            return True
        if lowered in FALSE_VALUES:
            return False
        raise UploadRowError(row_number, column, 'invalid boolean (expected true/false)')

    raise ValueError(f'Unknown column type: {kind}')


def build_records(df):
    """Convierte y valida todas las filas. Si una falla, se lanza el error
    y no se guarda nada (todo o nada)."""

    now = datetime.now().isoformat(timespec='seconds')

    records = []

    for position, (_, row) in enumerate(df.iterrows()):

        row_number = position + 2  # la fila 1 es la cabecera

        record = {
            column: _convert(row[column], column, row_number)
            for column in REQUIRED_COLUMNS
        }

        record['country'] = record['country'].upper()
        record['created_at'] = now
        record['updated_at'] = now

        records.append(record)

    return records


# ============================================================
# Función: insertar registros
# ============================================================

def insert_risk_exposures(df):

    records = build_records(df)

    storage.insert_many('risk_exposures', records)

    return len(records)


# ============================================================
# Vista: Upload Data
# ============================================================

class uploadData(APIView):
    permission_classes = [IsDataAdminForWrites]  # subir/borrar: solo DataAdmin


    def post(self, request):

        try:

            # ------------------------------------------------
            # Comprobar que existe archivo
            # ------------------------------------------------

            if 'file' not in request.FILES:

                return Response(
                    {
                        'status': 'error',
                        'message': 'No file uploaded.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            uploaded_file = request.FILES['file']


            # ------------------------------------------------
            # Leer y validar archivo
            # ------------------------------------------------

            df = read_uploaded_file(uploaded_file)

            validate_columns(df)


            # ------------------------------------------------
            # Insertar registros (todo o nada)
            # ------------------------------------------------

            inserted_records = insert_risk_exposures(df)

            log_action(
                'UPLOAD',
                'risk_exposures',
                inserted_records,
                f'File {uploaded_file.name} uploaded.'
            )


            # ------------------------------------------------
            # Respuesta
            # ------------------------------------------------

            return Response(
                {
                    'status': 'success',
                    'message': 'File processed successfully.',
                    'filename': uploaded_file.name,
                    'recordsProcessed': len(df),
                    'recordsInserted': inserted_records
                },
                status=status.HTTP_200_OK
            )


        except (ValueError, UploadRowError) as e:

            # Errores del fichero: el usuario puede corregirlos.
            return Response(
                {
                    'status': 'error',
                    'message': str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception:

            # Errores internos: no se exponen detalles.
            return Response(
                {
                    'status': 'error',
                    'message': 'Unexpected error while processing the file.'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
