from datetime import datetime

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from api import storage
from api.audit_log import log_action


def _is_blank(value):
    return value is None or str(value).strip() == ''


def _out_of_unit_range(value):
    return value is None or value < 0 or value > 1


# ============================================================
# Controles de calidad: (nombre, descripción, regla de fallo,
# mensaje si todo va bien, mensaje si hay fallos)
# ============================================================

CHECKS = [
    (
        'Missing Entity ID',
        'Validates that every exposure contains a valid entity identifier.',
        lambda row: _is_blank(row.get('entity_id')),
        'No missing entity identifiers detected.',
        '{failed} records have missing entity IDs.',
    ),
    (
        'Invalid PD',
        'Validates that Probability of Default is between 0 and 1.',
        lambda row: _out_of_unit_range(row.get('pd')),
        'All PD values are valid.',
        '{failed} invalid PD values detected.',
    ),
    (
        'Invalid LGD',
        'Validates that Loss Given Default is between 0 and 1.',
        lambda row: _out_of_unit_range(row.get('lgd')),
        'All LGD values are valid.',
        '{failed} invalid LGD values detected.',
    ),
    (
        'Default Consistency',
        'Validates consistency between default status and default date.',
        lambda row: (
            (row.get('default_flag') is True and _is_blank(row.get('default_date')))
            or (row.get('default_flag') is False and not _is_blank(row.get('default_date')))
        ),
        'Default flags and dates are consistent.',
        '{failed} inconsistent default records.',
    ),
    (
        'EAD Greater Than Exposure',
        'Validates that Exposure at Default does not exceed total exposure.',
        lambda row: (
            row.get('ead_amount') is not None
            and row.get('exposure_amount') is not None
            and row['ead_amount'] > row['exposure_amount']
        ),
        'No invalid EAD values detected.',
        '{failed} invalid EAD values detected.',
    ),
]


class DataQuality(APIView):

    # ============================================================
    # GET - PAÍSES Y FECHAS DISPONIBLES
    # ============================================================

    def get(self, request):

        try:

            datasets = {}

            for row in storage.all_rows('risk_exposures'):
                country = row.get('country')
                reporting_date = row.get('reporting_date')
                if country and reporting_date:
                    datasets.setdefault(country, set()).add(reporting_date)

            response_datasets = [
                {
                    'country': country,
                    'dates': sorted(dates, reverse=True)
                }
                for country, dates in sorted(datasets.items())
            ]

            return Response(
                {
                    'status': 'success',
                    'datasets': response_datasets
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


    # ============================================================
    # POST - EJECUTAR LOS CONTROLES
    # ============================================================

    def post(self, request):

        try:

            country = request.data.get('country')

            reporting_date = request.data.get('reporting_date')

            if not country:

                return Response(
                    {
                        'status': 'error',
                        'message': 'Country is required.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not reporting_date:

                return Response(
                    {
                        'status': 'error',
                        'message': 'Reporting date is required.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            country = country.upper().strip()

            # ------------------------------------------------
            # DATASET
            # ------------------------------------------------

            dataset = [
                row for row in storage.all_rows('risk_exposures')
                if row.get('country') == country
                and row.get('reporting_date') == reporting_date
            ]

            total_records = len(dataset)

            if total_records == 0:

                return Response(
                    {
                        'status': 'error',
                        'message':
                            'No exposure records found for '
                            f'country {country} and '
                            f'reporting date {reporting_date}.'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            # ------------------------------------------------
            # CONTROLES
            # ------------------------------------------------

            execution_date = datetime.now().isoformat(timespec='seconds')

            results = []

            for name, description, fails, ok_message, ko_message in CHECKS:

                failed = sum(1 for row in dataset if fails(row))

                results.append({
                    'country': country,
                    'reporting_date': reporting_date,
                    'check_name': name,
                    'check_description': description,
                    'status': 'PASSED' if failed == 0 else 'FAILED',
                    'records_checked': total_records,
                    'records_failed': failed,
                    'execution_date': execution_date,
                    'details': ok_message if failed == 0 else ko_message.format(failed=failed),
                })

            # ------------------------------------------------
            # GUARDAR: sustituye la ejecución anterior del
            # mismo país + fecha
            # ------------------------------------------------

            with storage.modify('data_quality_results') as doc:

                doc['rows'] = [
                    row for row in doc['rows']
                    if not (
                        row.get('country') == country
                        and row.get('reporting_date') == reporting_date
                    )
                ]

                for result in results:
                    doc['rows'].append({'id': doc['next_id'], **result})
                    doc['next_id'] += 1

            log_action(
                'DATA_QUALITY',
                'risk_exposures',
                total_records,
                'Data quality validation executed '
                f'for country {country} '
                f'and reporting date {reporting_date}.'
            )

            # ------------------------------------------------
            # RESUMEN
            # ------------------------------------------------

            passed = sum(1 for result in results if result['status'] == 'PASSED')

            failed_checks = len(results) - passed

            quality_score = (passed / len(results)) * 100 if results else 0

            return Response({
                'status': 'success',
                'country': country,
                'reportingDate': reporting_date,
                'summary': {
                    'recordsChecked': total_records,
                    'checksExecuted': len(results),
                    'checksPassed': passed,
                    'checksFailed': failed_checks,
                    'qualityScore': round(quality_score, 2)
                },
                'results': [
                    {key: value for key, value in result.items() if key != 'execution_date'}
                    for result in results
                ]
            })

        except Exception as e:

            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
