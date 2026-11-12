from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from api import storage
from api.audit_log import log_action
from api.microservices.data_explorer import sort_latest_first
from api.permissions import IsDataAdminForWrites


# Columnas que devuelve la búsqueda (mismo formato que antes: snake_case)
SEARCH_COLUMNS = [
    'id',
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
    'data_source',
]

# Filtros de coincidencia exacta
EXACT_FILTERS = [
    'reporting_date',
    'country',
    'portfolio',
    'product_type',
    'risk_stage',
    'rating',
    'data_source',
]

# Filtros de texto parcial, sin distinguir mayúsculas (antes: ILIKE)
CONTAINS_FILTERS = [
    'entity_id',
    'entity_name',
]


def distinct_values(rows, column, reverse=False):
    return sorted(
        {row.get(column) for row in rows if row.get(column) not in (None, '')},
        reverse=reverse,
    )


class Housekeeping(APIView):
    permission_classes = [IsDataAdminForWrites]  # subir/borrar: solo DataAdmin


    # ============================================================
    # GET - SEARCH
    # ============================================================

    def get(self, request):

        try:

            all_rows = storage.all_rows('risk_exposures')

            rows = all_rows

            # --------------------------------------------------------
            # FILTROS
            # --------------------------------------------------------

            for column in EXACT_FILTERS:
                value = request.GET.get(column)
                if value:
                    rows = [row for row in rows if row.get(column) == value]

            for column in CONTAINS_FILTERS:
                value = request.GET.get(column)
                if value:
                    needle = value.lower()
                    rows = [
                        row for row in rows
                        if needle in (row.get(column) or '').lower()
                    ]

            default_flag = request.GET.get('default_flag')
            if default_flag in ['true', 'false']:
                expected = default_flag == 'true'
                rows = [row for row in rows if row.get('default_flag') is expected]

            data = [
                {column: row.get(column) for column in SEARCH_COLUMNS}
                for row in sort_latest_first(rows)
            ]

            # ========================================================
            # VALORES DISPONIBLES PARA LOS FILTROS (sobre toda la tabla)
            # ========================================================

            return Response({
                'status': 'success',
                'records': len(data),
                'data': data,
                'filters': {
                    'countries': distinct_values(all_rows, 'country'),
                    'portfolios': distinct_values(all_rows, 'portfolio'),
                    'product_types': distinct_values(all_rows, 'product_type'),
                    'risk_stages': distinct_values(all_rows, 'risk_stage'),
                    'ratings': distinct_values(all_rows, 'rating'),
                    'data_sources': distinct_values(all_rows, 'data_source'),
                    'reporting_dates': distinct_values(all_rows, 'reporting_date', reverse=True)
                }
            })

        except Exception as e:

            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    # ============================================================
    # DELETE
    # ============================================================

    def delete(self, request):

        try:

            ids = request.data.get(
                'ids',
                []
            )

            if not ids:

                return Response({
                    'status': 'error',
                    'message':
                        'No records selected.'
                }, status=status.HTTP_400_BAD_REQUEST)

            ids = {
                int(record_id)
                for record_id in ids
            }

            deleted_records = storage.delete_where(
                'risk_exposures',
                lambda row: row['id'] in ids
            )

            log_action(
                'DELETE',
                'risk_exposures',
                deleted_records,
                f'Housekeeping deletion. IDs: {sorted(ids)}'
            )

            return Response({
                'status': 'success',
                'message':
                    'Records deleted successfully.',
                'recordsDeleted':
                    deleted_records
            })

        except Exception as e:

            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
