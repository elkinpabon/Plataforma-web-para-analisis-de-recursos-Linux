# Generated by Django 5.1.6 on 2025-02-16 04:25

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='SystemUsage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timestamp', models.DateTimeField(default=django.utils.timezone.now)),
                ('cpu_usage', models.FloatField()),
                ('cpu_speed', models.FloatField()),
                ('cpu_cores', models.IntegerField()),
                ('cpu_logical', models.IntegerField()),
                ('cpu_sockets', models.IntegerField()),
                ('ram_used', models.FloatField()),
                ('ram_total', models.FloatField()),
                ('net_upload', models.FloatField()),
                ('net_download', models.FloatField()),
                ('disk_used', models.FloatField()),
                ('disk_total', models.FloatField()),
            ],
        ),
    ]
