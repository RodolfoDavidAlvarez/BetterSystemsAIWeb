CREATE TABLE IF NOT EXISTS reviews (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  client_id integer REFERENCES clients(id),
  project_id integer REFERENCES projects(id),
  phase text,
  reviewer_name text NOT NULL,
  reviewer_email text NOT NULL,
  company_name text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  is_public boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'phase-survey',
  submitted_at timestamp NOT NULL DEFAULT NOW(),
  created_at timestamp NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT NOW()
);
