from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("votos", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="voto",
            name="device_info",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="voto",
            name="user_agent",
            field=models.TextField(blank=True, default=""),
        ),
    ]