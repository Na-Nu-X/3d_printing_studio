from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("technologies", views.PrintTechnologyViewSet, basename="technology")
router.register("materials", views.PrintMaterialViewSet, basename="material")
router.register("portfolio", views.PortfolioProjectViewSet, basename="portfolio")
router.register("quotes", views.PrintQuoteRequestViewSet, basename="quote")
router.register(
    "modeling-requests", views.CadModelingRequestViewSet, basename="modeling-request"
)

urlpatterns = router.urls
