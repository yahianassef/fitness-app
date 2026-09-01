"""Data model for the Fitness Comeback app.

Everything a returning gym-goer needs lives here: an equipment-tagged exercise
library with demo videos, a few progressive comeback programs, and a personal
log of completed workouts used to draw progress graphs.
"""
from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

EQUIPMENT_CHOICES = [
    ("dumbbells", "Dumbbells"),
    ("barbells", "Barbells"),
    ("kettlebells", "Kettlebells"),
    ("bodyweight", "Bodyweight"),
    ("bands", "Resistance Bands"),
    ("machines", "Machines"),
    ("cables", "Cables"),
    ("medicine_ball", "Medicine Ball"),
    ("stability_ball", "Stability Ball"),
]

# The two families the app splits its browsing between.
HOME_EQUIPMENT = ["bodyweight", "bands"]
GYM_EQUIPMENT = ["dumbbells", "barbells", "kettlebells", "machines", "cables",
                 "medicine_ball", "stability_ball"]

DIFFICULTY_CHOICES = [
    ("beginner", "Beginner"),
    ("intermediate", "Intermediate"),
    ("advanced", "Advanced"),
]

# Fundamental movement patterns — the spine of the Bodyweight & Bands section.
MOVEMENT_PATTERN_CHOICES = [
    ("horizontal_push", "Horizontal push"),
    ("horizontal_pull", "Horizontal pull"),
    ("vertical_push", "Vertical push"),
    ("vertical_pull", "Vertical pull"),
    ("squat", "Squat"),
    ("hinge", "Hinge"),
    ("lunge", "Lunge / split"),
    ("core_anti_extension", "Core · anti-extension"),
    ("core_anti_rotation", "Core · anti-rotation"),
    ("core_anti_lateral", "Core · anti-lateral"),
    ("core_rotation", "Core · rotation"),
    ("calves", "Calves"),
    ("conditioning", "Conditioning"),
    ("mobility", "Mobility & Warm-up"),
    ("other", "Other"),
]

# How a bodyweight / band exercise is made harder than the step below it.
SCALING_LEVER_CHOICES = [
    ("body_angle", "Body angle"),
    ("lever_length", "Lever length"),
    ("range_of_motion", "Range of motion"),
    ("base_of_support", "Base of support"),
    ("unilateral", "Unilateral load"),
    ("tempo", "Tempo & time under tension"),
    ("band_tension", "Band tension"),
    ("power", "Stored elastic energy & power"),
    ("density", "Density"),
]

ANCHOR_CHOICES = [
    ("none", "No anchor needed"),
    ("door", "Needs a door anchor"),
    ("underfoot", "Loop under the feet"),
    ("bar", "Needs a bar"),
]

# Per-level session defaults. Drives the workout logger's prefilled numbers,
# the rest timer, and the "ready to level up" trigger.
LEVEL_DEFAULTS = {
    "beginner": {
        "label": "Beginner",
        "tagline": "Move well, build the habit",
        "sets": [2, 3],
        "reps_strength": "10–15",
        "reps_core": "12–20 reps · 20–40 sec",
        "rest_seconds": 75,
        "tempo": "2-0-2",
        "rir": "3–4",
        "session_minutes": "20–30",
        "exercises_per_session": [5, 6],
    },
    "intermediate": {
        "label": "Intermediate",
        "tagline": "Add muscle and work capacity",
        "sets": [3, 4],
        "reps_strength": "8–12",
        "reps_core": "15–25 reps · 30–60 sec",
        "rest_seconds": 60,
        "tempo": "3-1-1",
        "rir": "1–3",
        "session_minutes": "35–45",
        "exercises_per_session": [6, 8],
    },
    "advanced": {
        "label": "Advanced",
        "tagline": "Max relative strength & skill",
        "sets": [4, 5],
        "reps_strength": "3–8",
        "reps_core": "20–30 reps · 45–90 sec",
        "rest_seconds": 120,
        "tempo": "5s eccentric / explosive",
        "rir": "0–2",
        "session_minutes": "45–60",
        "exercises_per_session": [7, 9],
    },
}


class Profile(models.Model):
    """Per-user preferences captured during onboarding."""

    GOAL_CHOICES = [
        ("general", "Get back into a routine"),
        ("strength", "Rebuild strength"),
        ("muscle", "Build muscle"),
        ("conditioning", "Improve conditioning"),
    ]
    EXPERIENCE_CHOICES = [
        ("returning", "Returning after a break"),
        ("beginner", "Brand new to lifting"),
        ("experienced", "Experienced, just been away"),
    ]
    # The tier that drives workout scaling everywhere in the app.
    FITNESS_LEVEL_CHOICES = DIFFICULTY_CHOICES
    UNIT_CHOICES = [("lb", "Pounds (lb)"), ("kg", "Kilograms (kg)")]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    display_name = models.CharField(max_length=80, blank=True)
    goal = models.CharField(max_length=20, choices=GOAL_CHOICES, default="general")
    experience = models.CharField(
        max_length=20, choices=EXPERIENCE_CHOICES, default="returning"
    )
    fitness_level = models.CharField(
        max_length=20, choices=FITNESS_LEVEL_CHOICES, default="beginner",
        help_text="Beginner / Intermediate / Advanced — scales every workout.",
    )
    months_off = models.PositiveSmallIntegerField(default=4)
    days_per_week = models.PositiveSmallIntegerField(default=3)
    unit = models.CharField(max_length=2, choices=UNIT_CHOICES, default="lb")
    active_program = models.ForeignKey(
        "Program", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    onboarded = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile<{self.user.username}>"


class Exercise(models.Model):
    slug = models.SlugField(unique=True, max_length=90)
    name = models.CharField(max_length=120)
    equipment = models.CharField(max_length=20, choices=EQUIPMENT_CHOICES)
    difficulty = models.CharField(
        max_length=20, choices=DIFFICULTY_CHOICES, default="beginner"
    )
    primary_muscles = models.JSONField(default=list)
    secondary_muscles = models.JSONField(default=list)

    summary = models.CharField(max_length=240)
    instructions = models.JSONField(default=list, help_text="Ordered how-to steps.")
    form_tips = models.JSONField(default=list)
    common_mistakes = models.JSONField(default=list)

    video_provider = models.CharField(max_length=20, default="youtube")
    video_id = models.CharField(max_length=40)
    video_title = models.CharField(max_length=200, blank=True)

    is_compound = models.BooleanField(default=False)
    beginner_friendly = models.BooleanField(default=True)

    # Bodyweight & Bands section metadata.
    movement_pattern = models.CharField(
        max_length=24, choices=MOVEMENT_PATTERN_CHOICES, default="other"
    )
    scaling_lever = models.CharField(
        max_length=20, choices=SCALING_LEVER_CHOICES, blank=True,
        help_text="What makes this step harder than the one below it in its chain.",
    )
    chain_key = models.CharField(
        max_length=40, blank=True,
        help_text="Groups a progression ladder, e.g. 'push-up'. Blank = not in a chain.",
    )
    chain_order = models.PositiveSmallIntegerField(
        default=0, help_text="Position within the chain, 1 = easiest."
    )
    needs_anchor = models.CharField(max_length=12, choices=ANCHOR_CHOICES, default="none")
    is_unilateral = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def _chain_sibling(self, delta):
        if not self.chain_key:
            return None
        return (
            Exercise.objects.filter(
                chain_key=self.chain_key, chain_order=self.chain_order + delta
            ).first()
        )

    @property
    def regression(self):
        return self._chain_sibling(-1)

    @property
    def progression(self):
        return self._chain_sibling(1)

    @property
    def video_embed_url(self):
        if self.video_provider == "youtube":
            return (
                f"https://www.youtube-nocookie.com/embed/{self.video_id}"
                "?rel=0&modestbranding=1"
            )
        if self.video_provider == "vimeo":
            return f"https://player.vimeo.com/video/{self.video_id}"
        return self.video_id  # already a full URL (e.g. local /media/*.mp4)

    @property
    def video_watch_url(self):
        if self.video_provider == "youtube":
            return f"https://www.youtube.com/watch?v={self.video_id}"
        if self.video_provider == "vimeo":
            return f"https://vimeo.com/{self.video_id}"
        return self.video_id


class Program(models.Model):
    slug = models.SlugField(unique=True, max_length=90)
    name = models.CharField(max_length=120)
    subtitle = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    weeks = models.PositiveSmallIntegerField(default=4)
    days_per_week = models.PositiveSmallIntegerField(default=3)
    level = models.CharField(
        max_length=20, choices=DIFFICULTY_CHOICES, default="beginner"
    )
    focus = models.CharField(max_length=120, blank=True)
    equipment_used = models.JSONField(default=list)
    equipment_profile = models.CharField(
        max_length=20,
        choices=[("bodyweight_bands", "Bodyweight & bands"), ("all", "Any equipment")],
        default="all",
    )
    weekly_progression = models.JSONField(
        default=list, help_text="One short coaching note per week."
    )
    order_index = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order_index", "name"]

    def __str__(self):
        return self.name


class ProgramDay(models.Model):
    program = models.ForeignKey(
        Program, on_delete=models.CASCADE, related_name="days"
    )
    day_index = models.PositiveSmallIntegerField()
    name = models.CharField(max_length=120)
    focus = models.CharField(max_length=160, blank=True)

    class Meta:
        ordering = ["day_index"]
        unique_together = [("program", "day_index")]

    def __str__(self):
        return f"{self.program.slug} · {self.name}"


class ProgramSlot(models.Model):
    day = models.ForeignKey(
        ProgramDay, on_delete=models.CASCADE, related_name="slots"
    )
    exercise = models.ForeignKey(Exercise, on_delete=models.PROTECT, related_name="+")
    order_index = models.PositiveSmallIntegerField(default=0)
    sets = models.PositiveSmallIntegerField(default=3)
    rep_scheme = models.CharField(max_length=40, default="8-10")
    rest_seconds = models.PositiveSmallIntegerField(default=90)
    coach_note = models.CharField(max_length=240, blank=True)

    class Meta:
        ordering = ["order_index"]

    def __str__(self):
        return f"{self.day} · {self.exercise.name}"


class Workout(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="workouts"
    )
    performed_on = models.DateField()
    program = models.ForeignKey(
        Program, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    program_day = models.ForeignKey(
        ProgramDay, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    title = models.CharField(max_length=140, blank=True)
    notes = models.TextField(blank=True)
    perceived_effort = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="RPE 1-10 for the whole session."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-performed_on", "-created_at"]

    def __str__(self):
        return f"{self.user.username} · {self.performed_on}"

    @property
    def total_volume(self):
        return sum(
            (s.reps or 0) * (s.weight or 0)
            for s in self.set_entries.all()
            if not s.is_warmup
        )


class SetEntry(models.Model):
    workout = models.ForeignKey(
        Workout, on_delete=models.CASCADE, related_name="set_entries"
    )
    exercise = models.ForeignKey(Exercise, on_delete=models.PROTECT, related_name="+")
    set_number = models.PositiveSmallIntegerField(default=1)
    reps = models.PositiveSmallIntegerField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True, help_text="In the user's unit.")
    is_warmup = models.BooleanField(default=False)
    completed = models.BooleanField(default=True)

    class Meta:
        ordering = ["exercise__name", "set_number"]

    def __str__(self):
        return f"{self.exercise.name} set {self.set_number}"

    @property
    def estimated_1rm(self):
        """Epley formula — a rough one-rep-max estimate for progress tracking."""
        if not self.weight or not self.reps:
            return None
        return round(self.weight * (1 + self.reps / 30), 1)


@receiver(post_save, sender=User)
def ensure_profile(sender, instance, created, **kwargs):
    """Guarantee every user has a Profile (admin-created users, superusers, etc.)."""
    if created and not hasattr(instance, "profile"):
        Profile.objects.get_or_create(user=instance)
