from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from api import storage


# ============================================================
# Columnas: nombre en el JSON -> nombre en la API (camelCase)
# ============================================================

COLUMNS = {
    'id': 'id',
    'reporting_date': 'reportingDate',
    'entity_id': 'entityId',
    'entity_name': 'entityName',
    'country': 'country',
    'portfolio': 'portfolio',
    'product_type': 'productType',
    'exposure_amount': 'exposureAmount',
    'ead_amount': 'eadAmount',
    'pd': 'pd',
    'lgd': 'lgd',
    'risk_stage': 'riskStage',
    'rating': 'rating',
    'default_flag': 'defaultFlag',
    'default_date': 'defaultDate',
    'currency': 'currency',
    'data_source': 'dataSource',
}


def sort_latest_first(rows):
    """Mismo orden que antes: id, fecha de reporte y entidad, descendente."""
    return sorted(
        rows,
        key=lambda row: (row['id'], row.get('reporting_date') or '', row.get('entity_id') or ''),
        reverse=True,
    )


# ============================================================
# Función: obtener exposiciones de riesgo
# ============================================================

def get_risk_exposures_data():

    rows = sort_latest_first(storage.all_rows('risk_exposures'))

    return [
        {api_name: row.get(column) for column, api_name in COLUMNS.items()}
        for row in rows
    ]


# ============================================================
# Vista: getRiskExposures
# ============================================================

class getRiskExposures(APIView):

    def get(self, request):

        try:

            data = get_risk_exposures_data()

            return Response(
                {
                    'status': 'success',
                    'data': data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:

            return Response(
                {
                    'status': 'error',
                    'message': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
