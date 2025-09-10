from django.http import HttpResponse

def inicio(request):
    return HttpResponse("<h1>Clientes OK</h1>")
