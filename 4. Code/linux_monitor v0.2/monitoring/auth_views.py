from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from .models import CustomUser , Report
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password
from django.utils.timezone import now
from .models import CustomUser, UserRole 
from django.http import JsonResponse
from django.contrib.auth import logout



def login_view(request):
    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")

        try:
            user = CustomUser.objects.get(email=email)
            
            if check_password(password, user.password):  
                request.session["user_id"] = user.id_user  
                request.session["email"] = user.email
                request.session.modified = True
                
                # 🚀 Agregamos last_login manualmente
                user.last_login = now()
                user.save(update_fields=['last_login'])

                return JsonResponse({"success": True, "redirect_url": "/"})  
            else:
                return JsonResponse({"success": False, "message": " Contraseña incorrecta"})
        except CustomUser.DoesNotExist:
            return JsonResponse({"success": False, "message": " Usuario no encontrado"})

    return render(request, "monitoring/login.html")


# Registro normal
def register_view(request):
    if request.method == "POST":
        name = request.POST.get("username")  
        lastname = request.POST.get("lastname")  
        email = request.POST.get("email")  
        password = request.POST.get("password")  

        if CustomUser.objects.filter(email=email).exists():
            return JsonResponse({"success": False, "message": "El correo ya está registrado"})

        try:
            # Verificar si existe un rol con ID 2 (Usuario Normal)
            default_role, created = UserRole.objects.get_or_create(
                id_role=2, defaults={"role_name": "Usuario Normal"}
            )

            # Crear el usuario con el rol por defecto
            user = CustomUser.objects.create(
                id_role=default_role,  
                name=name,
                lastname=lastname,
                email=email,
                password=make_password(password)  
            )
            user.save()

            return JsonResponse({"success": True, "message": "Registro exitoso. Redirigiendo...", "redirect_url": "/login/"})

        except Exception as e:
            return JsonResponse({"success": False, "message": f"Error al registrar: {str(e)}"})

    return render(request, "monitoring/login.html")


@login_required
def analysis_view(request):

    return render(request, "monitoring/analysis.html")



@login_required
def profile_view(request):
    return render(request, "monitoring/profile.html", {"user": request.user})



@login_required
def historial_view(request):
    """Obtiene los reportes del usuario autenticado y los envía a la plantilla."""
    user_id = request.session.get("user_id")  # Obtener ID del usuario en sesión
    if not user_id:
        return render(request, "monitoring/historial.html", {"reports": None, "error": "No hay usuario autenticado."})

    try:
        user = CustomUser.objects.get(id_user=user_id)
        reports = Report.objects.filter(id_user=user).order_by('-timestamp_report')  # Ordenados del más reciente al más antiguo
    except CustomUser.DoesNotExist:
        reports = None

    return render(request, "monitoring/history.html", {"reports": reports})


@login_required
def logout_view(request):
    if request.method == "POST":
        logout(request)
        return JsonResponse({"success": True, "message": "Sesión cerrada correctamente."})
    return JsonResponse({"success": False, "message": "Método no permitido."})



