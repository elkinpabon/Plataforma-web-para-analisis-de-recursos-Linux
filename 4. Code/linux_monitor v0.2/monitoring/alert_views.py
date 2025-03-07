import logging
from django.http import JsonResponse
from django.core.mail import send_mail, EmailMessage
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from django.utils.timezone import now
from .models import Alerts
import requests

logger = logging.getLogger(__name__)

@csrf_exempt  
@require_http_methods(["POST"])
def send_alert_email(request):
    """Envía un correo de alerta y guarda la alerta en la base de datos si el usuario está autenticado."""
    try:
        email = request.POST.get('email')
        alert_message = request.POST.get('alert_message', '')
        pdf_file = request.FILES.get('pdf')

        if not email or not pdf_file:
            return JsonResponse({'error': 'Faltan datos necesarios (email o archivo PDF)'}, status=400)


        subject = '⚠️ Alerta de Sistema con Informe Adjunto - Monitor OS'
        message = f'{alert_message}\n\nAdjunto encontrará el informe de monitoreo del sistema generado recientemente.'

        email_message = EmailMessage(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [email]
        )
        email_message.attach(pdf_file.name, pdf_file.read(), pdf_file.content_type)
        email_message.send()

        # ✅ Si el usuario está autenticado, guardar la alerta en la BD
        if request.user.is_authenticated:
            Alerts.objects.create(
                id_user=request.user,
                description_alerts=alert_message,
                timestamp_alerts=now().strftime("%Y-%m-%d %H:%M:%S"),
                alert_location=email  # 📍 Guardar el email en ALERT_LOCATION
            )

        return JsonResponse({'success': True, 'message': '📧 Alerta enviada correctamente con el informe adjunto.'})

    except Exception as e:
        logger.error(f"❌ Error al enviar la alerta con el informe adjunto: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt  
@require_http_methods(["POST"])
def send_ram_alert_email(request):
    """Envía un correo de alerta de RAM y guarda la alerta en la base de datos si el usuario está autenticado."""
    try:
        email = request.POST.get('email')
        alert_message = request.POST.get('alert_message', '')
        pdf_file = request.FILES.get('pdf')

        if not email or not pdf_file:
            return JsonResponse({'error': 'Faltan datos necesarios (email o archivo PDF)'}, status=400)

        subject = '⚠️ Alerta de RAM con Informe Adjunto - Monitor OS'
        message = f'{alert_message}\n\nAdjunto encontrará el informe de monitoreo del sistema generado recientemente.'

        email_message = EmailMessage(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [email]
        )
        email_message.attach(pdf_file.name, pdf_file.read(), pdf_file.content_type)
        email_message.send()

        # ✅ Si el usuario está autenticado, guardar la alerta en la BD
        if request.user.is_authenticated:
            Alerts.objects.create(
                id_user=request.user,
                description_alerts=alert_message,
                timestamp_alerts=now().strftime("%Y-%m-%d %H:%M:%S"),
                alert_location=email  # 📍 Guardar el email en ALERT_LOCATION
            )

        return JsonResponse({'success': True, 'message': '📧 Alerta de RAM enviada correctamente con el informe adjunto.'})

    except Exception as e:
        logger.error(f"❌ Error al enviar la alerta de RAM con el informe adjunto: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt  
@require_http_methods(["POST"])
def send_red_alert_email(request):
    """Envía un correo de alerta de RED y guarda la alerta en la base de datos si el usuario está autenticado."""
    try:
        email = request.POST.get('email')
        alert_message = request.POST.get('alert_message', '')
        pdf_file = request.FILES.get('pdf')
        network_usage = request.POST.get('network_usage', '')

        if not email or not pdf_file or not network_usage:
            return JsonResponse({'error': 'Faltan datos necesarios (email, archivo PDF o uso de red)'}, status=400)

        subject = '⚠️ Alerta de RED con Informe Adjunto - Monitor OS'
        message = f'{alert_message}\n\nAdjunto encontrará el informe de monitoreo del sistema generado recientemente.'

        email_message = EmailMessage(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [email]
        )
        email_message.attach(pdf_file.name, pdf_file.read(), pdf_file.content_type)
        email_message.send()

        # ✅ Si el usuario está autenticado, guardar la alerta en la BD
        if request.user.is_authenticated:
            Alerts.objects.create(
                id_user=request.user,
                description_alerts=f"Uso actual de RED: {network_usage} kbps - {alert_message}",
                timestamp_alerts=now().strftime("%Y-%m-%d %H:%M:%S"),
                alert_location=email  # 📍 Guardar el email en ALERT_LOCATION
            )

        return JsonResponse({'success': True, 'message': '📧 Alerta de RED enviada correctamente con el informe adjunto.'})

    except Exception as e:
        logger.error(f"❌ Error al enviar la alerta de RED con el informe adjunto: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
