from django.contrib import admin

from .models import (
    Exercise,
    Profile,
    Program,
    ProgramDay,
    ProgramSlot,
    SetEntry,
    Workout,
)


class ProgramSlotInline(admin.TabularInline):
    model = ProgramSlot
    extra = 0


class ProgramDayInline(admin.StackedInline):
    model = ProgramDay
    extra = 0


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = (
        "name", "equipment", "difficulty", "movement_pattern", "chain_key", "chain_order"
    )
    list_filter = ("equipment", "difficulty", "movement_pattern", "needs_anchor")
    search_fields = ("name", "slug", "chain_key")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("movement_pattern", "chain_key", "chain_order")


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ("name", "weeks", "days_per_week", "level", "order_index")
    inlines = [ProgramDayInline]


@admin.register(ProgramDay)
class ProgramDayAdmin(admin.ModelAdmin):
    list_display = ("program", "day_index", "name")
    inlines = [ProgramSlotInline]


class SetEntryInline(admin.TabularInline):
    model = SetEntry
    extra = 0


@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ("user", "performed_on", "program", "program_day")
    list_filter = ("program",)
    date_hierarchy = "performed_on"
    inlines = [SetEntryInline]


admin.site.register(Profile)
