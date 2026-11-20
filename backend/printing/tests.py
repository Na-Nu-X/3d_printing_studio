import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import CadModelingRequest, PrintMaterial, PrintQuoteRequest

TEMP_MEDIA = tempfile.mkdtemp()


@override_settings(
    MEDIA_ROOT=TEMP_MEDIA,
    REST_FRAMEWORK={
        "DEFAULT_FILTER_BACKENDS": [
            "django_filters.rest_framework.DjangoFilterBackend",
            "rest_framework.filters.SearchFilter",
            "rest_framework.filters.OrderingFilter",
        ],
        "DEFAULT_THROTTLE_CLASSES": [],
        "DEFAULT_THROTTLE_RATES": {"anon": None, "submissions": None},
    },
)
class ApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_data", stdout=open("/dev/null", "w"))

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA, ignore_errors=True)

    def test_seed_is_idempotent(self):
        call_command("seed_data", stdout=open("/dev/null", "w"))
        self.assertEqual(PrintMaterial.objects.count(), 8)

    def test_technologies_include_material_counts(self):
        res = self.client.get("/api/technologies/")
        self.assertEqual(res.status_code, 200)
        counts = {t["slug"]: t["material_count"] for t in res.json()}
        self.assertEqual(counts, {"fdm": 5, "sla": 2, "sls": 1})

    def test_material_filters(self):
        res = self.client.get("/api/materials/", {"technology": "sla"})
        self.assertEqual(len(res.json()), 2)
        res = self.client.get("/api/materials/", {"featured": "true"})
        self.assertTrue(all(m["is_featured"] for m in res.json()))
        res = self.client.get("/api/materials/", {"ordering": "-price_per_gram_eur"})
        self.assertEqual(res.json()[0]["slug"], "pa12-sintered-nylon")

    def test_material_search_matches_slovak_property_tags(self):
        res = self.client.get("/api/materials/", {"search": "uhlíkové"})
        self.assertEqual([m["slug"] for m in res.json()], ["pa12-cf"])

    def test_material_detail(self):
        res = self.client.get("/api/materials/pa12-cf/")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn("detailed_description", body)
        self.assertEqual(body["technology"]["slug"], "fdm")

    def test_portfolio_filter(self):
        res = self.client.get("/api/portfolio/", {"technology": "sls"})
        self.assertEqual(len(res.json()), 1)

    def test_quote_with_file_upload(self):
        upload = SimpleUploadedFile("diel.stl", b"solid test\nendsolid test\n")
        res = self.client.post(
            "/api/quotes/",
            {
                "material": "petg",
                "model_file": upload,
                "quantity": 25,
                "infill_level": "reinforced",
                "post_processing": "threaded_inserts",
                "client_type": "firma",
                "company_name": "Strojárne s.r.o.",
                "client_name": "Ján Novák",
                "email": "jan@example.sk",
            },
            format="multipart",
        )
        self.assertEqual(res.status_code, 201, res.content)
        quote = PrintQuoteRequest.objects.get()
        self.assertEqual(quote.technology.slug, "fdm")
        self.assertTrue(quote.model_file.name.startswith("quotes/models/"))

    def test_quote_json_with_link(self):
        res = self.client.post(
            "/api/quotes/",
            {
                "external_file_link": "https://drive.example.com/model.step",
                "client_type": "sukromna_osoba",
                "client_name": "Eva Malá",
                "email": "eva@example.sk",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)

    def test_quote_validation(self):
        bad = SimpleUploadedFile("virus.exe", b"MZ")
        res = self.client.post(
            "/api/quotes/",
            {"model_file": bad, "client_name": "Ja", "email": "x", "client_type": "firma"},
            format="multipart",
        )
        self.assertEqual(res.status_code, 400)
        errors = res.json()
        self.assertIn("model_file", errors)
        self.assertIn("email", errors)
        self.assertIn("client_name", errors)

        res = self.client.post(
            "/api/quotes/",
            {"client_name": "Ján Novák", "email": "jan@example.sk", "client_type": "firma"},
            format="json",
        )
        self.assertIn("model_file", res.json())

    def test_quote_rejects_material_technology_mismatch(self):
        res = self.client.post(
            "/api/quotes/",
            {
                "technology": "sla",
                "material": "petg",
                "external_file_link": "https://example.com/a.stl",
                "client_type": "sukromna_osoba",
                "client_name": "Ján Novák",
                "email": "jan@example.sk",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("material", res.json())

    def test_modeling_request(self):
        res = self.client.post(
            "/api/modeling-requests/",
            {
                "service_type": "reverzne_inzinierstvo",
                "description": "Prasknutý plastový úchyt z priemyselnej práčky, potrebujeme 4 ks.",
                "client_name": "Peter Kováč",
                "email": "peter@example.sk",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(CadModelingRequest.objects.count(), 1)

        res = self.client.post(
            "/api/modeling-requests/",
            {"service_type": "nieco", "description": "krátke", "client_name": "", "email": ""},
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertEqual(
            set(res.json()), {"service_type", "description", "client_name", "email"}
        )

    def test_read_only_endpoints_reject_writes(self):
        res = self.client.post("/api/materials/", {"name": "x"}, format="json")
        self.assertEqual(res.status_code, 405)
        res = self.client.get("/api/quotes/")
        self.assertEqual(res.status_code, 405)
