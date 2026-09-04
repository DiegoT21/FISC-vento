"""Escenarios de carga con Locust (cap. V del anteproyecto: pruebas de
carga/concurrencia). Ejecutar con:

    locust -f backend/loadtests/locustfile.py --host http://localhost:8000

Simula usuarios consultando el listado de activos y escaneando códigos
(QR/barras/RFID) desde varias áreas simultáneamente, tal como describe la
sección 5.1.1 del anteproyecto.
"""
from locust import HttpUser, between, task


class UsuarioFISC(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def listar_activos(self):
        self.client.get("/api/activos/")

    @task(1)
    def escanear_activo(self):
        self.client.post("/api/escaneo/escanear/", json={"valor": "SVT-118423"})

    @task(1)
    def ver_reporte_por_estado(self):
        self.client.get("/api/reportes/por-estado/")
