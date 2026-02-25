# Proyecto de Título — Sistema de Gestión Veterinaria

Este proyecto es un **sistema integral para clínicas veterinarias**, desarrollado como Proyecto de Título en conjunto.  
Incluye **backend en Django + Django REST Framework** y **frontend en React (Vite) con Tailwind CSS**.

---

## Tecnologías principales

- **Backend**: Python, Django, Django REST Framework
- **Frontend**: React + Vite + Tailwind CSS
- **Base de datos**: SQLite (desarrollo) → fácilmente reemplazable por PostgreSQL en producción
- **Control de versiones**: Git + GitHub

---

## Estructura del proyecto

VeterinariaProyecto/
│── backend/ # API REST en Django
│ ├── config/ # configuración de Django
│ ├── clinica/ # app principal (modelos: clientes, mascotas, veterinarios, etc.)
│ └── manage.py
│
│── frontend/ # Interfaz en React + Vite
│ ├── src/ # componentes y vistas
│ ├── public/
│ └── index.html
│
├── .gitignore
└── README.md

