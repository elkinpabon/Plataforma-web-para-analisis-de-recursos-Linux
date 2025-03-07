from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import psutil
from django.http import JsonResponse
from monitoring.models import Report, CustomUser
from django.utils.timezone import now

prev_net_stats = psutil.net_io_counters()

@csrf_exempt  
def system_usage(request):
    """Obtiene datos en tiempo real y guarda en la base de datos solo cuando se presiona el botón guardar."""
    global prev_net_stats

    try:
        # Capturar datos del sistema
        cpu_usage = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        current_net_stats = psutil.net_io_counters()
        
        net_upload_kbps = max(0, round((current_net_stats.bytes_sent - prev_net_stats.bytes_sent) / 1024, 2))
        net_download_kbps = max(0, round((current_net_stats.bytes_recv - prev_net_stats.bytes_recv) / 1024, 2))
        prev_net_stats = current_net_stats

        cpu_freq = psutil.cpu_freq()
        cpu_speed = round(cpu_freq.current / 1000, 2) if cpu_freq and cpu_freq.current else 0  
        cpu_cores = psutil.cpu_count(logical=False)  
        cpu_logical = psutil.cpu_count(logical=True)  
        cpu_sockets = 1  
        timestamp = now()

        # Permitir acceso sin autenticación SOLO para ver datos en tiempo real
        if request.method == "GET":
            data = {
                "timestamp": timestamp,
                "cpu_usage": round(cpu_usage, 2),
                "cpu_speed": cpu_speed,
                "ram_used": round(ram.used / (1024 ** 3), 2),
                "ram_total": round(ram.total / (1024 ** 3), 2),
                "net_upload": net_upload_kbps,
                "net_download": net_download_kbps,
                "disk_used": round(disk.used / (1024 ** 3), 2),
                "disk_total": round(disk.total / (1024 ** 3), 2),
                "cpu_cores": cpu_cores,
                "cpu_logical": cpu_logical,
                "cpu_sockets": cpu_sockets,
            }
            return JsonResponse(data)

        # Si la solicitud es POST, verificar que el usuario esté autenticado antes de guardar datos
        if request.method == "POST":
            user_id = request.session.get("user_id")
            if not user_id:
                return JsonResponse({"status": "error", "message": "Necesita iniciar sesión o registrarse."}, status=403)

            try:
                user = CustomUser.objects.get(id_user=user_id)
            except CustomUser.DoesNotExist:
                return JsonResponse({"status": "error", "message": "❌ Usuario no encontrado."}, status=404)

            try:
                Report.objects.create(
                    id_user=user,
                    timestamp_report=timestamp,
                    cpu_usage=cpu_usage,
                    cpu_speed=cpu_speed,
                    cpu_cores=cpu_cores,
                    cpu_logical=cpu_logical,
                    cpu_sockets=cpu_sockets, 
                    ram_used=ram.used / (1024 ** 3),
                    ram_total=ram.total / (1024 ** 3),
                    net_upload=net_upload_kbps,
                    net_download=net_download_kbps,
                    disk_used=disk.used / (1024 ** 3),
                    disk_total=disk.total / (1024 ** 3),
                )
                return JsonResponse({"status": "success", "message": "✅ Datos guardados correctamente en la base de datos."})
            except Exception as e:
                return JsonResponse({"status": "error", "message": f"❌ Error al guardar en la base de datos: {str(e)}"}, status=500)

    except Exception as e:
        return JsonResponse({"status": "error", "message": f"❌ Error en el servidor: {str(e)}"}, status=500)

@csrf_exempt
def delete_report(request, report_id):
    """ Elimina un reporte según su ID. """
    if request.method == "DELETE":
        try:
            report = Report.objects.get(id_report=report_id)
            report.delete()
            return JsonResponse({"success": True, "message": "Reporte eliminado."})
        except Report.DoesNotExist:
            return JsonResponse({"success": False, "message": "Reporte no encontrado."}, status=404)

    return JsonResponse({"success": False, "message": "Método no permitido."}, status=405)
