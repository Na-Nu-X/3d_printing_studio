from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify


def unique_slugify(instance: models.Model, value: str, max_length: int = 80) -> str:
    """Build a URL slug from `value` that is unique for the instance's model."""
    base = slugify(value)[:max_length].strip("-") or "polozka"
    slug = base
    model = instance.__class__
    index = 2
    while model.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
        suffix = f"-{index}"
        slug = f"{base[: max_length - len(suffix)]}{suffix}"
        index += 1
    return slug


class SluggedModel(models.Model):
    """Abstract base that auto-generates a unique slug from `slug_source`."""

    slug_source = "name"

    slug = models.SlugField(
        "URL identifikátor",
        max_length=90,
        unique=True,
        blank=True,
        help_text="Vygeneruje sa automaticky z názvu, ak ho nevyplníte.",
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, getattr(self, self.slug_source))
        super().save(*args, **kwargs)


class PrintTechnology(SluggedModel):
    name = models.CharField("Názov technológie", max_length=120)
    short_summary = models.TextField("Krátky popis")
    tolerance_label = models.CharField(
        "Rozmerová tolerancia", max_length=40, help_text="Napr. ± 0.20 mm"
    )
    max_build_volume = models.CharField(
        "Max. tlačový objem", max_length=60, help_text="Napr. 350 × 350 × 350 mm"
    )
    min_layer_height = models.CharField(
        "Min. výška vrstvy", max_length=30, blank=True, help_text="Napr. 0.05 mm"
    )
    typical_lead_time = models.CharField(
        "Typická doba dodania", max_length=60, help_text="Napr. 2 – 4 pracovné dni"
    )
    icon_name = models.CharField(
        "Ikona", max_length=40, help_text="Identifikátor ikony vo frontende (fdm, sla, sls)."
    )
    display_order = models.PositiveIntegerField("Poradie zobrazenia", default=0)

    class Meta:
        verbose_name = "Technológia 3D tlače"
        verbose_name_plural = "Technológie 3D tlače"
        ordering = ["display_order", "name"]

    def __str__(self) -> str:
        return self.name


class PrintMaterial(SluggedModel):
    technology = models.ForeignKey(
        PrintTechnology,
        verbose_name="Technológia",
        on_delete=models.PROTECT,
        related_name="materials",
    )
    name = models.CharField("Názov materiálu", max_length=120)
    short_description = models.CharField("Krátky popis", max_length=255)
    detailed_description = models.TextField("Detailný popis")
    properties_tags = models.JSONField(
        "Vlastnosti (štítky)",
        default=list,
        blank=True,
        help_text='Zoznam reťazcov, napr. ["UV stabilita", "Teplotná odolnosť do 95 °C"]',
    )
    applications = models.JSONField(
        "Typické aplikácie",
        default=list,
        blank=True,
        help_text='Zoznam reťazcov, napr. ["Kryty elektroniky", "Prípravky do výroby"]',
    )
    available_colors = models.JSONField(
        "Dostupné farby",
        default=list,
        blank=True,
        help_text='Zoznam reťazcov, napr. ["Matná čierna", "Technická sivá"]',
    )
    price_per_gram_eur = models.DecimalField(
        "Cena za gram (EUR)",
        max_digits=6,
        decimal_places=3,
        validators=[MinValueValidator(0)],
    )
    setup_fee_eur = models.DecimalField(
        "Prípravný poplatok (EUR)",
        max_digits=7,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )
    tensile_strength_mpa = models.PositiveIntegerField(
        "Pevnosť v ťahu (MPa)", null=True, blank=True
    )
    max_temp_celsius = models.PositiveIntegerField(
        "Max. prevádzková teplota (°C)", null=True, blank=True
    )
    density_g_cm3 = models.DecimalField(
        "Hustota (g/cm³)", max_digits=4, decimal_places=2, null=True, blank=True
    )
    is_featured = models.BooleanField("Odporúčaný materiál", default=False)
    display_order = models.PositiveIntegerField("Poradie zobrazenia", default=0)

    class Meta:
        verbose_name = "Materiál"
        verbose_name_plural = "Materiály"
        ordering = ["display_order", "name"]

    def __str__(self) -> str:
        return self.name


class PortfolioProject(SluggedModel):
    slug_source = "title"

    title = models.CharField("Názov realizácie", max_length=160)
    technology = models.ForeignKey(
        PrintTechnology,
        verbose_name="Technológia",
        on_delete=models.PROTECT,
        related_name="projects",
    )
    material = models.ForeignKey(
        PrintMaterial,
        verbose_name="Materiál",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projects",
    )
    client_sector = models.CharField("Odvetvie klienta", max_length=80)
    challenge_summary = models.TextField("Zadanie a riešenie")
    production_specs = models.CharField("Výrobné parametre", max_length=255)
    quantity_produced = models.PositiveIntegerField("Vyrobené množstvo (ks)", default=1)
    image_url = models.URLField("URL obrázka", max_length=500)
    is_featured = models.BooleanField("Zobraziť na úvodnej stránke", default=False)
    display_order = models.PositiveIntegerField("Poradie zobrazenia", default=0)

    class Meta:
        verbose_name = "Realizácia"
        verbose_name_plural = "Realizácie (portfólio)"
        ordering = ["display_order", "-id"]

    def __str__(self) -> str:
        return self.title


class PrintQuoteRequest(models.Model):
    class Infill(models.TextChoices):
        STANDARD = "standard", "Štandardná pevnosť (20 % výplň)"
        REINFORCED = "reinforced", "Zvýšená pevnosť (50 % výplň)"
        SOLID = "solid", "Plný výtlačok (100 %)"

    class PostProcessing(models.TextChoices):
        NONE = "none", "Bez dodatočných úprav"
        SANDING_PAINTING = "sanding_painting", "Brúsenie a lakovanie povrchu"
        THREADED_INSERTS = "threaded_inserts", "Zalisovanie mosadzných závitových vložiek"

    class ClientType(models.TextChoices):
        COMPANY = "firma", "Firma (B2B)"
        PRIVATE = "sukromna_osoba", "Súkromná osoba"

    class Status(models.TextChoices):
        NEW = "novy", "Nový dopyt"
        QUOTED = "naceneny", "Nacenený"
        IN_PRODUCTION = "vo_vyrobe", "Vo výrobe"
        DONE = "dokonceny", "Dokončený"

    technology = models.ForeignKey(
        PrintTechnology,
        verbose_name="Technológia",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quote_requests",
    )
    material = models.ForeignKey(
        PrintMaterial,
        verbose_name="Materiál",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quote_requests",
    )
    model_file = models.FileField(
        "3D model (súbor)", upload_to="quotes/models/", blank=True, null=True
    )
    external_file_link = models.URLField(
        "Odkaz na súbor (cloud)", max_length=500, blank=True
    )
    quantity = models.PositiveIntegerField(
        "Počet kusov",
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(100000)],
    )
    desired_color = models.CharField("Požadovaná farba", max_length=80, blank=True)
    infill_level = models.CharField(
        "Výplň / pevnosť",
        max_length=20,
        choices=Infill.choices,
        default=Infill.STANDARD,
    )
    post_processing = models.CharField(
        "Dodatočné úpravy",
        max_length=30,
        choices=PostProcessing.choices,
        default=PostProcessing.NONE,
    )
    client_type = models.CharField(
        "Typ klienta",
        max_length=20,
        choices=ClientType.choices,
        default=ClientType.COMPANY,
    )
    company_name = models.CharField("Názov firmy", max_length=160, blank=True)
    client_name = models.CharField("Meno a priezvisko", max_length=120)
    email = models.EmailField("E-mail")
    phone = models.CharField("Telefón", max_length=40, blank=True)
    notes = models.TextField("Poznámka", blank=True)
    status = models.CharField(
        "Stav", max_length=20, choices=Status.choices, default=Status.NEW
    )
    created_at = models.DateTimeField("Prijaté", auto_now_add=True)

    class Meta:
        verbose_name = "Dopyt na 3D tlač"
        verbose_name_plural = "Dopyty na 3D tlač"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Dopyt #{self.pk} – {self.client_name}"


class CadModelingRequest(models.Model):
    class ServiceType(models.TextChoices):
        CAD_DESIGN = "cad_navrh", "Návrh 3D modelu podľa výkresu alebo náčrtu"
        REVERSE_ENGINEERING = (
            "reverzne_inzinierstvo",
            "Výroba náhradného dielu podľa poškodeného kusu",
        )
        SCANNING = "3d_skenovanie", "Optické 3D skenovanie a digitalizácia"

    service_type = models.CharField(
        "Typ služby", max_length=30, choices=ServiceType.choices
    )
    description = models.TextField("Popis zadania")
    client_name = models.CharField("Meno a priezvisko", max_length=120)
    email = models.EmailField("E-mail")
    phone = models.CharField("Telefón", max_length=40, blank=True)
    is_resolved = models.BooleanField("Vybavené", default=False)
    created_at = models.DateTimeField("Prijaté", auto_now_add=True)

    class Meta:
        verbose_name = "Dopyt na 3D modelovanie"
        verbose_name_plural = "Dopyty na 3D modelovanie"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.get_service_type_display()} – {self.client_name}"
