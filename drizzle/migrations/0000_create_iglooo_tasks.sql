CREATE TABLE public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.workers TO anon;
GRANT ALL ON public.workers TO service_role;

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers are readable by everyone" ON public.workers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add workers" ON public.workers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update workers" ON public.workers FOR UPDATE TO anon, authenticated USING (true);

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  image_url TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tasks TO anon;
GRANT ALL ON public.tasks TO service_role;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks are readable by everyone" ON public.tasks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create tasks" ON public.tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update tasks" ON public.tasks FOR UPDATE TO anon, authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workers;

INSERT INTO public.workers (id, name, avatar) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Carlos Pérez', 'https://api.dicebear.com/7.x/bottts/svg?seed=Carlos'),
  ('22222222-2222-2222-2222-222222222222', 'Ana Gómez', 'https://api.dicebear.com/7.x/bottts/svg?seed=Ana'),
  ('33333333-3333-3333-3333-333333333333', 'Luis Martínez', 'https://api.dicebear.com/7.x/bottts/svg?seed=Luis');

INSERT INTO public.tasks (title, description, assigned_to, status, priority, image_url) VALUES
  ('Inspeccionar tablero eléctrico principal', 'Medir voltajes de entrada y revisar interruptores de seguridad.', ARRAY['11111111-1111-1111-1111-111111111111']::uuid[], 'pending', 'high', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'),
  ('Limpieza de área de empaque', 'Desinfectar mesa central y ordenar insumos.', '{}', 'pending', 'medium', NULL),
  ('Revisar niveles de refrigerante', 'Verificar presión y registrar lectura en la bitácora.', '{}', 'pending', 'low', NULL);
