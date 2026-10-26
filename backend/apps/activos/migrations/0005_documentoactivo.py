# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('activos', '0004_ref_serie_marca_modelo'),
    ]

    operations = [
        migrations.CreateModel(
            name='DocumentoActivo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=255)),
                ('archivo', models.FileField(upload_to='activos/documentos/')),
                ('subido_en', models.DateTimeField(auto_now_add=True)),
                ('activo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documentos', to='activos.activo')),
            ],
            options={
                'verbose_name': 'Documento de activo',
                'verbose_name_plural': 'Documentos de activo',
                'ordering': ['-subido_en'],
            },
        ),
    ]
