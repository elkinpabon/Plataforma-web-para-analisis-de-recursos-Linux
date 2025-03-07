from django.urls import path
from . import views
from .views import red_monitor, network_usage_api
from . import views
from .views import get_disk_info
from monitoring import auth_views 
from monitoring import report_views
from monitoring import alert_views
from monitoring import user_view

urlpatterns = [
    path('', views.index, name='index'),
    path('cpu/', views.cpu_monitor, name='cpu_monitor'), 
    path('api/system_usage/', report_views.system_usage, name='system_usage'),
    path('api/cpu_usage/', views.cpu_usage_api, name='cpu_usage'), 
    path('ram/', views.ram_monitor, name='ram_monitor'),
    path('api/ram_usage/', views.ram_usage_api, name='ram_usage_api'),
    path('red/', red_monitor, name='red_monitor'),
    path('api/network_usage/', network_usage_api, name='network_usage_api'),
    path("disk/", views.disk_monitor, name="disk_monitor"),
    path('api/disk_usage/', get_disk_info, name="disk_usage"),
    path('login/', auth_views.login_view, name='login'),
    path('analysis/', auth_views.analysis_view, name='analysis'),
    path('register/', auth_views.register_view, name='register'),
    path('profile/', auth_views.profile_view, name='profile'),
    path('history/', auth_views.historial_view, name='history'),
    path('delete_report/<int:report_id>/', report_views.delete_report, name='delete_report'),
    #alertas
    path('api/send-alert-email/', alert_views.send_alert_email, name='send_alert_email'),
    path('api/send-ram-alert-email/', alert_views.send_ram_alert_email, name='send_ram_alert_email'),
    path('api/send-red-alert-email/', alert_views.send_red_alert_email, name='send_red_alert_email'),
    # Gestión de usuarios y PErfil 
    path("profile/", user_view.profile_view, name="profile"),
    path("profile/update/", user_view.update_profile, name="update_profile"),
    path("users/manage/", user_view.manage_users, name="manage_users"),
    path("users/delete/<int:user_id>/", user_view.delete_user, name="delete_user"),
    path("users/update/",user_view.update_user, name="update_user"),
    path('logout/', auth_views.logout_view, name='logout'),
    path('system_usage/', report_views.system_usage, name='system_usage'),
]

