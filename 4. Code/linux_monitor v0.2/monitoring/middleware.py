from django.utils.deprecation import MiddlewareMixin
from .models import CustomUser

class CustomUserMiddleware(MiddlewareMixin):
    def process_request(self, request):
        user_id = request.session.get("user_id")
        if user_id:
            try:
                user = CustomUser.objects.get(id_user=user_id)
                user.is_authenticated = True  
                request.user = user
            except CustomUser.DoesNotExist:
                request.user = None
        else:
            request.user = None
