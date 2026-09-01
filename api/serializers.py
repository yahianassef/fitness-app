from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import (
    Exercise,
    Profile,
    Program,
    ProgramDay,
    ProgramSlot,
    SetEntry,
    Workout,
)


# --------------------------------------------------------------------------- #
#  Auth / profile
# --------------------------------------------------------------------------- #
class ProfileSerializer(serializers.ModelSerializer):
    active_program_slug = serializers.SlugRelatedField(
        source="active_program",
        slug_field="slug",
        queryset=Program.objects.all(),
        allow_null=True,
        required=False,
    )
    active_program_name = serializers.CharField(
        source="active_program.name", read_only=True, default=None
    )

    class Meta:
        model = Profile
        fields = [
            "display_name",
            "goal",
            "experience",
            "fitness_level",
            "months_off",
            "days_per_week",
            "unit",
            "onboarded",
            "active_program_slug",
            "active_program_name",
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ["id", "username", "email", "profile"]


class SignupSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        # A post_save signal on User creates the Profile; just set the name.
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.display_name = validated_data["name"]
        profile.save()
        return user


# --------------------------------------------------------------------------- #
#  Exercise library
# --------------------------------------------------------------------------- #
class ExerciseListSerializer(serializers.ModelSerializer):
    equipment_label = serializers.CharField(source="get_equipment_display", read_only=True)
    movement_pattern_label = serializers.CharField(
        source="get_movement_pattern_display", read_only=True
    )
    needs_anchor_label = serializers.CharField(
        source="get_needs_anchor_display", read_only=True
    )

    class Meta:
        model = Exercise
        fields = [
            "slug",
            "name",
            "equipment",
            "equipment_label",
            "difficulty",
            "primary_muscles",
            "secondary_muscles",
            "summary",
            "video_id",
            "video_provider",
            "is_compound",
            "beginner_friendly",
            "movement_pattern",
            "movement_pattern_label",
            "chain_key",
            "chain_order",
            "needs_anchor",
            "needs_anchor_label",
            "is_unilateral",
        ]


class _ChainLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ["slug", "name", "difficulty"]


class ExerciseDetailSerializer(ExerciseListSerializer):
    video_embed_url = serializers.CharField(read_only=True)
    video_watch_url = serializers.CharField(read_only=True)
    scaling_lever_label = serializers.CharField(
        source="get_scaling_lever_display", read_only=True
    )
    regression = _ChainLinkSerializer(read_only=True)
    progression = _ChainLinkSerializer(read_only=True)

    class Meta(ExerciseListSerializer.Meta):
        fields = ExerciseListSerializer.Meta.fields + [
            "instructions",
            "form_tips",
            "common_mistakes",
            "video_title",
            "video_embed_url",
            "video_watch_url",
            "scaling_lever",
            "scaling_lever_label",
            "regression",
            "progression",
        ]


# --------------------------------------------------------------------------- #
#  Programs
# --------------------------------------------------------------------------- #
class ProgramSlotSerializer(serializers.ModelSerializer):
    exercise = ExerciseListSerializer(read_only=True)

    class Meta:
        model = ProgramSlot
        fields = [
            "id",
            "order_index",
            "sets",
            "rep_scheme",
            "rest_seconds",
            "coach_note",
            "exercise",
        ]


class ProgramDaySerializer(serializers.ModelSerializer):
    slots = ProgramSlotSerializer(many=True, read_only=True)

    class Meta:
        model = ProgramDay
        fields = ["id", "day_index", "name", "focus", "slots"]


class ProgramListSerializer(serializers.ModelSerializer):
    day_count = serializers.IntegerField(source="days.count", read_only=True)

    class Meta:
        model = Program
        fields = [
            "slug",
            "name",
            "subtitle",
            "description",
            "weeks",
            "days_per_week",
            "level",
            "focus",
            "equipment_used",
            "equipment_profile",
            "day_count",
        ]


class ProgramDetailSerializer(ProgramListSerializer):
    days = ProgramDaySerializer(many=True, read_only=True)

    class Meta(ProgramListSerializer.Meta):
        fields = ProgramListSerializer.Meta.fields + ["weekly_progression", "days"]


# --------------------------------------------------------------------------- #
#  Workout log
# --------------------------------------------------------------------------- #
class SetEntrySerializer(serializers.ModelSerializer):
    exercise_slug = serializers.SlugRelatedField(
        source="exercise", slug_field="slug", queryset=Exercise.objects.all()
    )
    exercise_name = serializers.CharField(source="exercise.name", read_only=True)
    estimated_1rm = serializers.FloatField(read_only=True)

    class Meta:
        model = SetEntry
        fields = [
            "id",
            "exercise_slug",
            "exercise_name",
            "set_number",
            "reps",
            "weight",
            "is_warmup",
            "completed",
            "estimated_1rm",
        ]


class WorkoutSerializer(serializers.ModelSerializer):
    set_entries = SetEntrySerializer(many=True)
    program_slug = serializers.SlugRelatedField(
        source="program",
        slug_field="slug",
        queryset=Program.objects.all(),
        required=False,
        allow_null=True,
    )
    program_name = serializers.CharField(source="program.name", read_only=True, default=None)
    program_day_name = serializers.CharField(
        source="program_day.name", read_only=True, default=None
    )
    total_volume = serializers.FloatField(read_only=True)

    class Meta:
        model = Workout
        fields = [
            "id",
            "performed_on",
            "program_slug",
            "program_name",
            "program_day",
            "program_day_name",
            "title",
            "notes",
            "perceived_effort",
            "total_volume",
            "set_entries",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def create(self, validated_data):
        sets_data = validated_data.pop("set_entries", [])
        workout = Workout.objects.create(user=self.context["request"].user, **validated_data)
        for row in sets_data:
            SetEntry.objects.create(workout=workout, **row)
        return workout

    def update(self, instance, validated_data):
        sets_data = validated_data.pop("set_entries", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if sets_data is not None:
            instance.set_entries.all().delete()
            for row in sets_data:
                SetEntry.objects.create(workout=instance, **row)
        return instance
