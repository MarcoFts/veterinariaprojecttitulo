# Proyecto de Título — Sistema de Gestión Veterinaria

Este proyecto es un **sistema integral para clínicas veterinarias**, desarrollado como Proyecto de Título. Está diseñado para gestionar la operación completa de una clínica, desde la agenda de citas hasta el control de inventario médico.

---

## ⚡ Tecnologías Principales

- **Backend**: Python 3.11, Django 5.0, Django REST Framework (API REST)
- **Frontend**: React + Vite + Tailwind CSS
- **Base de Datos**: PostgreSQL (NeonDB en producción)
- **Autenticación**: JWT (JSON Web Tokens)
- **Infraestructura**: Desplegado en Vercel (Frontend) y Render (Backend)

---

## 🚀 Acceso Demo

Puedes probar el sistema utilizando las siguientes credenciales para explorar los distintos niveles de acceso:

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin@gmail.com` | `admin123!` |
| **Veterinario** | `vet@gmail.com` | `vet1234!` |
| **Cliente** | `cliente@gmail.com` | `cliente123!` |

---

## 🛠️ Módulos y Funcionalidades

### 1. Gestión de Citas y Agenda
- **Calendario Interactivo**: Visualización de disponibilidad horaria por veterinario.
- **Concurrencia Blindada**: Uso de bloqueos de base de datos (`select_for_update`) para evitar dobles reservas simultáneas.
- **Validación Estricta**: Control de fechas pasadas y solapamiento de horarios.

### 2. Inventario y Control de Stock
- **Integridad de Datos**: Transacciones atómicas para movimientos de stock (entradas/salidas).
- **Alertas**: Notificaciones de stock mínimo y fechas de vencimiento próximas.

### 3. Ficha Clínica y Pacientes
- **Relación Cliente-Mascota**: Gestión completa de tutores y sus mascotas.
- **Historial Médico**: Registro de atenciones, tratamientos y vacunas.

---

## 🛡️ Seguridad y Calidad de Código

- **Protección IDOR**: Validación de propiedad de recursos en cada endpoint sensible (Citas, Mascotas).
- **Arquitectura Limpia**: Separación clara entre lógica de negocio (Backend) e interfaz de usuario (Frontend).
- **Hardening de API**: Implementación de restricciones de seguridad y normalización de rutas para producción.

---

## 📦 Estructura del Proyecto

```text
VeterinariaProyecto/
│── backend/       # API REST en Django (Hardened & Cleaned)
│   ├── config/    # Configuración de Producción & Seguridad
│   └── clinica/   # Lógica de Negocio (Modelos, Views, Serializers)
│
│── frontend/      # Interfaz SPA en React + Vite
```
