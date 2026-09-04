from django.apps import AppConfig


class AuditoriaConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.auditoria"
    verbose_name = "Auditoría"

    def ready(self):
        # Conecta los signal receivers que registran cambios en los demás
        # modelos (activos, ubicaciones, usuarios, ...). Ver signals.py.
        from . import signals  # noqa: F401
