# 🐾 Proyecto de Título — Sistema de Gestión Veterinaria

Este proyecto es un **sistema integral para clínicas veterinarias**, desarrollado como Proyecto de Título en conjunto.  
Incluye **backend en Django + Django REST Framework** y **frontend en React (Vite) con Tailwind CSS**.

---

## 🚀 Tecnologías principales

- **Backend**: Python, Django, Django REST Framework
- **Frontend**: React + Vite + Tailwind CSS
- **Base de datos**: SQLite (desarrollo) → fácilmente reemplazable por PostgreSQL en producción
- **Control de versiones**: Git + GitHub

---

## 📂 Estructura del proyecto

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

yaml
Copiar código

---

## 🛠️ Instalación y ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/MarcoFts/veterinariaprojecttitulo.git
cd veterinariaprojecttitulo
2. Backend (Django + DRF)
Crear entorno virtual e instalar dependencias
bash
Copiar código
cd backend
python -m venv .venv
# Activar entorno virtual
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt
Migraciones y superusuario
bash
Copiar código
python manage.py migrate
python manage.py createsuperuser
Ejecutar servidor
bash
Copiar código
python manage.py runserver
El backend estará disponible en:
👉 http://127.0.0.1:8000/api/

3. Frontend (React + Vite + Tailwind)
Instalar dependencias
bash
Copiar código
cd ../frontend
npm install
Ejecutar en desarrollo
bash
Copiar código
npm run dev
El frontend estará en:
👉 http://127.0.0.1:5173/

👨‍💻 Colaboración en equipo
Cada integrante debe clonar el repo.

Crear ramas para sus tareas:

bash
Copiar código
git checkout -b nombre-rama
Hacer commits y push:

bash
Copiar código
git add .
git commit -m "Funcionalidad X"
git push origin nombre-rama
Abrir un Pull Request en GitHub para fusionar con main.

📌 Funcionalidades planeadas
 CRUD de clientes, mascotas, veterinarios

 Agenda de citas

 Fichas clínicas con historial

 Inventario con alertas

 Reportes e indicadores

 Notificaciones por correo / WhatsApp

📜 Licencia
Uso académico — Proyecto de Título.

yaml
Copiar código

---

## 👉 Próximos pasos
1. Crea este archivo como `README.md` en la raíz.  
2. Haz commit y súbelo:
```powershell
git add README.md
git commit -m "Agregar README con instrucciones de instalación"
git push origin main