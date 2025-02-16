from django.db import models

class SystemUsage(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)  # Guarda la fecha y hora exacta del registro
    cpu_usage = models.FloatField()
    cpu_speed = models.FloatField()
    cpu_model = models.CharField(max_length=255)
    cpu_cores = models.IntegerField()
    cpu_logical = models.IntegerField()
    ram_total = models.FloatField()
    ram_used = models.FloatField()
    net_upload = models.FloatField()
    net_download = models.FloatField()
    disk_total = models.FloatField()
    disk_used = models.FloatField()

    def __str__(self):
        return f"Registro del {self.timestamp}"
