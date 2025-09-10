# ejemplo para mascotas/views.py
from django.http import HttpResponse
def inicio(request):
    return HttpResponse("<h1>Fichas OK</h1>")
