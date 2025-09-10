from django.shortcuts import render


from django.http import HttpResponse
def inicio(request):
    return HttpResponse("<h1>Veterinarios OK</h1>")
