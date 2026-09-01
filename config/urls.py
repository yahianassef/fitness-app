"""URL configuration for the Fitness Comeback app."""
from django.contrib import admin
from django.urls import include, path

from web.views import connect, spa

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    # "Open on your phone" helper: shows a QR code for the LAN address.
    path('connect', connect, name='connect'),
    path('connect/', connect),
    # Single-page app entry point. Any non-API, non-admin path renders the SPA
    # shell so the client-side router can take over (deep links, refresh, etc.).
    path('', spa, name='spa-root'),
    path('<path:unused>', spa, name='spa-catchall'),
]
