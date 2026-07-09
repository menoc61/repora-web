CREATE TABLE IF NOT EXISTS "templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "category" text NOT NULL,
    "description" text,
    "sections" jsonb DEFAULT '[]'::jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
);
