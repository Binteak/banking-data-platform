"""Tests del backend con almacenamiento JSON (sin base de datos).

Cada test trabaja en una carpeta temporal propia (seed vacío), así que no
toca data/runtime ni depende del orden de ejecución.

Ejecutar con:  python manage.py test
"""

import io
import json
import shutil
import tempfile
from pathlib import Path

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIClient

from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from django.core.cache import cache

from api import storage
from api.auth import create_access_token

HEADER = (
    "reporting_date,entity_id,entity_name,country,portfolio,product_type,exposure_amount,"
    "ead_amount,pd,lgd,risk_stage,rating,default_flag,default_date,currency,data_source"
)
VALID_ROW = "2026-03-31,ENT-ES-0001,Andalucia Logistics,ES,SME,LOAN,780000.00,750000.00,0.041,0.42,STAGE_2,BBB,FALSE,,EUR,CORE_BANKING"
ROW_WITHOUT_ENTITY = "2026-03-31,,Sin Entidad,ES,SME,LOAN,100.00,90.00,0.01,0.40,STAGE_1,A,FALSE,,EUR,CORE_BANKING"

# Filas que se cargan bien pero que Data Quality debe detectar
ROW_PD_TOO_HIGH = "2026-03-31,ENT-ES-0002,PD alta,ES,SME,LOAN,100.00,90.00,1.25,0.40,STAGE_1,A,false,,EUR,CORE_BANKING"
ROW_EAD_GT_EXPOSURE = "2026-03-31,ENT-ES-0003,EAD alta,ES,SME,LOAN,100.00,150.00,0.01,0.40,STAGE_1,A,false,,EUR,CORE_BANKING"
ROW_DEFAULT_NO_DATE = "2026-03-31,ENT-ES-0004,Default sin fecha,ES,SME,LOAN,100.00,90.00,0.01,0.40,STAGE_3,D,true,,EUR,CORE_BANKING"


def csv_file(*rows, name="maestro_ES_03_2026.csv"):
    content = "\n".join([HEADER, *rows]) + "\n"
    return SimpleUploadedFile(name, content.encode("utf-8"), content_type="text/csv")


class JsonStorageTestCase(SimpleTestCase):
    """Base: carpeta de datos y seed temporales y vacíos para cada test."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        (self.tmp / "seed").mkdir()
        self.override = override_settings(
            DATA_DIR=self.tmp / "runtime",
            DATA_SEED_DIR=self.tmp / "seed",
        )
        self.override.enable()
        self.client = APIClient()
        # Todos los endpoints requieren JWT: los tests usan un token válido
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {create_access_token('admin')}")

    def tearDown(self):
        self.override.disable()
        shutil.rmtree(self.tmp, ignore_errors=True)

    def upload(self, file):
        return self.client.post("/api/uploadData/", {"file": file}, format="multipart")

    def exposures(self):
        return storage.all_rows("risk_exposures")


class UploadDataTests(JsonStorageTestCase):

    def test_valid_file_is_inserted(self):
        response = self.upload(csv_file(VALID_ROW, VALID_ROW.replace("0001", "0002")))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["recordsInserted"], 2)
        rows = self.exposures()
        self.assertEqual(len(rows), 2)
        self.assertEqual([row["id"] for row in rows], [1, 2])
        self.assertEqual(rows[0]["exposure_amount"], 780000.0)
        self.assertIs(rows[0]["default_flag"], False)
        self.assertIsNone(rows[0]["default_date"])

    def test_invalid_row_rolls_back_the_whole_file(self):
        response = self.upload(csv_file(VALID_ROW, VALID_ROW, ROW_WITHOUT_ENTITY))

        self.assertEqual(response.status_code, 400)
        message = response.json()["message"]
        self.assertIn("Row 4", message)
        self.assertIn("entity_id", message)
        # Ninguna fila se queda a medias
        self.assertEqual(len(self.exposures()), 0)

    def test_invalid_number_names_the_column(self):
        response = self.upload(csv_file(VALID_ROW.replace("0.041", "abc")))

        self.assertEqual(response.status_code, 400)
        self.assertIn("'pd'", response.json()["message"])
        self.assertEqual(len(self.exposures()), 0)

    def test_text_longer_than_allowed_is_rejected(self):
        response = self.upload(csv_file(VALID_ROW.replace(",ES,", ",ESP,")))

        self.assertEqual(response.status_code, 400)
        self.assertIn("'country'", response.json()["message"])

    def test_missing_columns_are_reported(self):
        bad = SimpleUploadedFile("x.csv", b"reporting_date,entity_id\n2026-03-31,ENT\n", content_type="text/csv")
        response = self.upload(bad)

        self.assertEqual(response.status_code, 400)
        self.assertIn("Missing columns", response.json()["message"])
        self.assertEqual(len(self.exposures()), 0)

    def test_unsupported_format_is_rejected(self):
        response = self.upload(SimpleUploadedFile("datos.txt", b"hola", content_type="text/plain"))

        self.assertEqual(response.status_code, 400)
        self.assertIn("not supported", response.json()["message"])

    def test_request_without_file(self):
        response = self.client.post("/api/uploadData/", {}, format="multipart")

        self.assertEqual(response.status_code, 400)


class DataLifecycleTests(JsonStorageTestCase):
    """Subir -> ver -> calidad -> informe -> borrar: el JSON crece y se reduce."""

    def test_full_lifecycle(self):
        self.upload(csv_file(VALID_ROW, ROW_PD_TOO_HIGH, ROW_EAD_GT_EXPOSURE, ROW_DEFAULT_NO_DATE))

        # Data Explorer: más recientes primero, en camelCase
        explorer = self.client.get("/api/getRiskExposures/").json()["data"]
        self.assertEqual(len(explorer), 4)
        self.assertEqual(explorer[0]["id"], 4)
        self.assertIn("entityName", explorer[0])

        # Data Quality: detecta PD, EAD y default sin fecha
        datasets = self.client.get("/api/dataQuality/").json()["datasets"]
        self.assertEqual(datasets, [{"country": "ES", "dates": ["2026-03-31"]}])

        dq = self.client.post(
            "/api/dataQuality/", {"country": "ES", "reporting_date": "2026-03-31"}, format="json"
        ).json()
        failed = {r["check_name"]: r["records_failed"] for r in dq["results"]}
        self.assertEqual(failed["Invalid PD"], 1)
        self.assertEqual(failed["EAD Greater Than Exposure"], 1)
        self.assertEqual(failed["Default Consistency"], 1)
        self.assertEqual(dq["summary"]["checksFailed"], 3)
        self.assertEqual(dq["summary"]["qualityScore"], 40.0)

        # Audit Reporting: usa el resultado de calidad y guarda las métricas
        report = self.client.post("/api/reporting/", {
            "report_name": "Test report",
            "reporting_date": "2026-03-31",
            "country": "ES",
        }, format="json").json()["report"]
        self.assertEqual(report["recordsAnalysed"], 4)
        self.assertEqual(report["qualityStatus"], "FAILED")
        self.assertEqual(report["metrics"]["totalExposure"], 780300.0)
        self.assertEqual(report["metrics"]["defaultRate"], 0.25)

        history = self.client.get("/api/reporting/").json()["data"]
        self.assertEqual(len(history), 7)

        # Housekeeping: buscar y borrar reduce el JSON
        found = self.client.get("/api/housekeeping/", {"entity_name": "ead"}).json()
        self.assertEqual(found["records"], 1)
        response = self.client.delete(
            "/api/housekeeping/", {"ids": [found["data"][0]["id"]]}, format="json"
        )
        self.assertEqual(response.json()["recordsDeleted"], 1)
        self.assertEqual(len(self.exposures()), 3)

        # Los ids no se reutilizan tras borrar
        self.upload(csv_file(VALID_ROW.replace("0001", "0009")))
        self.assertEqual(max(row["id"] for row in self.exposures()), 5)

        # Todo queda registrado en el log de auditoría
        actions = [row["action"] for row in storage.all_rows("audit_log")]
        self.assertEqual(actions, ["UPLOAD", "DATA_QUALITY", "REPORT", "DELETE", "UPLOAD"])

    def test_reset_returns_to_seed(self):
        seed = {"next_id": 2, "rows": [{"id": 1, "country": "PE", "reporting_date": "2022-09-30"}]}
        (self.tmp / "seed" / "risk_exposures.json").write_text(json.dumps(seed))

        self.assertEqual(len(self.exposures()), 1)
        self.upload(csv_file(VALID_ROW))
        self.assertEqual(len(self.exposures()), 2)

        call_command("reset_demo_data", stdout=io.StringIO())
        self.assertEqual(len(self.exposures()), 1)


class JWTAuthTests(SimpleTestCase):
    """Login, acceso protegido y rechazo de tokens no válidos."""

    LOGIN_URL = "/api/auth/login/"
    PROTECTED_URL = "/api/getRiskExposures/"

    def setUp(self):
        cache.clear()  # reinicia el contador de intentos (throttling)
        self.client = APIClient()

    def login(self, username="admin", password="1234"):
        return self.client.post(self.LOGIN_URL, {"username": username, "password": password}, format="json")

    def test_login_with_valid_credentials_returns_token(self):
        response = self.login()

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["token_type"], "Bearer")
        payload = jwt.decode(
            body["access_token"], settings.JWT_SECRET, algorithms=["HS256"],
            audience=settings.JWT_AUDIENCE, issuer=settings.JWT_ISSUER,
        )
        self.assertEqual(payload["sub"], "admin")

    def test_login_with_invalid_credentials_returns_401(self):
        self.assertEqual(self.login(password="incorrecta").status_code, 401)
        self.assertEqual(self.login(username="otro").status_code, 401)

    def test_login_without_fields_returns_400(self):
        response = self.client.post(self.LOGIN_URL, {}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_protected_endpoint_without_token_returns_401(self):
        response = self.client.get(self.PROTECTED_URL)
        self.assertEqual(response.status_code, 401)
        self.assertIn("Bearer", response["WWW-Authenticate"])

    def test_expired_token_is_rejected(self):
        past = datetime.now(timezone.utc) - timedelta(hours=2)
        token = jwt.encode(
            {"sub": "admin", "iat": past, "exp": past + timedelta(minutes=5),
             "iss": settings.JWT_ISSUER, "aud": settings.JWT_AUDIENCE, "type": "access"},
            settings.JWT_SECRET, algorithm="HS256",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(self.client.get(self.PROTECTED_URL).status_code, 401)

    def test_token_signed_with_other_key_is_rejected(self):
        token = jwt.encode(
            {"sub": "admin", "iat": datetime.now(timezone.utc),
             "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
             "iss": settings.JWT_ISSUER, "aud": settings.JWT_AUDIENCE, "type": "access"},
            "otra-clave-que-no-es-la-del-servidor", algorithm="HS256",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(self.client.get(self.PROTECTED_URL).status_code, 401)

    def test_login_is_rate_limited(self):
        for _ in range(10):
            self.login(password="incorrecta")
        self.assertEqual(self.login().status_code, 429)


# ============================================================
# MICROSOFT ENTRA ID + ROLES
# ============================================================
# Se genera un par de claves RSA para simular a Microsoft: el test firma con
# la privada y el backend verifica con la pública (sin llamadas de red).

from unittest import mock

from cryptography.hazmat.primitives.asymmetric import rsa

OUR_TENANT = "11111111-1111-1111-1111-111111111111"
OTHER_TENANT = "22222222-2222-2222-2222-222222222222"
CLIENT_ID = "33333333-3333-3333-3333-333333333333"
PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)


def entra_token(tenant=OUR_TENANT, roles=None, audience=CLIENT_ID, issuer=None, key=PRIVATE_KEY):
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "aud": audience,
            "iss": issuer or f"https://login.microsoftonline.com/{tenant}/v2.0",
            "tid": tenant,
            "iat": now,
            "nbf": now,
            "exp": now + timedelta(minutes=30),
            "preferred_username": "user@example.com",
            "roles": roles or [],
        },
        key,
        algorithm="RS256",
        headers={"kid": "test-key"},
    )


@override_settings(ENTRA_TENANT_ID=OUR_TENANT, ENTRA_CLIENT_ID=CLIENT_ID, ENTRA_ALLOWED_TENANTS=[])
class EntraIdAndRolesTests(JsonStorageTestCase):

    def setUp(self):
        super().setUp()
        jwks = mock.Mock()
        jwks.get_signing_key_from_jwt.return_value = mock.Mock(key=PRIVATE_KEY.public_key())
        self.jwks_patch = mock.patch("api.auth._entra_jwks_client", return_value=jwks)
        self.jwks_patch.start()

    def tearDown(self):
        self.jwks_patch.stop()
        super().tearDown()

    def use(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_external_microsoft_account_can_read(self):
        self.use(entra_token(tenant=OTHER_TENANT))
        self.assertEqual(self.client.get("/api/getRiskExposures/").status_code, 200)

    def test_external_account_cannot_upload_even_with_dataadmin_claim(self):
        # Otro tenant puede asignar nuestros roles a sus usuarios: se ignora
        self.use(entra_token(tenant=OTHER_TENANT, roles=["DataAdmin"]))
        self.assertEqual(self.upload(csv_file(VALID_ROW)).status_code, 403)

    def test_our_tenant_without_role_is_analyst(self):
        self.use(entra_token(roles=[]))
        self.assertEqual(self.upload(csv_file(VALID_ROW)).status_code, 403)

    def test_our_tenant_dataadmin_can_upload(self):
        self.use(entra_token(roles=["DataAdmin"]))
        self.assertEqual(self.upload(csv_file(VALID_ROW)).status_code, 200)

    def test_token_for_another_app_is_rejected(self):
        self.use(entra_token(audience="otra-aplicacion"))
        self.assertEqual(self.client.get("/api/getRiskExposures/").status_code, 401)

    def test_issuer_not_matching_tenant_is_rejected(self):
        self.use(entra_token(issuer="https://evil.example/v2.0"))
        self.assertEqual(self.client.get("/api/getRiskExposures/").status_code, 401)

    def test_token_signed_with_other_key_is_rejected(self):
        other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.use(entra_token(key=other_key))
        self.assertEqual(self.client.get("/api/getRiskExposures/").status_code, 401)

    @override_settings(ENTRA_ALLOWED_TENANTS=[OUR_TENANT])
    def test_tenant_restriction(self):
        self.use(entra_token(tenant=OTHER_TENANT))
        self.assertEqual(self.client.get("/api/getRiskExposures/").status_code, 401)

    @override_settings(ENTRA_TENANT_ID="", ENTRA_CLIENT_ID="")
    def test_entra_disabled_rejects_microsoft_tokens(self):
        self.use(entra_token())
        self.assertEqual(self.client.get("/api/getRiskExposures/").status_code, 401)

    @override_settings(DEMO_ROLE="Analyst")
    def test_demo_user_as_analyst_cannot_upload(self):
        self.use(create_access_token("admin"))
        self.assertEqual(self.client.get("/api/getRiskExposures/").status_code, 200)
        self.assertEqual(self.upload(csv_file(VALID_ROW)).status_code, 403)
