from django.urls import path
from api.microservices.auth_login import LoginView

from api.microservices import (
    housekeeping,
    upload_data,
    data_explorer,
    data_quality,
    audit_reporting,
)



urlpatterns = [
    # ============================================================
    # AUTH - JWT (único endpoint público de la API)
    # ============================================================

    path('api/auth/login/', LoginView.as_view(), name='login'),


    # ============================================================
    # HOUSEKEEPING - EXISTENTE
    # ============================================================

    path(
        'api/housekeeping/',
        housekeeping.Housekeeping.as_view(),
        name='housekeeping'
    ),


    # ============================================================
    # NUEVO - UPLOAD DATA
    # ============================================================

    path(
        'api/uploadData/',
        upload_data.uploadData.as_view(),
        name='uploadData'
    ),

    # ============================================================
    # NUEVO - DATA EXPLORER
    # ============================================================

    path(
        'api/getRiskExposures/',
        data_explorer.getRiskExposures.as_view(),
        name='getRiskExposures'
    ),

    # ============================================================
    # NUEVO - DATA QUALITY
    # ============================================================

    path(
        'api/dataQuality/',
        data_quality.DataQuality.as_view(),
        name='dataQuality'
    ),

    # ============================================================
    # NUEVO - AUDIT REPORTING
    # ============================================================

    path(
        'api/reporting/',
        audit_reporting.Reporting.as_view(),
        name='reporting'
    ),

]