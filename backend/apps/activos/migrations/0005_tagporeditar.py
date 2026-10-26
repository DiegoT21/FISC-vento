from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("activos", "0004_ref_serie_marca_modelo"),
    ]

    operations = [
        migrations.CreateModel(
            name="TagPorEditar",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("epc", models.CharField(max_length=100, unique=True)),
                ("leido_en", models.DateTimeField(auto_now_add=True)),
                (
                    "leido_por",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="tags_por_editar",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Tag por editar",
                "verbose_name_plural": "Tags por editar",
                "ordering": ["-leido_en"],
            },
        ),
    ]
