from django.urls import path

from . import views

urlpatterns = [
    # auth
    path("auth/signup/", views.signup),
    path("auth/login/", views.login),
    path("auth/me/", views.me),
    path("auth/profile/", views.update_profile),
    # library
    path("equipment/", views.equipment_list),
    path("muscles/", views.muscle_list),
    path("exercises/", views.exercise_list),
    path("exercises/<slug:slug>/", views.exercise_detail),
    # bodyweight & bands section
    path("moves/", views.moves_overview),
    path("level-defaults/", views.level_defaults),
    # programs
    path("programs/", views.program_list),
    path("programs/<slug:slug>/", views.program_detail),
    path("programs/<slug:slug>/select/", views.select_program),
    # workouts
    path("workouts/", views.workout_collection),
    path("workouts/<int:pk>/", views.workout_detail),
    # analytics
    path("dashboard/", views.dashboard),
    path("progress/", views.progress),
]
