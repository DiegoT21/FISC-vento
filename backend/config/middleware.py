from contextvars import ContextVar

from asgiref.sync import iscoroutinefunction, markcoroutinefunction

# DRF actualiza request.user tras autenticar; conservar el request permite leer ese actor.
request_actual = ContextVar("request_auditoria", default=None)


def obtener_usuario_actual():
    request = request_actual.get()
    usuario = getattr(request, "user", None)
    return usuario if usuario is not None and usuario.is_authenticated else None


class AuditoriaMiddleware:
    sync_capable = True
    async_capable = True

    def __init__(self, get_response):
        self.get_response = get_response
        self.es_async = iscoroutinefunction(get_response)
        if self.es_async:
            markcoroutinefunction(self)

    def __call__(self, request):
        if self.es_async:
            return self.responder_async(request)
        token = request_actual.set(request)
        try:
            return self.get_response(request)
        finally:
            request_actual.reset(token)

    async def responder_async(self, request):
        token = request_actual.set(request)
        try:
            return await self.get_response(request)
        finally:
            request_actual.reset(token)
