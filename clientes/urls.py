from django.urls import path
from . import views

urlpatterns = [
    # temporal para probar
    path("", views.inicio, name="clientes_inicio"),
]
