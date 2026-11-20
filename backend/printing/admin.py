from django.contrib import admin
from django.utils.html import format_html

from .models import (
    CadModelingRequest,
    PortfolioProject,
    PrintMaterial,
    PrintQuoteRequest,
    PrintTechnology,
)


class PrintMaterialInline(admin.TabularInline):
    model = PrintMaterial
    fields = ["name", "price_per_gram_eur", "setup_fee_eur", "is_featured", "display_order"]
    extra = 0
    show_change_link = True


@admin.register(PrintTechnology)
class PrintTechnologyAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "tolerance_label",
        "max_build_volume",
        "typical_lead_time",
        "display_order",
    ]
    list_editable = ["display_order"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ["name"]}
    inlines = [PrintMaterialInline]


@admin.register(PrintMaterial)
class PrintMaterialAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "technology",
        "price_per_gram_eur",
        "setup_fee_eur",
        "tensile_strength_mpa",
        "max_temp_celsius",
        "is_featured",
    ]
    list_editable = ["price_per_gram_eur", "setup_fee_eur", "is_featured"]
    list_filter = ["technology", "is_featured"]
    search_fields = ["name", "short_description"]
    prepopulated_fields = {"slug": ["name"]}
    fieldsets = [
        (None, {"fields": ["technology", "name", "slug", "is_featured", "display_order"]}),
        ("Popis", {"fields": ["short_description", "detailed_description"]}),
        ("Cenník", {"fields": ["price_per_gram_eur", "setup_fee_eur"]}),
        (
            "Technické parametre",
            {"fields": ["tensile_strength_mpa", "max_temp_celsius", "density_g_cm3"]},
        ),
        (
            "Vlastnosti, aplikácie a farby",
            {
                "fields": ["properties_tags", "applications", "available_colors"],
                "description": "Zadávajte ako JSON zoznam, napr. "
                '["Matná čierna", "Technická sivá"].',
            },
        ),
    ]


@admin.register(PortfolioProject)
class PortfolioProjectAdmin(admin.ModelAdmin):
    list_display = [
        "thumbnail",
        "title",
        "technology",
        "material",
        "client_sector",
        "quantity_produced",
        "is_featured",
        "display_order",
    ]
    list_display_links = ["thumbnail", "title"]
    list_editable = ["is_featured", "display_order"]
    list_filter = ["technology", "client_sector", "is_featured"]
    search_fields = ["title", "challenge_summary"]
    prepopulated_fields = {"slug": ["title"]}
    autocomplete_fields = ["material"]

    @admin.display(description="Náhľad")
    def thumbnail(self, obj: PortfolioProject):
        if not obj.image_url:
            return "—"
        return format_html(
            '<img src="{}" alt="" style="width:72px;height:48px;object-fit:cover;'
            'border-radius:4px;border:1px solid #E2E8F0">',
            obj.image_url,
        )


@admin.register(PrintQuoteRequest)
class PrintQuoteRequestAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "created_at",
        "client_name",
        "company_name",
        "material",
        "quantity",
        "file_download",
        "status",
    ]
    list_display_links = ["id", "client_name"]
    list_editable = ["status"]
    list_filter = ["status", "client_type", "technology", "infill_level", "created_at"]
    search_fields = ["client_name", "company_name", "email", "phone", "notes"]
    date_hierarchy = "created_at"
    readonly_fields = ["created_at", "file_download"]
    actions = ["mark_quoted", "mark_in_production", "mark_done"]
    fieldsets = [
        ("Stav", {"fields": ["status", "created_at"]}),
        (
            "Klient",
            {"fields": ["client_type", "company_name", "client_name", "email", "phone"]},
        ),
        (
            "3D model",
            {"fields": ["model_file", "file_download", "external_file_link"]},
        ),
        (
            "Parametre výroby",
            {
                "fields": [
                    "technology",
                    "material",
                    "quantity",
                    "desired_color",
                    "infill_level",
                    "post_processing",
                    "notes",
                ]
            },
        ),
    ]

    @admin.display(description="Súbor")
    def file_download(self, obj: PrintQuoteRequest):
        if obj.model_file:
            return format_html(
                '<a href="{}" download>⬇ Stiahnuť {}</a>',
                obj.model_file.url,
                obj.model_file.name.rsplit("/", 1)[-1],
            )
        if obj.external_file_link:
            return format_html(
                '<a href="{}" target="_blank" rel="noopener">↗ Otvoriť odkaz</a>',
                obj.external_file_link,
            )
        return "—"

    def _set_status(self, request, queryset, status, label):
        updated = queryset.update(status=status)
        self.message_user(request, f"{updated} dopytov označených ako „{label}“.")

    @admin.action(description="Označiť ako nacenené")
    def mark_quoted(self, request, queryset):
        self._set_status(request, queryset, PrintQuoteRequest.Status.QUOTED, "Nacenený")

    @admin.action(description="Presunúť do výroby")
    def mark_in_production(self, request, queryset):
        self._set_status(request, queryset, PrintQuoteRequest.Status.IN_PRODUCTION, "Vo výrobe")

    @admin.action(description="Označiť ako dokončené")
    def mark_done(self, request, queryset):
        self._set_status(request, queryset, PrintQuoteRequest.Status.DONE, "Dokončený")


@admin.register(CadModelingRequest)
class CadModelingRequestAdmin(admin.ModelAdmin):
    list_display = ["id", "created_at", "client_name", "service_type", "email", "is_resolved"]
    list_display_links = ["id", "client_name"]
    list_editable = ["is_resolved"]
    list_filter = ["service_type", "is_resolved", "created_at"]
    search_fields = ["client_name", "email", "description"]
    readonly_fields = ["created_at"]
    date_hierarchy = "created_at"
