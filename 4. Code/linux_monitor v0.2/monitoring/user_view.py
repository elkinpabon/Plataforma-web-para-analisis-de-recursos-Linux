from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.hashers import make_password
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import CustomUser, UserRole
from django.views.decorators.csrf import csrf_exempt

@login_required
def profile_view(request):
    """ Vista para mostrar el perfil del usuario """
    return render(request, "monitoring/profile.html")


@login_required
def update_profile(request):
    """ Vista para actualizar los datos del perfil del usuario """
    if request.method == "POST":
        user = request.user

        # Obtener datos del formulario
        name = request.POST.get("name", "").strip()
        lastname = request.POST.get("lastname", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "").strip()

        # Validaciones básicas
        if not name or not lastname or not email:
            return JsonResponse({"success": False, "message": "Todos los campos son obligatorios."})

        # Verificar si el email ya está en uso
        if email != user.email and CustomUser.objects.filter(email=email).exists():
            return JsonResponse({"success": False, "message": "El correo electrónico ya está en uso."})

        try:
            # Actualizar los datos del usuario
            user.name = name
            user.lastname = lastname
            user.email = email

            # Si se proporciona una nueva contraseña, actualizarla
            if password:
                user.password = make_password(password)

            user.save()
            return JsonResponse({"success": True, "message": "Perfil actualizado correctamente."})

        except Exception as e:
            return JsonResponse({"success": False, "message": f"Error al actualizar perfil: {str(e)}"})

    return JsonResponse({"success": False, "message": "Método no permitido."})


@login_required
def manage_users(request):
    """ Vista para gestionar los usuarios (Solo para administradores) """
    if request.user.id_role.description_rol != "Administrator":
        return redirect("profile")  # Redirigir si no es admin

    users = CustomUser.objects.all()
    return render(request, "monitoring/manage_users.html", {"users": users})


@login_required
@csrf_exempt
def delete_user(request, user_id):
    """ Vista para eliminar un usuario """
    if request.method == "POST":
        user = get_object_or_404(CustomUser, id_user=user_id)
        user.delete()
        return JsonResponse({"success": True, "message": "Usuario eliminado correctamente."})
    return JsonResponse({"success": False, "message": "Método no permitido."})

@csrf_exempt
@login_required
def update_user(request):
    """ Vista para actualizar la información de un usuario (Solo administradores) """
    if request.method == "POST":
        if request.user.id_role.description_rol != "Administrator":
            return JsonResponse({"success": False, "message": "Acceso no autorizado."})

        user_id = request.POST.get("user_id")
        name = request.POST.get("name", "").strip()
        lastname = request.POST.get("lastname", "").strip()
        email = request.POST.get("email", "").strip()
        role_id = request.POST.get("role", "").strip()

        # Validar que los campos no estén vacíos
        if not name or not lastname or not email or not role_id:
            return JsonResponse({"success": False, "message": "Todos los campos son obligatorios."})

        user = get_object_or_404(CustomUser, id_user=user_id)

        # Verificar si el email ya está en uso por otro usuario
        if user.email != email and CustomUser.objects.filter(email=email).exists():
            return JsonResponse({"success": False, "message": "El correo ya está registrado con otro usuario."})

        try:
            user.name = name
            user.lastname = lastname
            user.email = email
            user.id_role = get_object_or_404(UserRole, id_role=role_id)  # Asignar nuevo rol
            user.save()

            return JsonResponse({"success": True, "message": "Usuario actualizado correctamente."})
        except Exception as e:
            return JsonResponse({"success": False, "message": f"Error al actualizar: {str(e)}"})

    return JsonResponse({"success": False, "message": "Método no permitido."})