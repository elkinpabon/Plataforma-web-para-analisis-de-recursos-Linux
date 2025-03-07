from django.db import models
from django.utils.timezone import now
from django.contrib.auth.models import AbstractUser, Group, Permission

class SystemUsage(models.Model):
    timestamp = models.DateTimeField(default=now)
    cpu_usage = models.FloatField()
    cpu_speed = models.FloatField()
    cpu_cores = models.IntegerField()
    cpu_logical = models.IntegerField()
    cpu_sockets = models.IntegerField()  
    ram_used = models.FloatField()
    ram_total = models.FloatField()
    net_upload = models.FloatField()
    net_download = models.FloatField()
    disk_used = models.FloatField()
    disk_total = models.FloatField()

    def __str__(self):
        return f"System Usage at {self.timestamp}"


class CustomUser(models.Model):
    id_user = models.AutoField(primary_key=True)
    id_role = models.ForeignKey("UserRole", on_delete=models.CASCADE, db_column="id_role") 
    name = models.CharField(max_length=50)
    lastname = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=50)
    last_login = models.DateTimeField(default=now, blank=True, null=True)  
    
    USERNAME_FIELD = "email"  
    REQUIRED_FIELDS = ["username", "name", "lastname"]
    
    class Meta:
        db_table = "USER"  # Nombre exacto de la tabla en MySQL
        managed = False  # Evita que Django intente modificar la tabla
    

    def __str__(self):
        return self.email

class UserRole(models.Model):
    id_role = models.AutoField(primary_key=True)
    type = models.CharField(max_length=50)
    description_rol= models.CharField(max_length=100)

    class Meta:
        db_table = "ROLE"  # Nombre exacto de la tabla en MySQL
        managed = False  # Evita que Django intente modificar la tabla

    def __str__(self):
        return self.description_rol

class Report(models.Model):
    id_report = models.AutoField(primary_key=True)
    id_user = models.ForeignKey("CustomUser", on_delete=models.CASCADE, db_column="id_user")  # Relación con CustomUser
    timestamp_report = models.DateTimeField(default=now)  # Fecha y hora del reporte

    # CPU
    cpu_usage = models.FloatField()  # Uso de CPU en porcentaje
    cpu_speed = models.FloatField()  # Velocidad de la CPU en GHz
    cpu_cores = models.IntegerField()  # Núcleos físicos
    cpu_logical = models.IntegerField()  # Núcleos lógicos
    cpu_sockets = models.IntegerField()  # Sockets físicos

    # RAM
    ram_used = models.FloatField()  # RAM usada en GB
    ram_total = models.FloatField()  # RAM total en GB

    # Red
    net_upload = models.FloatField()  # Velocidad de subida en Mbps
    net_download = models.FloatField()  # Velocidad de descarga en Mbps

    # Disco
    disk_used = models.FloatField()  # Espacio en disco usado en GB
    disk_total = models.FloatField()  # Espacio total del disco en GB

    class Meta:
        db_table = "REPORT"  # Nombre exacto de la tabla en MySQL
        managed = False  # Evita que Django modifique la tabla

    def __str__(self):
        return f"Report {self.id_report} - User {self.id_user}"

class Alerts(models.Model):
    id_alert = models.AutoField(primary_key=True)
    id_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, db_column='ID_USER')
    description_alerts = models.TextField(db_column='DESCRIPTION_ALERTS')
    timestamp_alerts = models.CharField(max_length=50, db_column='TIMESTAMP_ALERTS')
    alert_location = models.CharField(max_length=255, db_column='ALERT_LOCATION')

    class Meta:
        managed = False  # No generar migraciones ya que la tabla existe
        db_table = 'ALERTS'

    def __str__(self):
        return f"Alerta {self.id_alert} - Usuario {self.id_user}"
