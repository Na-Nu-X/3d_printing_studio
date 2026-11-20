from django.db.models import Count, Q
from rest_framework import mixins, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.throttling import ScopedRateThrottle

from .filters import PortfolioProjectFilter, PrintMaterialFilter
from .models import (
    CadModelingRequest,
    PortfolioProject,
    PrintMaterial,
    PrintQuoteRequest,
    PrintTechnology,
)
from .serializers import (
    CadModelingRequestSerializer,
    PortfolioProjectSerializer,
    PrintMaterialDetailSerializer,
    PrintMaterialListSerializer,
    PrintQuoteRequestSerializer,
    PrintTechnologySerializer,
)


class PrintTechnologyViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PrintTechnologySerializer
    lookup_field = "slug"
    filter_backends = []
    pagination_class = None

    def get_queryset(self):
        return PrintTechnology.objects.annotate(material_count=Count("materials"))


class PrintMaterialViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PrintMaterial.objects.select_related("technology")
    lookup_field = "slug"
    filterset_class = PrintMaterialFilter
    ordering_fields = [
        "price_per_gram_eur",
        "tensile_strength_mpa",
        "max_temp_celsius",
        "name",
        "display_order",
    ]
    ordering = ["technology__display_order", "display_order", "name"]
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        term = self.request.query_params.get("search", "").strip()
        if self.action != "list" or not term:
            return queryset
        # Property tags live in a JSONField (stored ASCII-escaped), so match them
        # in Python to keep Slovak diacritics working across SQLite and PostgreSQL.
        needle = term.casefold()
        tag_ids = [
            pk
            for pk, tags in PrintMaterial.objects.values_list("id", "properties_tags")
            if any(needle in str(tag).casefold() for tag in tags or [])
        ]
        return queryset.filter(
            Q(name__icontains=term)
            | Q(short_description__icontains=term)
            | Q(technology__name__icontains=term)
            | Q(id__in=tag_ids)
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PrintMaterialDetailSerializer
        return PrintMaterialListSerializer


class PortfolioProjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PortfolioProject.objects.select_related("technology", "material")
    serializer_class = PortfolioProjectSerializer
    lookup_field = "slug"
    filterset_class = PortfolioProjectFilter
    search_fields = ["title", "client_sector", "challenge_summary"]
    ordering_fields = ["display_order", "quantity_produced"]
    ordering = ["display_order", "-id"]
    pagination_class = None


class SubmissionThrottleMixin:
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "submissions"


class PrintQuoteRequestViewSet(
    SubmissionThrottleMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    queryset = PrintQuoteRequest.objects.all()
    serializer_class = PrintQuoteRequestSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class CadModelingRequestViewSet(
    SubmissionThrottleMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    queryset = CadModelingRequest.objects.all()
    serializer_class = CadModelingRequestSerializer
