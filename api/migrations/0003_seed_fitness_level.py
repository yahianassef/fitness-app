"""Map the old free-text `experience` onto the new `fitness_level` tier."""
from django.db import migrations

MAP = {
    "returning": "beginner",
    "beginner": "beginner",
    "experienced": "intermediate",
}


def forwards(apps, schema_editor):
    Profile = apps.get_model("api", "Profile")
    for profile in Profile.objects.all():
        profile.fitness_level = MAP.get(profile.experience, "beginner")
        profile.save(update_fields=["fitness_level"])


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [("api", "0002_exercise_chain_key_exercise_chain_order_and_more")]
    operations = [migrations.RunPython(forwards, backwards)]
