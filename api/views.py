"""REST API for the Fitness Comeback app."""
import datetime as dt
from collections import defaultdict

from django.contrib.auth import authenticate
from django.db.models import Count, Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import (
    EQUIPMENT_CHOICES,
    LEVEL_DEFAULTS,
    MOVEMENT_PATTERN_CHOICES,
    Exercise,
    Program,
    ProgramDay,
)
from .serializers import (
    ExerciseDetailSerializer,
    ExerciseListSerializer,
    ProfileSerializer,
    ProgramDetailSerializer,
    ProgramListSerializer,
    SignupSerializer,
    UserSerializer,
    WorkoutSerializer,
)

EQUIPMENT_BLURBS = {
    "dumbbells": "Forgiving and adjustable — the friendliest way to reload after a break.",
    "barbells": "Best bang for your buck on strength. Start light and groove the pattern.",
    "kettlebells": "Great for hip power and conditioning without long sessions.",
    "bodyweight": "No equipment, no excuses. Perfect for week one and home days.",
    "bands": "Joint-friendly tension you can take anywhere. Ideal for warm-ups and rebuilding.",
    "machines": "Guided paths mean you can push a little without a spotter.",
    "cables": "Constant tension and smooth resistance — kind to rusty joints.",
}


def _auth_payload(user):
    token, _ = Token.objects.get_or_create(user=user)
    return {"token": token.key, "user": UserSerializer(user).data}


# --------------------------------------------------------------------------- #
#  Auth
# --------------------------------------------------------------------------- #
@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(_auth_payload(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    email = (request.data.get("email") or "").lower().strip()
    password = request.data.get("password") or ""
    user = authenticate(username=email, password=password)
    if user is None:
        return Response(
            {"detail": "That email and password don't match. Try again."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response(_auth_payload(user))


@api_view(["GET"])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(["PATCH"])
def update_profile(request):
    profile = request.user.profile
    serializer = ProfileSerializer(profile, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(UserSerializer(request.user).data)


# --------------------------------------------------------------------------- #
#  Equipment + exercises
# --------------------------------------------------------------------------- #
@api_view(["GET"])
@permission_classes([AllowAny])
def equipment_list(request):
    counts = {
        row["equipment"]: row["n"]
        for row in Exercise.objects.values("equipment").annotate(n=Count("id"))
    }
    data = [
        {
            "type": key,
            "label": label,
            "blurb": EQUIPMENT_BLURBS.get(key, ""),
            "exercise_count": counts.get(key, 0),
        }
        for key, label in EQUIPMENT_CHOICES
    ]
    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def muscle_list(request):
    muscles = set()
    for row in Exercise.objects.values_list("primary_muscles", "secondary_muscles"):
        muscles.update(row[0] or [])
        muscles.update(row[1] or [])
    return Response(sorted(muscles))


@api_view(["GET"])
@permission_classes([AllowAny])
def exercise_list(request):
    qs = Exercise.objects.all()
    # `equipment` accepts a comma list: ?equipment=bodyweight,bands
    equipment = request.GET.get("equipment")
    difficulty = request.GET.get("difficulty")
    muscle = request.GET.get("muscle")
    pattern = request.GET.get("pattern")
    anchor = request.GET.get("needs_anchor")
    search = request.GET.get("q")
    if equipment:
        qs = qs.filter(equipment__in=[e.strip() for e in equipment.split(",") if e.strip()])
    if difficulty:
        qs = qs.filter(difficulty=difficulty)
    if pattern:
        qs = qs.filter(movement_pattern=pattern)
    if anchor:
        qs = qs.filter(needs_anchor=anchor)
    if search:
        qs = qs.filter(name__icontains=search)
    qs = qs.order_by("chain_key", "chain_order", "name")
    exercises = list(qs)
    if muscle:
        needle = muscle.lower()
        exercises = [
            e
            for e in exercises
            if needle in [m.lower() for m in (e.primary_muscles + e.secondary_muscles)]
        ]
    return Response(ExerciseListSerializer(exercises, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def exercise_detail(request, slug):
    exercise = get_object_or_404(Exercise, slug=slug)
    return Response(ExerciseDetailSerializer(exercise).data)


# --------------------------------------------------------------------------- #
#  Bodyweight & Bands section
# --------------------------------------------------------------------------- #
PATTERN_BLURBS = {
    "horizontal_push": "Push-ups and band presses. Chest, shoulders, triceps.",
    "horizontal_pull": "Rows. The counter to all that pressing — build a strong back.",
    "vertical_push": "Overhead strength: band presses and pike push-ups.",
    "vertical_pull": "Pulldowns. Bands keep the back balanced; a bar unlocks pull-ups.",
    "squat": "Knee-dominant. Squat to split squat to pistol — a very high ceiling.",
    "hinge": "Hip-dominant. Bridges, band pull-throughs, single-leg RDLs.",
    "lunge": "Split-stance strength, balance and everyday power.",
    "core_anti_extension": "Resist the spine arching: planks, dead bugs, hollow holds, leg raises.",
    "core_anti_rotation": "Resist the torso twisting: bird dogs, plank taps, band Pallof press.",
    "core_anti_lateral": "Resist tipping sideways: side planks and Copenhagen planks.",
    "core_rotation": "Train the twist: bicycle crunches, Russian twists.",
    "calves": "Lower-leg strength and ankle resilience.",
    "conditioning": "Short bursts to finish a session and build your engine.",
    "mobility": "Loosen up before you lift — hips, spine, shoulders, ankles.",
}


@api_view(["GET"])
@permission_classes([AllowAny])
def moves_overview(request):
    """Everything the Bodyweight & Bands tab needs: patterns → chains → steps.

    Filters (all optional): ?equipment=bodyweight,bands  ?level=beginner
    ?needs_anchor=none
    """
    qs = Exercise.objects.filter(equipment__in=["bodyweight", "bands"])
    equipment = request.GET.get("equipment")
    if equipment:
        wanted = [e.strip() for e in equipment.split(",") if e.strip()]
        qs = qs.filter(equipment__in=wanted)
    level = request.GET.get("level")
    if level:
        qs = qs.filter(difficulty=level)
    anchor = request.GET.get("needs_anchor")
    if anchor:
        qs = qs.filter(needs_anchor=anchor)
    exercises = list(qs.order_by("movement_pattern", "chain_key", "chain_order", "name"))

    by_pattern = defaultdict(list)
    for ex in exercises:
        by_pattern[ex.movement_pattern].append(ex)

    patterns = []
    for key, label in MOVEMENT_PATTERN_CHOICES:
        if key == "other":
            continue
        group = by_pattern.get(key, [])
        if not group:
            continue
        chains = defaultdict(list)
        loose = []
        for ex in group:
            (chains[ex.chain_key] if ex.chain_key else loose).append(ex)
        patterns.append({
            "key": key,
            "label": label,
            "blurb": PATTERN_BLURBS.get(key, ""),
            "exercise_count": len(group),
            "chains": [
                {
                    "key": ck,
                    "steps": ExerciseListSerializer(
                        sorted(items, key=lambda e: e.chain_order), many=True
                    ).data,
                }
                for ck, items in chains.items()
            ],
            "standalone": ExerciseListSerializer(loose, many=True).data,
        })

    return Response({
        "patterns": patterns,
        "total": len(exercises),
    })


# --------------------------------------------------------------------------- #
#  Programs
# --------------------------------------------------------------------------- #
def _program_detail_qs():
    return Program.objects.prefetch_related(
        Prefetch(
            "days",
            queryset=ProgramDay.objects.prefetch_related("slots__exercise"),
        )
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def program_list(request):
    programs = Program.objects.annotate(_days=Count("days"))
    level = request.GET.get("level")
    profile = request.GET.get("equipment_profile")
    if level:
        programs = programs.filter(level=level)
    if profile:
        programs = programs.filter(equipment_profile=profile)
    return Response(ProgramListSerializer(programs, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def level_defaults(request):
    """Per-level session defaults (sets, reps, rest, tempo…)."""
    return Response(LEVEL_DEFAULTS)


@api_view(["GET"])
@permission_classes([AllowAny])
def program_detail(request, slug):
    program = get_object_or_404(_program_detail_qs(), slug=slug)
    return Response(ProgramDetailSerializer(program).data)


@api_view(["POST"])
def select_program(request, slug):
    program = get_object_or_404(Program, slug=slug)
    profile = request.user.profile
    profile.active_program = program
    if not profile.onboarded:
        profile.onboarded = True
    profile.save()
    return Response(UserSerializer(request.user).data)


# --------------------------------------------------------------------------- #
#  Workout log
# --------------------------------------------------------------------------- #
@api_view(["GET", "POST"])
def workout_collection(request):
    if request.method == "GET":
        workouts = (
            request.user.workouts.prefetch_related("set_entries__exercise")
            .select_related("program", "program_day")
        )
        return Response(WorkoutSerializer(workouts, many=True).data)

    serializer = WorkoutSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    workout = serializer.save()
    return Response(
        WorkoutSerializer(workout).data, status=status.HTTP_201_CREATED
    )


@api_view(["GET", "PUT", "PATCH", "DELETE"])
def workout_detail(request, pk):
    workout = get_object_or_404(request.user.workouts, pk=pk)
    if request.method == "DELETE":
        workout.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    if request.method == "GET":
        return Response(WorkoutSerializer(workout).data)
    serializer = WorkoutSerializer(
        workout,
        data=request.data,
        partial=request.method == "PATCH",
        context={"request": request},
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(WorkoutSerializer(workout).data)


# --------------------------------------------------------------------------- #
#  Dashboard + progress
# --------------------------------------------------------------------------- #
def _week_bounds(today):
    monday = today - dt.timedelta(days=today.weekday())
    return monday, monday + dt.timedelta(days=7)


@api_view(["GET"])
def dashboard(request):
    user = request.user
    profile = user.profile
    today = dt.date.today()
    week_start, week_end = _week_bounds(today)

    workouts = list(
        user.workouts.prefetch_related("set_entries__exercise").select_related(
            "program", "program_day"
        )
    )
    this_week = [w for w in workouts if week_start <= w.performed_on < week_end]

    target = profile.days_per_week or (
        profile.active_program.days_per_week if profile.active_program else 3
    )

    # Suggest the next program day: the one following whatever was logged last.
    next_day = None
    active = profile.active_program
    if active:
        days = list(active.days.all().order_by("day_index"))
        if days:
            done_this_week = {
                w.program_day_id for w in this_week if w.program_day_id
            }
            next_day = next(
                (d for d in days if d.id not in done_this_week), days[0]
            )

    # Personal bests (best estimated 1RM per exercise).
    best = {}
    for w in workouts:
        for s in w.set_entries.all():
            e1rm = s.estimated_1rm
            if e1rm is None:
                continue
            cur = best.get(s.exercise.name)
            if cur is None or e1rm > cur["estimated_1rm"]:
                best[s.exercise.name] = {
                    "exercise": s.exercise.name,
                    "estimated_1rm": e1rm,
                    "weight": s.weight,
                    "reps": s.reps,
                    "date": w.performed_on,
                }

    from .serializers import ProgramDaySerializer  # local import avoids cycle at import time

    return Response(
        {
            "profile": ProfileSerializer(profile).data,
            "level_defaults": LEVEL_DEFAULTS.get(
                profile.fitness_level, LEVEL_DEFAULTS["beginner"]
            ),
            "streak_days": _streak(workouts, today),
            "this_week": {
                "completed": len(this_week),
                "target": target,
                "workouts": WorkoutSerializer(this_week, many=True).data,
            },
            "next_day": ProgramDaySerializer(next_day).data if next_day else None,
            "recent_workouts": WorkoutSerializer(workouts[:5], many=True).data,
            "total_workouts": len(workouts),
            "personal_bests": sorted(
                best.values(), key=lambda r: r["estimated_1rm"], reverse=True
            )[:6],
        }
    )


def _streak(workouts, today):
    """Consecutive-week streak: how many recent ISO weeks in a row had a workout."""
    if not workouts:
        return 0
    weeks = {w.performed_on.isocalendar()[:2] for w in workouts}
    streak = 0
    cursor = today
    while cursor.isocalendar()[:2] in weeks:
        streak += 1
        cursor -= dt.timedelta(days=7)
    return streak


@api_view(["GET"])
def progress(request):
    user = request.user
    workouts = list(
        user.workouts.prefetch_related("set_entries__exercise").order_by("performed_on")
    )

    volume_by_date = []
    per_exercise = defaultdict(list)
    for w in workouts:
        vol = 0.0
        top_by_ex = {}
        for s in w.set_entries.all():
            if s.is_warmup:
                continue
            vol += (s.reps or 0) * (s.weight or 0)
            e1rm = s.estimated_1rm
            if e1rm is None:
                continue
            key = s.exercise.name
            if key not in top_by_ex or e1rm > top_by_ex[key]["estimated_1rm"]:
                top_by_ex[key] = {
                    "date": w.performed_on.isoformat(),
                    "estimated_1rm": e1rm,
                    "top_weight": s.weight,
                    "reps": s.reps,
                }
        volume_by_date.append(
            {"date": w.performed_on.isoformat(), "volume": round(vol, 1)}
        )
        for name, point in top_by_ex.items():
            per_exercise[name].append(point)

    # Workouts per ISO week for the last 12 weeks.
    counts = defaultdict(int)
    for w in workouts:
        y, wk, _ = w.performed_on.isocalendar()
        counts[(y, wk)] += 1
    today = dt.date.today()
    weekly = []
    for i in range(11, -1, -1):
        day = today - dt.timedelta(days=7 * i)
        y, wk, _ = day.isocalendar()
        weekly.append({"week": f"{y}-W{wk:02d}", "count": counts.get((y, wk), 0)})

    tracked = [
        {"exercise": name, "points": pts}
        for name, pts in sorted(per_exercise.items())
        if len(pts) >= 1
    ]
    tracked.sort(key=lambda r: len(r["points"]), reverse=True)

    return Response(
        {
            "volume_by_date": volume_by_date,
            "weekly_workouts": weekly,
            "tracked_exercises": tracked,
            "unit": user.profile.unit,
        }
    )
