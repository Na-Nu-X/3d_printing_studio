import django_filters

from .models import PortfolioProject, PrintMaterial


class PrintMaterialFilter(django_filters.FilterSet):
    technology = django_filters.CharFilter(field_name="technology__slug")
    featured = django_filters.BooleanFilter(field_name="is_featured")
    max_price = django_filters.NumberFilter(field_name="price_per_gram_eur", lookup_expr="lte")
    min_temp = django_filters.NumberFilter(field_name="max_temp_celsius", lookup_expr="gte")

    class Meta:
        model = PrintMaterial
        fields = ["technology", "featured", "max_price", "min_temp"]


class PortfolioProjectFilter(django_filters.FilterSet):
    technology = django_filters.CharFilter(field_name="technology__slug")
    featured = django_filters.BooleanFilter(field_name="is_featured")
    sector = django_filters.CharFilter(field_name="client_sector", lookup_expr="iexact")

    class Meta:
        model = PortfolioProject
        fields = ["technology", "featured", "sector"]
