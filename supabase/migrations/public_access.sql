-- Permitir que cualquiera (anon) vea los anuncios
-- Esto es seguro porque solo permitimos SELECT, no INSERT/UPDATE/DELETE
CREATE POLICY "Anuncios públicos para todos"
ON ads FOR SELECT
TO anon
USING (true);

-- Asegurar que la tabla tenga RLS activado
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
