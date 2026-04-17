from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def api_root(_request):
    return JsonResponse(
        {
            "status": "ok",
            "service": "votacao-online",
            "endpoints": {
                "auth": "/api/auth/",
                "condominios": "/api/condominios/",
                "eleitores": "/api/eleitores/",
                "assembleias": "/api/assembleias/",
                "votos": "/api/votos/",
            },
        }
    )

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api_root),
    path("api/auth/", include("core.urls_auth")),
    path("api/webauthn/", include("core.urls_webauthn")),
    path("api/biometria/", include("core.urls_biometria")),
    path("api/otp/", include("core.urls_otp")),
    path("api/condominios/", include("apps.condominios.urls")),
    path("api/eleitores/", include("apps.eleitores.urls")),
    path("api/assembleias/", include("apps.assembleias.urls")),
    path("api/votos/", include("apps.votos.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
