ALTER TABLE "course_module_release_rule"
  ADD CONSTRAINT "course_module_release_rule_manual_unlock_target_check"
  CHECK (NOT ("rule_type" = 'manual_unlock' AND "target_type" <> 'module'));
