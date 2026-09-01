"""End-to-end API tests. Run with: python manage.py test"""
from django.core.management import call_command
from rest_framework.test import APITestCase


class FitnessApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed", "--demo-user", verbosity=0)

    def auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def test_signup_login_and_me(self):
        r = self.client.post("/api/auth/signup/", {
            "name": "Jordan", "email": "jordan@example.com", "password": "goodpass123",
        }, format="json")
        self.assertEqual(r.status_code, 201)
        token = r.data["token"]
        self.assertFalse(r.data["user"]["profile"]["onboarded"])

        self.auth(token)
        me = self.client.get("/api/auth/me/")
        self.assertEqual(me.data["profile"]["display_name"], "Jordan")

    def test_library_is_seeded_and_filterable(self):
        self.assertEqual(len(self.client.get("/api/exercises/").data), 208)
        self.assertEqual(len(self.client.get("/api/programs/").data), 6)
        cables = self.client.get("/api/exercises/?equipment=cables").data
        self.assertTrue(cables and all(e["equipment"] == "cables" for e in cables))
        squat = self.client.get("/api/exercises/barbell-back-squat/").data
        self.assertIn("youtube", squat["video_embed_url"])
        self.assertTrue(squat["instructions"])

    def test_bodyweight_bands_section(self):
        bw = self.client.get("/api/exercises/?equipment=bodyweight,bands").data
        self.assertEqual(len(bw), 89)
        self.assertTrue(all(e["equipment"] in ("bodyweight", "bands") for e in bw))

        pushup = self.client.get("/api/exercises/push-up/").data
        self.assertEqual(pushup["movement_pattern"], "horizontal_push")
        self.assertEqual(pushup["chain_key"], "push-up")
        self.assertEqual(pushup["regression"]["slug"], "knee-push-up")
        self.assertEqual(pushup["progression"]["slug"], "decline-push-up")

        moves = self.client.get("/api/moves/?equipment=bands").data
        self.assertTrue(moves["patterns"])
        self.assertTrue(all(
            s["equipment"] == "bands"
            for p in moves["patterns"] for c in p["chains"] for s in c["steps"]
        ))

        bwb_programs = self.client.get(
            "/api/programs/?equipment_profile=bodyweight_bands"
        ).data
        self.assertEqual(len(bwb_programs), 3)
        self.assertEqual(
            {p["level"] for p in bwb_programs},
            {"beginner", "intermediate", "advanced"},
        )

    def test_equipment_counts_add_up(self):
        eq = self.client.get("/api/equipment/").data
        self.assertEqual(sum(e["exercise_count"] for e in eq), 208)

    def test_gym_equipment_library(self):
        """Every non-bodyweight/bands category is populated and browsable."""
        gym = ["dumbbells", "barbells", "kettlebells", "machines", "cables",
               "medicine_ball", "stability_ball"]
        rows = self.client.get("/api/exercises/?equipment=" + ",".join(gym)).data
        self.assertEqual(len(rows), 119)
        by_type = {}
        for r in rows:
            by_type[r["equipment"]] = by_type.get(r["equipment"], 0) + 1
        # No category may be empty, or its card would open onto nothing.
        for kind in gym:
            self.assertGreater(by_type.get(kind, 0), 0, f"{kind} has no exercises")
        # Every exercise must carry a form video; that is the core promise.
        self.assertTrue(all(r["video_id"] for r in rows))

    def test_fitness_level_defaults(self):
        defaults = self.client.get("/api/level-defaults/").data
        self.assertEqual(set(defaults), {"beginner", "intermediate", "advanced"})
        self.assertIn("rest_seconds", defaults["intermediate"])

        r = self.client.post("/api/auth/login/", {
            "email": "demo@fitnesscomeback.app", "password": "comeback123",
        }, format="json")
        self.auth(r.data["token"])
        self.client.patch("/api/auth/profile/", {"fitness_level": "advanced"}, format="json")
        dash = self.client.get("/api/dashboard/").data
        self.assertEqual(dash["level_defaults"]["label"], "Advanced")

    def test_log_workout_and_track_progress(self):
        r = self.client.post("/api/auth/login/", {
            "email": "demo@fitnesscomeback.app", "password": "comeback123",
        }, format="json")
        self.auth(r.data["token"])

        payload = {
            "performed_on": "2026-08-28",
            "title": "Test day",
            "set_entries": [
                {"exercise_slug": "barbell-back-squat", "set_number": 1, "reps": 5, "weight": 135},
                {"exercise_slug": "barbell-back-squat", "set_number": 2, "reps": 5, "weight": 135},
            ],
        }
        created = self.client.post("/api/workouts/", payload, format="json")
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data["total_volume"], 1350)

        dash = self.client.get("/api/dashboard/").data
        self.assertGreaterEqual(dash["total_workouts"], 1)

        prog = self.client.get("/api/progress/").data
        self.assertTrue(prog["tracked_exercises"])
        self.assertEqual(len(prog["weekly_workouts"]), 12)

        deleted = self.client.delete(f"/api/workouts/{created.data['id']}/")
        self.assertEqual(deleted.status_code, 204)

    def test_select_program_completes_onboarding(self):
        r = self.client.post("/api/auth/signup/", {
            "name": "Sam", "email": "sam2@example.com", "password": "goodpass123",
        }, format="json")
        self.auth(r.data["token"])
        user = self.client.post("/api/programs/foundation-reset/select/").data
        self.assertTrue(user["profile"]["onboarded"])
        self.assertEqual(user["profile"]["active_program_slug"], "foundation-reset")

    def test_auth_required_for_private_endpoints(self):
        self.assertEqual(self.client.get("/api/dashboard/").status_code, 401)
        self.assertEqual(self.client.get("/api/workouts/").status_code, 401)

    def test_connect_page_renders_qr(self):
        r = self.client.get("/connect")
        self.assertEqual(r.status_code, 200)
        self.assertIn(b"<svg", r.content)          # server-rendered QR code
        self.assertIn(b"Add to Home Screen", r.content)

    def test_spa_shell_served_for_deep_links(self):
        for path in ("/", "/dashboard", "/exercises/barbell-back-squat"):
            r = self.client.get(path)
            self.assertEqual(r.status_code, 200)
            self.assertIn(b'id="app"', r.content)
            self.assertIn(b"apple-mobile-web-app-capable", r.content)
