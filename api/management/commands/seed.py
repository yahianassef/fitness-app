"""Populate the database with the exercise library and comeback programs.

    python manage.py seed              # add/update content, keep user data
    python manage.py seed --reset      # wipe library + programs first, then seed
    python manage.py seed --demo-user  # also create a demo account with sample logs
"""
import datetime as dt
import random

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import (
    Exercise,
    Profile,
    Program,
    ProgramDay,
    ProgramSlot,
    SetEntry,
    Workout,
)
from api.seed_data import CHAIN_META, EXERCISES, PROGRAMS

DEMO_EMAIL = "demo@fitnesscomeback.app"
DEMO_PASSWORD = "comeback123"


class Command(BaseCommand):
    help = "Seed the exercise library and pre-built programs."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing exercises and programs before seeding.",
        )
        parser.add_argument(
            "--demo-user",
            action="store_true",
            help="Create a demo account (demo@fitnesscomeback.app / comeback123) "
            "with an active program and a few weeks of sample workouts.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write("Resetting library and programs...")
            ProgramSlot.objects.all().delete()
            ProgramDay.objects.all().delete()
            Program.objects.all().delete()
            # Exercises are protected by workout logs; only delete the untouched ones.
            used = set(SetEntry.objects.values_list("exercise_id", flat=True))
            Exercise.objects.exclude(id__in=used).delete()

        self._seed_exercises()
        self._seed_programs()

        if options["demo_user"]:
            self._seed_demo_user()

        self.stdout.write(self.style.SUCCESS(
            f"Done. {Exercise.objects.count()} exercises, "
            f"{Program.objects.count()} programs."
        ))

    # ------------------------------------------------------------------ #
    def _seed_exercises(self):
        for row in EXERCISES:
            defaults = {
                "name": row["name"],
                "equipment": row["equipment"],
                "difficulty": row["difficulty"],
                "primary_muscles": row.get("primary_muscles", []),
                "secondary_muscles": row.get("secondary_muscles", []),
                "summary": row["summary"],
                "instructions": row.get("instructions", []),
                "form_tips": row.get("form_tips", []),
                "common_mistakes": row.get("common_mistakes", []),
                "video_provider": row.get("video_provider", "youtube"),
                "video_id": row["video_id"],
                "video_title": row.get("video_title", ""),
                "is_compound": row.get("is_compound", False),
                "beginner_friendly": row.get(
                    "beginner_friendly", row["difficulty"] != "advanced"
                ),
            }
            meta = CHAIN_META.get(row["slug"])
            if meta:
                pattern, chain_key, chain_order, lever, anchor, unilateral = meta
                defaults.update({
                    "movement_pattern": pattern,
                    "chain_key": chain_key,
                    "chain_order": chain_order,
                    "scaling_lever": lever,
                    "needs_anchor": anchor,
                    "is_unilateral": unilateral,
                })
            else:
                # Everything not in the Bodyweight & Bands section.
                defaults["movement_pattern"] = "other"
            Exercise.objects.update_or_create(slug=row["slug"], defaults=defaults)
        bw = Exercise.objects.filter(equipment__in=["bodyweight", "bands"]).count()
        self.stdout.write(
            f"  exercises: {Exercise.objects.count()} ({bw} bodyweight/bands)"
        )

    def _seed_programs(self):
        for row in PROGRAMS:
            program, _ = Program.objects.update_or_create(
                slug=row["slug"],
                defaults={
                    "name": row["name"],
                    "subtitle": row.get("subtitle", ""),
                    "description": row["description"],
                    "weeks": row["weeks"],
                    "days_per_week": row["days_per_week"],
                    "level": row["level"],
                    "focus": row.get("focus", ""),
                    "equipment_used": row.get("equipment_used", []),
                    "equipment_profile": row.get("equipment_profile", "all"),
                    "weekly_progression": row.get("weekly_progression", []),
                    "order_index": row.get("order_index", 0),
                },
            )
            program.days.all().delete()  # rebuild day structure from scratch
            for day_row in row["days"]:
                day = ProgramDay.objects.create(
                    program=program,
                    day_index=day_row["day_index"],
                    name=day_row["name"],
                    focus=day_row.get("focus", ""),
                )
                for order, slot in enumerate(day_row["slots"]):
                    ProgramSlot.objects.create(
                        day=day,
                        exercise=Exercise.objects.get(slug=slot["exercise"]),
                        order_index=order,
                        sets=slot.get("sets", 3),
                        rep_scheme=slot.get("rep_scheme", "8-10"),
                        rest_seconds=slot.get("rest_seconds", 90),
                        coach_note=slot.get("coach_note", ""),
                    )
        self.stdout.write(f"  programs: {Program.objects.count()}")

    def _seed_demo_user(self):
        user, created = User.objects.get_or_create(
            username=DEMO_EMAIL, defaults={"email": DEMO_EMAIL}
        )
        user.set_password(DEMO_PASSWORD)
        user.save()

        program = Program.objects.get(slug="build-bwb")
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.display_name = "Sam"
        profile.goal = "strength"
        profile.experience = "returning"
        profile.fitness_level = "intermediate"
        profile.months_off = 5
        profile.days_per_week = 4
        profile.unit = "lb"
        profile.active_program = program
        profile.onboarded = True
        profile.save()

        user.workouts.all().delete()
        self._build_demo_history(user, program)
        self.stdout.write(
            self.style.SUCCESS(
                f"  demo user: {DEMO_EMAIL} / {DEMO_PASSWORD} "
                f"({user.workouts.count()} sample workouts)"
            )
        )

    def _build_demo_history(self, user, program):
        """Five weeks of sessions with a gentle upward trend."""
        rng = random.Random(42)
        days = list(program.days.prefetch_related("slots__exercise").order_by("day_index"))
        # Nominal band-resistance "weight" (lb) for loaded band moves; bodyweight
        # moves log reps only.
        base = {
            "band-lat-pulldown": 30,
            "band-straight-arm-pulldown": 20,
            "band-bent-over-row": 25,
            "band-overhead-press": 20,
            "band-pull-through": 35,
            "band-chest-press": 25,
            "band-good-morning": 20,
            "band-pallof-press": 15,
            "band-bicep-curl": 20,
        }
        today = dt.date.today()
        start = today - dt.timedelta(days=7 * 5)
        session_offsets = [0, 2, 4, 5]  # up to 4 sessions/week

        for week in range(5):
            bump = 1 + week * 0.06  # ~6% per week
            for di, day in enumerate(days):
                performed = start + dt.timedelta(days=7 * week + session_offsets[di])
                if performed > today:
                    continue
                workout = Workout.objects.create(
                    user=user,
                    performed_on=performed,
                    program=program,
                    program_day=day,
                    title=day.name,
                    perceived_effort=rng.randint(6, 8),
                )
                for slot in day.slots.all():
                    slug = slot.exercise.slug
                    top = base.get(slug)
                    n_sets = slot.sets
                    for s in range(1, n_sets + 1):
                        if top is None:
                            reps = rng.choice([8, 10, 12])
                            weight = None
                        else:
                            weight = round((top * bump) / 5) * 5
                            reps = rng.randint(6, 10)
                        SetEntry.objects.create(
                            workout=workout,
                            exercise=slot.exercise,
                            set_number=s,
                            reps=reps,
                            weight=weight,
                        )
