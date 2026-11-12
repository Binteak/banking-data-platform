import csv
from datetime import datetime

from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from api import storage
from api.audit_log import log_action


# Filtros del universo de reporting: parámetro -> columna de la tabla
FILTER_COLUMNS = {
    'reporting_date': 'reporting_date',
    'country': 'country',
    'portfolio': 'portfolio',
    'product_type': 'product_type',
    'risk_stage': 'risk_stage',
    'rating': 'rating',
}

EXPORT_COLUMNS = [
    'id',
    'reporting_date',
    'country',
    'portfolio',
    'product_type',
    'risk_stage',
    'rating',
    'default_flag',
    'exposure_amount',
    'ead_amount',
    'pd',
    'lgd',
]

HISTORY_COLUMNS = [
    'id',
    'reporting_date',
    'report_name',
    'metric_name',
    'metric_value',
    'portfolio',
    'country',
    'product_type',
    'risk_stage',
    'rating',
    'default_status',
    'records_analysed',
    'execution_date',
    'details',
]

METRIC_DEFINITIONS = [
    ('EXPOSURE_COUNT', 'exposureCount',
     'Number of exposure records included in the selected reporting universe.'),
    ('TOTAL_EXPOSURE', 'totalExposure',
     'Total exposure amount for the selected reporting universe.'),
    ('TOTAL_EAD', 'totalEad',
     'Total Exposure at Default for the selected reporting universe.'),
    ('AVERAGE_PD', 'averagePd',
     'Average Probability of Default across the selected exposures.'),
    ('AVERAGE_LGD', 'averageLgd',
     'Average Loss Given Default across the selected exposures.'),
    ('DEFAULT_RATE', 'defaultRate',
     'Percentage of exposures currently classified as defaulted.'),
    ('EXPECTED_LOSS', 'expectedLoss',
     'Expected loss calculated as EAD multiplied by PD and LGD.'),
]


def filter_rows(rows, params, exclude=None):
    """Aplica los filtros recibidos. ``exclude`` deja fuera uno de ellos
    (para calcular las opciones disponibles de ese mismo desplegable)."""

    for param, column in FILTER_COLUMNS.items():
        value = params.get(param)
        if value and exclude != param:
            rows = [row for row in rows if row.get(column) == value]

    default_status = params.get('default_status')
    if default_status and exclude != 'default_status':
        if default_status == 'DEFAULT':
            rows = [row for row in rows if row.get('default_flag') is True]
        elif default_status == 'NON_DEFAULT':
            rows = [row for row in rows if row.get('default_flag') is False]

    return rows


def distinct(rows, column, reverse=False):
    return sorted(
        {row.get(column) for row in rows if row.get(column) is not None},
        reverse=reverse,
    )


def csv_value(column, value):
    """Mismo formato que tenía la exportación desde la base de datos."""
    if value is None:
        return ''
    if column in ('exposure_amount', 'ead_amount'):
        return f'{value:.2f}'
    if column in ('pd', 'lgd'):
        return f'{value:.6f}'
    return value


class Reporting(APIView):

    # ============================================================
    # GET
    # ============================================================

    def get(self, request):

        try:

            action = request.query_params.get('action')

            params = request.query_params

            # ----------------------------------------------------
            # FILTROS DINÁMICOS (cada desplegable muestra los
            # valores compatibles con el resto de filtros)
            # ----------------------------------------------------

            if action == 'filters':

                rows = storage.all_rows('risk_exposures')

                def options(param, column, reverse=False):
                    return distinct(filter_rows(rows, params, exclude=param), column, reverse)

                default_values = options('default_status', 'default_flag')

                default_statuses = [
                    'DEFAULT' if value is True else 'NON_DEFAULT'
                    for value in default_values
                ]

                return Response({
                    'status': 'success',
                    'filters': {
                        'reportingDates': options('reporting_date', 'reporting_date', reverse=True),
                        'countries': options('country', 'country'),
                        'portfolios': options('portfolio', 'portfolio'),
                        'productTypes': options('product_type', 'product_type'),
                        'riskStages': options('risk_stage', 'risk_stage'),
                        'ratings': options('rating', 'rating'),
                        'defaultStatuses': default_statuses
                    }
                })

            # ----------------------------------------------------
            # EXPORTAR CSV
            # ----------------------------------------------------

            if action == 'export':

                rows = sorted(
                    filter_rows(storage.all_rows('risk_exposures'), params),
                    key=lambda row: row['id'],
                )

                response = HttpResponse(content_type='text/csv')

                response['Content-Disposition'] = (
                    'attachment; filename="filtered_exposures.csv"'
                )

                writer = csv.writer(response)

                writer.writerow(EXPORT_COLUMNS)

                for row in rows:
                    writer.writerow([
                        csv_value(column, row.get(column))
                        for column in EXPORT_COLUMNS
                    ])

                return response

            # ----------------------------------------------------
            # HISTÓRICO DE INFORMES
            # Sin filtros devuelve todo; con report_name,
            # reporting_date y country devuelve ese informe.
            # ----------------------------------------------------

            history = storage.all_rows('reporting_results')

            for param in ('report_name', 'reporting_date', 'country'):
                value = params.get(param)
                if value:
                    history = [row for row in history if row.get(param) == value]

            history.sort(
                key=lambda row: (row.get('execution_date') or '', row['id']),
                reverse=True,
            )

            data = [
                {column: row.get(column) for column in HISTORY_COLUMNS}
                for row in history
            ]

            return Response({
                'status': 'success',
                'data': data
            })

        except Exception as e:

            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    # ============================================================
    # POST - CALCULAR MÉTRICAS
    # ============================================================

    def post(self, request):

        try:

            data = request.data

            # El nombre lo escribe el usuario
            report_name = data.get('report_name')

            reporting_date = data.get('reporting_date')

            country = data.get('country')

            portfolio = data.get('portfolio')

            product_type = data.get('product_type')

            risk_stage = data.get('risk_stage')

            rating = data.get('rating')

            default_status = data.get('default_status')

            if not report_name:

                return Response({
                    'status': 'error',
                    'message': 'Report name is required.'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not reporting_date:

                return Response({
                    'status': 'error',
                    'message': 'Reporting date is required.'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not country:

                return Response({
                    'status': 'error',
                    'message': 'Country is required.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # ----------------------------------------------------
            # CALIDAD DEL DATO (última ejecución de Data Quality
            # para ese país y fecha)
            # ----------------------------------------------------

            quality_rows = [
                row for row in storage.all_rows('data_quality_results')
                if row.get('reporting_date') == reporting_date
                and row.get('country') == country
            ]

            total_quality_checks = len(quality_rows)

            failed_quality_checks = sum(
                1 for row in quality_rows if row.get('status') == 'FAILED'
            )

            quality_status = 'NOT_AVAILABLE'

            quality_score = None

            if total_quality_checks > 0:

                quality_score = (
                    (total_quality_checks - failed_quality_checks)
                    / total_quality_checks
                ) * 100

                quality_status = 'FAILED' if failed_quality_checks > 0 else 'PASSED'

            # ----------------------------------------------------
            # UNIVERSO DE REPORTING
            # ----------------------------------------------------

            universe = filter_rows(
                storage.all_rows('risk_exposures'),
                {
                    'reporting_date': reporting_date,
                    'country': country,
                    'portfolio': portfolio,
                    'product_type': product_type,
                    'risk_stage': risk_stage,
                    'rating': rating,
                    'default_status': default_status,
                },
            )

            exposure_count = len(universe)

            if exposure_count == 0:

                return Response({
                    'status': 'error',
                    'message': 'No exposure records match the selected filters.'
                }, status=status.HTTP_404_NOT_FOUND)

            # ----------------------------------------------------
            # MÉTRICAS
            # ----------------------------------------------------

            def total(column):
                return sum(row.get(column) or 0 for row in universe)

            metrics = {
                'exposureCount': exposure_count,
                'totalExposure': round(total('exposure_amount'), 2),
                'totalEad': round(total('ead_amount'), 2),
                'averagePd': total('pd') / exposure_count,
                'averageLgd': total('lgd') / exposure_count,
                'defaultRate': sum(1 for row in universe if row.get('default_flag')) / exposure_count,
                'expectedLoss': round(sum(
                    (row.get('ead_amount') or 0) * (row.get('pd') or 0) * (row.get('lgd') or 0)
                    for row in universe
                ), 6),
            }

            # ----------------------------------------------------
            # GUARDAR: sustituye la versión anterior del mismo
            # nombre + fecha + país
            # ----------------------------------------------------

            execution_date = datetime.now().isoformat(timespec='seconds')

            with storage.modify('reporting_results') as doc:

                doc['rows'] = [
                    row for row in doc['rows']
                    if not (
                        row.get('report_name') == report_name
                        and row.get('reporting_date') == reporting_date
                        and row.get('country') == country
                    )
                ]

                for metric_name, metric_key, details in METRIC_DEFINITIONS:
                    doc['rows'].append({
                        'id': doc['next_id'],
                        'report_name': report_name,
                        'reporting_date': reporting_date,
                        'country': country,
                        'portfolio': portfolio or 'ALL',
                        'product_type': product_type or 'ALL',
                        'risk_stage': risk_stage or 'ALL',
                        'rating': rating or 'ALL',
                        'default_status': default_status or 'ALL',
                        'metric_name': metric_name,
                        'metric_value': metrics[metric_key],
                        'records_analysed': exposure_count,
                        'execution_date': execution_date,
                        'details': details,
                    })
                    doc['next_id'] += 1

            audit_status = 'validated' if quality_status == 'PASSED' else 'not validated'

            log_action(
                'REPORT',
                'risk_exposures',
                exposure_count,
                f"Report '{report_name}' generated "
                f'for {reporting_date}, '
                f'country={country}, '
                f'Data Quality={quality_status}. '
                f'Report is {audit_status}.'
            )

            return Response({
                'status': 'success',
                'report': {
                    'reportName': report_name,
                    'reportingDate': reporting_date,
                    'country': country,
                    'recordsAnalysed': exposure_count,
                    'qualityStatus': quality_status,
                    'qualityScore': quality_score,
                    'failedQualityChecks': failed_quality_checks,
                    'totalQualityChecks': total_quality_checks,
                    'filters': {
                        'portfolio': portfolio or 'ALL',
                        'country': country,
                        'productType': product_type or 'ALL',
                        'riskStage': risk_stage or 'ALL',
                        'rating': rating or 'ALL',
                        'defaultStatus': default_status or 'ALL'
                    },
                    'metrics': {key: float(value) if key != 'exposureCount' else int(value)
                                for key, value in metrics.items()}
                }
            })

        except Exception as e:

            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
