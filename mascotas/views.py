# ejemplo para mascotas/views.py
from django.http import HttpResponse
def inicio(request):
    return HttpResponse("<h1>Mascotas OK</h1>")
