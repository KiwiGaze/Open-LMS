ALTER TABLE "discussion_post" ADD CONSTRAINT "discussion_post_status_check" CHECK ("discussion_post"."status" IN ('draft', 'published', 'hidden', 'deleted'));
