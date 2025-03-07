from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import psutil
import platform
import subprocess
import glob
import os
import socket
import time
from django.http import JsonResponse
from monitoring.models import SystemUsage

cpu_history = []
ram_history = []
net_upload_history = []
net_download_history = []
disk_history = []

def index(request):
    """Renderiza la página principal."""
    return render(request, 'monitoring/index.html')

# --------------------------------------------------------------
# PARA EL APARTADO DE ALMACENAMIENTO
# --------------------------------------------------------------
def disk_monitor(request):
    """Renderiza la página de monitoreo del disco"""
    return render(request, "monitoring/disk.html")

prev_disk_stats = psutil.disk_io_counters()
prev_time = time.time()
prev_disk_io = psutil.disk_io_counters()

def get_disk_info(request):
    """Obtiene información detallada del disco y tráfico en tiempo real."""

    global prev_disk_io

    disk_usage = psutil.disk_usage('/')
    current_disk_io = psutil.disk_io_counters()

    write_speed = round((current_disk_io.write_bytes - prev_disk_io.write_bytes) / (1024 * 1024), 2)
    read_speed = round((current_disk_io.read_bytes - prev_disk_io.read_bytes) / (1024 * 1024), 2)

    prev_disk_io = current_disk_io

    total_space = round(disk_usage.total / (1024 ** 3), 2)
    used_space = round(disk_usage.used / (1024 ** 3), 2)
    free_space = round(disk_usage.free / (1024 ** 3), 2)

    try:
        disk_type = "SSD" if "nvme" in psutil.disk_partitions()[0].device else "HDD"
        disk_format = psutil.disk_partitions()[0].fstype
    except:
        disk_type = "Desconocido"
        disk_format = "Desconocido"

    return JsonResponse({
        "total_space": total_space,
        "used_space": used_space,
        "free_space": free_space,
        "write_speed": write_speed,
        "read_speed": read_speed,
        "disk_type": disk_type,
        "disk_format": disk_format
    })


# --------------------------------------------------------------
# PARA EL APARTADO DE RED
# --------------------------------------------------------------
def red_monitor(request):
    """Renderiza la página de monitoreo de red."""
    return render(request, 'monitoring/red.html')

prev_stats = psutil.net_io_counters(pernic=True)
prev_envios = [0.00, 0.00]  
prev_recepciones = [0.00, 0.00]  

def get_network_info():
    """Obtiene información detallada de la red y tráfico en tiempo real con suavizado de valores."""
    global prev_stats, prev_envios, prev_recepciones

    interfaces = psutil.net_if_addrs()
    current_stats = psutil.net_io_counters(pernic=True)

    network_data = []
    interfaces_list = []

    for iface, addrs in interfaces.items():
        ipv4, ipv6, tipo_conexion = "No disponible", "No disponible", "Desconocido"

        for addr in addrs:
            if addr.family == socket.AF_INET and not addr.address.startswith("127."):
                ipv4 = addr.address
            elif addr.family == socket.AF_INET6 and not addr.address.startswith("::1"):
                ipv6 = addr.address.split('%')[0]

        curr_iface_stats = current_stats.get(iface, None)
        prev_iface_stats = prev_stats.get(iface, None)

        if prev_iface_stats and curr_iface_stats:
            envio = round((curr_iface_stats.bytes_sent - prev_iface_stats.bytes_sent) / 1024, 2)
            recepcion = round((curr_iface_stats.bytes_recv - prev_iface_stats.bytes_recv) / 1024, 2)
        else:
            envio, recepcion = 0.00, 0.00

        prev_envios.append(envio)
        prev_recepciones.append(recepcion)

        if len(prev_envios) > 2:
            prev_envios.pop(0)
            prev_recepciones.pop(0)

        envio = round(sum(prev_envios) / len(prev_envios), 2)
        recepcion = round(sum(prev_recepciones) / len(prev_recepciones), 2)

        if iface.startswith("eth"):
            tipo_conexion = "Ethernet"
        elif iface.startswith("wlan"):
            tipo_conexion = "Wi-Fi"
        elif iface.startswith("lo"):
            tipo_conexion = "Loopback"

        network_data.append({
            "adaptador": iface,
            "ipv4": ipv4,
            "ipv6": ipv6,
            "tipo_conexion": tipo_conexion,
            "envio": envio,
            "recepcion": recepcion
        })
        interfaces_list.append(iface)

    if any(data["envio"] > 0 or data["recepcion"] > 0 for data in network_data):
        prev_stats = current_stats

    main_interface = next((iface for iface in network_data if iface["tipo_conexion"] != "Loopback"), network_data[0] if network_data else {})

    return JsonResponse({
        "interfaces": interfaces_list,
        "main_interface": main_interface
    })

def network_usage_api(request):
    """API que devuelve la información de la red en tiempo real."""
    return get_network_info()


# --------------------------------------------------------------
# PARA EL APARTADO DE RAM
# --------------------------------------------------------------
def ram_monitor(request):
    """Renderiza la página de monitoreo de RAM."""
    return render(request, 'monitoring/ram.html')

def get_ram_info():
    """Obtiene la información de la RAM sin necesidad de sudo, con métodos alternativos si uno falla."""
    try:
        ram_model = "No disponible"
        ram_speed = "No disponible"
        ram_slots_total = 0
        ram_slots_used = 0
        ram_factor = "No disponible"

        try:
            with open('/proc/meminfo', 'r') as f:
                meminfo = {line.split(":")[0]: line.split(":")[1].strip() for line in f}
            total_mem = int(meminfo.get("MemTotal", "0 kB").split()[0]) / (1024 ** 2)  # GB
            available_mem = int(meminfo.get("MemAvailable", "0 kB").split()[0]) / (1024 ** 2)
            cached_mem = int(meminfo.get("Cached", "0 kB").split()[0]) / (1024 ** 2)
        except Exception:
            total_mem, available_mem, cached_mem = 0, 0, 0

        memory_devices = glob.glob("/sys/devices/system/memory/memory*/online")
        if memory_devices:
            ram_slots_total = len(memory_devices)
            ram_slots_used = sum(1 for device in memory_devices if "1" in open(device).read().strip())

        model_path = "/sys/class/dmi/id/product_name"
        if os.path.exists(model_path):
            with open(model_path, "r") as f:
                ram_model = f.read().strip() or "No disponible"

        try:
            dmidecode_output = subprocess.check_output("dmidecode -t memory | grep 'Speed'", shell=True).decode()
            for line in dmidecode_output.split("\n"):
                if "Speed:" in line and "Unknown" not in line:
                    ram_speed = line.split(":")[-1].strip()
                    break  
        except:
            pass

        if ram_speed == "No disponible":
            if "DDR4" in ram_model:
                ram_speed = "2400 MHz"
            elif "DDR3" in ram_model:
                ram_speed = "1600 MHz"
            else:
                ram_speed = "2133 MHz"

        chassis_path = "/sys/class/dmi/id/chassis_type"
        if os.path.exists(chassis_path):
            with open(chassis_path, "r") as f:
                chassis_type = f.read().strip()
            ram_factor = "SO-DIMM" if chassis_type in ["9", "10", "14"] else "DIMM"

        return ram_model, ram_speed, ram_slots_total, ram_slots_used, ram_factor, total_mem, available_mem, cached_mem

    except Exception:
        return "Error", "Error", 0, 0, "Error", 0, 0, 0

def ram_usage_api(request):
    """Obtiene datos en tiempo real sobre la memoria RAM."""
    ram = psutil.virtual_memory()
    ram_model, ram_speed, ram_slots, ram_slots_used, ram_factor, total_mem, available_mem, cached_mem = get_ram_info()

    data = {
        "ram_used": round(ram.used / (1024 ** 3), 2),
        "ram_free": round(ram.available / (1024 ** 3), 2),
        "ram_total": round(ram.total / (1024 ** 3), 2),
        "ram_porcent": round((ram.used / ram.total) * 100, 2),
        "ram_cache": round(getattr(ram, 'cached', 0) / (1024 ** 3), 2),

        "ram_model": ram_model,
        "ram_speed": ram_speed,
        "ram_slots": ram_slots,
        "ram_slots_used": ram_slots_used,
        "ram_factor": ram_factor
    }

    return JsonResponse(data)


# --------------------------------------------------------------
# PARA EL APARTADO DE CPU
# --------------------------------------------------------------
def cpu_monitor(request):
    """Renderiza la página de monitoreo de CPU."""
    return render(request, 'monitoring/cpu.html')

def cpu_usage_api(request):
    """Obtiene datos en tiempo real sobre CPU, procesos en ejecución y detalles del sistema."""

    cpu_usage = psutil.cpu_percent(interval=1)
    cpu_freq = psutil.cpu_freq()
    cpu_speed = round(cpu_freq.current / 1000, 2) if cpu_freq and cpu_freq.current else 0
    cpu_cores = psutil.cpu_count(logical=False)
    cpu_logical = psutil.cpu_count(logical=True)
    cpu_sockets = 1
    cpu_model = get_cpu_model()

    processes = []
    for proc in psutil.process_iter(attrs=['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            processes.append(proc.info)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    processes = sorted(processes, key=lambda p: p['cpu_percent'], reverse=True)

    running_processes = len(processes)
    
    data = {
        "cpu_usage": round(cpu_usage, 2),
        "cpu_speed": cpu_speed,
        "cpu_model": cpu_model,
        "cpu_cores": cpu_cores,
        "cpu_logical": cpu_logical,
        "cpu_sockets": cpu_sockets,
        "cpu_history": [cpu_usage] * 10,
        "running_processes": running_processes,
        "processes": processes[:50], 
    }

    return JsonResponse(data, safe=False)

def get_cpu_model():
    """Obtiene el modelo del procesador de forma más confiable."""
    try:
        if platform.system() == "Windows":
            return platform.processor()
        elif platform.system() == "Linux":
            return subprocess.check_output("cat /proc/cpuinfo | grep 'model name' | uniq", shell=True).decode().split(":")[1].strip()
        elif platform.system() == "Darwin": 
            return subprocess.check_output(["sysctl", "-n", "machdep.cpu.brand_string"]).decode().strip()
        else:
            return "Desconocido"
    except Exception:
        return "No disponible"
    

# --------------------------------------------------------------
# PARA EL APARTADO DE DASHBOARD Y CAPTURA DE DATOS A LA DB
# --------------------------------------------------------------
prev_net_stats = psutil.net_io_counters()
@csrf_exempt  
def system_usage(request):
    """Obtiene datos en tiempo real del sistema y guarda en la base de datos solo si es una solicitud POST."""
    global cpu_history, ram_history, net_upload_history, net_download_history, disk_history, prev_net_stats

    try:
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
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S') 

        for history in [cpu_history, ram_history, net_upload_history, net_download_history, disk_history]:
            if len(history) >= 10:
                history.pop(0)

        cpu_history.append(cpu_usage)
        ram_history.append(ram.used / (1024 ** 3))  
        net_upload_history.append(net_upload_kbps)
        net_download_history.append(net_download_kbps)
        disk_history.append(disk.used / (1024 ** 3))

        if request.method == "POST":
            try:
                SystemUsage.objects.create(
                    timestamp=timestamp,
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

            "cpu_history": cpu_history[:],  
            "ram_history": ram_history[:],
            "net_upload_history": net_upload_history[:],
            "net_download_history": net_download_history[:],
            "disk_history": disk_history[:],

            "cpu_base_speed": cpu_speed,  
            "cpu_cores": cpu_cores,
            "cpu_logical": cpu_logical,
            "cpu_sockets": cpu_sockets,

            "modal_chart_data": {
                "cpu": {
                    "labels": list(range(len(cpu_history))),
                    "data": cpu_history[:]
                },
                "ram": {
                    "labels": ["Usada", "Libre"],
                    "data": [ram.used / (1024 ** 3), ram.total / (1024 ** 3) - ram.used / (1024 ** 3)]
                },
                "network": {
                    "labels": list(range(len(net_upload_history))),
                    "upload_data": net_upload_history[:],
                    "download_data": net_download_history[:]
                },
                "disk": {
                    "labels": ["Usado", "Disponible"],
                    "data": [disk.used / (1024 ** 3), disk.total / (1024 ** 3) - disk.used / (1024 ** 3)]
                }
            }
        }

        return JsonResponse(data)
    
    except Exception as e:
        return JsonResponse({"status": "error", "message": f"❌ Error en el servidor: {str(e)}"}, status=500)