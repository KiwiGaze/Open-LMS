ALTER TABLE "wiki_page"
ADD COLUMN "learning_objective_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;

ALTER TABLE "wiki_page_revision"
ADD COLUMN "learning_objective_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;
