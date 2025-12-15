from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('clinica.urls')),  # importa todas las rutas de clinica
    path("api/", include("clinica.urls")),
]
