import threading
from datetime import datetime, timedelta
from django.utils import timezone
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError
from rest_framework.test import APIClient
from rest_framework import status

from clinica.models import (
    Cliente, Mascota, Veterinario, Producto, MovimientoInventario, Cita
)

User = get_user_model()

class SeguridadYConcurrenciaTests(TransactionTestCase):
    def setUp(self):
        # 1. Crear Vets y Clientes básicos
        self.vet_user = User.objects.create_user(username="vet1@test.com", password="password123")
        self.vet_user.groups.create(name="veterinarios")
        self.veterinario = Veterinario.objects.create(user=self.vet_user, rut_dni="11111111-1", telefono="911111111")

        self.cliente_user_1 = User.objects.create_user(username="cliente1@test.com", password="password123")
        self.cliente_1 = Cliente.objects.create(user=self.cliente_user_1, rut_dni="22222222-2", telefono="922222222")
        self.mascota_1 = Mascota.objects.create(cliente=self.cliente_1, nombre="Firulais", especie="Perro")

        self.cliente_user_2 = User.objects.create_user(username="cliente2@test.com", password="password123")
        self.cliente_2 = Cliente.objects.create(user=self.cliente_user_2, rut_dni="33333333-3", telefono="933333333")
        self.mascota_2 = Mascota.objects.create(cliente=self.cliente_2, nombre="Mishi", especie="Gato")

        # 2. Producto para pruebas de inventario
        self.producto = Producto.objects.create(nombre="Vacuna Antirrabica", stock=100)

        # 3. Cliente de DRF para hacer peticiones como Cliente 1
        self.client = APIClient()
        self.client.force_authenticate(user=self.cliente_user_1)

    def test_idor_citas_cliente_ajeno(self):
        """A.1 Cliente 1 NO puede crear cita suplantando el cliente_id del Cliente 2"""
        inicio = timezone.now() + timedelta(days=1, hours=2)
        fin = inicio + timedelta(minutes=30)
        
        payload = {
            "cliente_id": self.cliente_2.id,
            "mascota_id": self.mascota_1.id,
            "veterinario_id": self.vet_user.id,
            "inicio": inicio.isoformat(),
            "fin": fin.isoformat()
        }
        response = self.client.post("/api/citas/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("No puedes agendar citas a nombre de otro", str(response.data))

    def test_idor_citas_mascota_ajena(self):
        """A.2 Cliente 1 NO puede crear cita usando una mascota que pertenece al Cliente 2"""
        inicio = timezone.now() + timedelta(days=1, hours=4)
        fin = inicio + timedelta(minutes=30)
        
        payload = {
            "cliente_id": self.cliente_1.id,
            "mascota_id": self.mascota_2.id,  # Mascota de otro!
            "veterinario_id": self.vet_user.id,
            "inicio": inicio.isoformat(),
            "fin": fin.isoformat()
        }
        response = self.client.post("/api/citas/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("No puedes agendar con una mascota que no pertenece a este cliente", str(response.data))

    def test_cita_en_el_pasado_falla(self):
        """B.1 No se permiten citas en fechas pasadas (Ej: ayer)"""
        inicio_pasado = timezone.now() - timedelta(days=1)
        fin_pasado = inicio_pasado + timedelta(minutes=30)
        
        payload = {
            "cliente_id": self.cliente_1.id,
            "mascota_id": self.mascota_1.id,
            "veterinario_id": self.vet_user.id,
            "inicio": inicio_pasado.isoformat(),
            "fin": fin_pasado.isoformat()
        }
        response = self.client.post("/api/citas/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pasadas", str(response.data))

    def test_cita_hoy_hora_pasada_falla(self):
        """B.2 No se permiten citas para hoy, si la hora ya pasó (Ej: hace 1 hora)"""
        inicio_hace_1_hora = timezone.now() - timedelta(hours=1)
        fin_hace_1_hora = inicio_hace_1_hora + timedelta(minutes=30)
        
        payload = {
            "cliente_id": self.cliente_1.id,
            "mascota_id": self.mascota_1.id,
            "veterinario_id": self.vet_user.id,
            "inicio": inicio_hace_1_hora.isoformat(),
            "fin": fin_hace_1_hora.isoformat()
        }
        response = self.client.post("/api/citas/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pasadas", str(response.data))

    def test_stock_negativo_falla(self):
        """D.1 Comprobar que el DB Constraint impide que el stock de un producto baje de 0"""
        with self.assertRaises(ValueError) as context:
            MovimientoInventario.objects.create(
                producto=self.producto, tipo="salida", cantidad=101 # stock act 100
            )
        self.assertIn("Stock insuficiente", str(context.exception))
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 100) # El stock debe quedar intacto

    def test_concurrencia_inventario(self):
        """D.2 Comprobar que 5 hilos restando de a 10 concurrentemente restan exactamente 50 usando F() expressions"""
        from django.db import connection

        def restar_stock():
            try:
                MovimientoInventario.objects.create(
                    producto=self.producto, tipo="salida", cantidad=10
                )
            except Exception:
                pass
            finally:
                connection.close()

        threads = []
        for _ in range(5):
            t = threading.Thread(target=restar_stock)
            threads.append(t)
            t.start()
        
        for t in threads:
            t.join()

        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 50)

    def test_idor_citas_edicion(self):
        """A.3 Cliente 1 crea su cita y luego intenta asignarsela al Cliente 2 o a la mascota de otro via PATCH"""
        inicio = timezone.now() + timedelta(days=2)
        fin = inicio + timedelta(minutes=30)
        
        cita = Cita.objects.create(
            cliente=self.cliente_1,
            mascota=self.mascota_1,
            veterinario=self.vet_user,
            inicio=inicio,
            fin=fin
        )
        
        # Intenta transferir titularidad
        response1 = self.client.patch(f"/api/citas/{cita.id}/", {"cliente_id": self.cliente_2.id}, format="json")
        self.assertEqual(response1.status_code, status.HTTP_403_FORBIDDEN)
        
        # Intenta transferir mascota a una que no es suya
        response2 = self.client.patch(f"/api/citas/{cita.id}/", {"mascota_id": self.mascota_2.id}, format="json")
        self.assertEqual(response2.status_code, status.HTTP_403_FORBIDDEN)

    def test_edicion_cita_pasada_exitosa(self):
        """B.3 La edición de una cita ya completada NO debe lanzar error de 'fecha pasada' si el usuario solo cambia el estado."""
        inicio_pasado = timezone.now() - timedelta(days=1)
        fin_pasado = inicio_pasado + timedelta(minutes=30)
        
        cita = Cita.objects.create(
            cliente=self.cliente_1,
            mascota=self.mascota_1,
            veterinario=self.vet_user,
            inicio=inicio_pasado,
            fin=fin_pasado,
            estado="pendiente"
        )
        
        self.client.force_authenticate(user=self.vet_user)
        response = self.client.patch(f"/api/citas/{cita.id}/", {"motivo": "Cambiando Notas Mágicas"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["motivo"], "Cambiando Notas Mágicas")
        self.client.force_authenticate(user=self.cliente_user_1)

    def test_concurrencia_reservas(self):
        """D.3 Comprobar que 5 hilos agendando a la misma hora al mismo vet guardan 1 sola cita."""
        from django.db import connection

        inicio = timezone.now() + timedelta(days=3)
        fin = inicio + timedelta(minutes=30)
        
        payload = {
            "cliente_id": self.cliente_1.id,
            "mascota_id": self.mascota_1.id,
            "veterinario_id": self.vet_user.id,
            "inicio": inicio.isoformat(),
            "fin": fin.isoformat()
        }

        def hacer_reserva():
            try:
                thread_client = APIClient()
                thread_client.force_authenticate(user=self.cliente_user_1)
                thread_client.post("/api/citas/", payload, format="json")
            except Exception:
                pass
            finally:
                connection.close()
                
        threads = []
        for _ in range(5):
            t = threading.Thread(target=hacer_reserva)
            threads.append(t)
            t.start()
            
        for t in threads:
            t.join()
            
        # Solo debe existir UNA Cita guardada en la base de datos para ese bloque.
        citas = Cita.objects.filter(veterinario=self.vet_user, inicio=inicio)
        self.assertEqual(citas.count(), 1)
