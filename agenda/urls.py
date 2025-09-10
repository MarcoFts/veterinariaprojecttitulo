# ejemplo para mascotas/urls.py (igual para las otras apps)
from django.urls import path
from . import views

urlpatterns = [
    path("", views.inicio, name="agenda_inicio"),
]
