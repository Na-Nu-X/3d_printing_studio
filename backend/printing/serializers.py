import os

from django.conf import settings
from rest_framework import serializers

from .models import (
    CadModelingRequest,
    PortfolioProject,
    PrintMaterial,
    PrintQuoteRequest,
    PrintTechnology,
)

ALLOWED_MODEL_EXTENSIONS = {".stl", ".step", ".stp", ".3mf", ".obj", ".zip"}


class TechnologyBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrintTechnology
        fields = ["id", "name", "slug", "icon_name", "tolerance_label"]


class PrintTechnologySerializer(serializers.ModelSerializer):
    material_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = PrintTechnology
        fields = [
            "id",
            "name",
            "slug",
            "short_summary",
            "tolerance_label",
            "max_build_volume",
            "min_layer_height",
            "typical_lead_time",
            "icon_name",
            "display_order",
            "material_count",
        ]


class PrintMaterialListSerializer(serializers.ModelSerializer):
    technology = TechnologyBriefSerializer(read_only=True)

    class Meta:
        model = PrintMaterial
        fields = [
            "id",
            "name",
            "slug",
            "technology",
            "short_description",
            "properties_tags",
            "available_colors",
            "price_per_gram_eur",
            "setup_fee_eur",
            "tensile_strength_mpa",
            "max_temp_celsius",
            "is_featured",
        ]


class PrintMaterialDetailSerializer(PrintMaterialListSerializer):
    technology = PrintTechnologySerializer(read_only=True)

    class Meta(PrintMaterialListSerializer.Meta):
        fields = PrintMaterialListSerializer.Meta.fields + [
            "detailed_description",
            "applications",
            "density_g_cm3",
        ]


class PortfolioProjectSerializer(serializers.ModelSerializer):
    technology = TechnologyBriefSerializer(read_only=True)
    material = serializers.SerializerMethodField()

    class Meta:
        model = PortfolioProject
        fields = [
            "id",
            "title",
            "slug",
            "technology",
            "material",
            "client_sector",
            "challenge_summary",
            "production_specs",
            "quantity_produced",
            "image_url",
            "is_featured",
        ]

    def get_material(self, obj: PortfolioProject):
        if obj.material is None:
            return None
        return {"id": obj.material.id, "name": obj.material.name, "slug": obj.material.slug}


class PrintQuoteRequestSerializer(serializers.ModelSerializer):
    technology = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=PrintTechnology.objects.all(),
        required=False,
        allow_null=True,
        error_messages={"does_not_exist": "Zvolená technológia neexistuje."},
    )
    material = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=PrintMaterial.objects.select_related("technology"),
        required=False,
        allow_null=True,
        error_messages={"does_not_exist": "Zvolený materiál neexistuje."},
    )

    class Meta:
        model = PrintQuoteRequest
        fields = [
            "id",
            "technology",
            "material",
            "model_file",
            "external_file_link",
            "quantity",
            "desired_color",
            "infill_level",
            "post_processing",
            "client_type",
            "company_name",
            "client_name",
            "email",
            "phone",
            "notes",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]
        extra_kwargs = {"model_file": {"write_only": True}}

    def validate_model_file(self, value):
        if value is None:
            return value
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ALLOWED_MODEL_EXTENSIONS:
            raise serializers.ValidationError(
                "Nepodporovaný formát súboru. Povolené sú: "
                + ", ".join(sorted(ALLOWED_MODEL_EXTENSIONS))
                + "."
            )
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if value.size > max_bytes:
            raise serializers.ValidationError(
                f"Súbor je príliš veľký. Maximálna veľkosť je {settings.MAX_UPLOAD_SIZE_MB} MB."
            )
        return value

    def validate_client_name(self, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("Zadajte prosím celé meno a priezvisko.")
        return value

    def validate(self, attrs):
        if not attrs.get("model_file") and not attrs.get("external_file_link"):
            raise serializers.ValidationError(
                {
                    "model_file": "Nahrajte 3D model alebo vložte odkaz na súbor v cloude."
                }
            )
        if attrs.get("client_type") == PrintQuoteRequest.ClientType.COMPANY and not (
            attrs.get("company_name") or ""
        ).strip():
            raise serializers.ValidationError(
                {"company_name": "Pre firemný dopyt uveďte názov firmy."}
            )
        material = attrs.get("material")
        technology = attrs.get("technology")
        if material is not None:
            if technology is None:
                attrs["technology"] = material.technology
            elif material.technology_id != technology.id:
                raise serializers.ValidationError(
                    {"material": "Zvolený materiál nepatrí k vybranej technológii."}
                )
        return attrs


class CadModelingRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CadModelingRequest
        fields = [
            "id",
            "service_type",
            "description",
            "client_name",
            "email",
            "phone",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_description(self, value: str) -> str:
        value = value.strip()
        if len(value) < 20:
            raise serializers.ValidationError(
                "Popíšte prosím zadanie podrobnejšie (aspoň 20 znakov)."
            )
        return value

    def validate_client_name(self, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("Zadajte prosím celé meno a priezvisko.")
        return value
