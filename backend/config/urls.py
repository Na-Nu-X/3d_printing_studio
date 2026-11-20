from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Správa 3D tlačového štúdia"
admin.site.site_title = "3D štúdio – administrácia"
admin.site.index_title = "Technológie, materiály a dopyty"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("printing.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
