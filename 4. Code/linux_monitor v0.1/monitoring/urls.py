from django.urls import path
from . import views
from .views import red_monitor, network_usage_api
from . import views
from .views import get_disk_info

urlpatterns = [
    path('', views.index, name='index'),
    path('cpu/', views.cpu_monitor, name='cpu_monitor'), 
    path('api/system_usage/', views.system_usage, name='system_usage'),
    path('api/cpu_usage/', views.cpu_usage_api, name='cpu_usage'), 
    path('ram/', views.ram_monitor, name='ram_monitor'),
    path('api/ram_usage/', views.ram_usage_api, name='ram_usage_api'),
    path('red/', red_monitor, name='red_monitor'),
    path('api/network_usage/', network_usage_api, name='network_usage_api'),
    path("disk/", views.disk_monitor, name="disk_monitor"),
    path('api/disk_usage/', get_disk_info, name="disk_usage"),
]