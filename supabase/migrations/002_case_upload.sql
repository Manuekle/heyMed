-- ============================================================
-- heyMed! — Permitir a usuarios autenticados subir casos
-- ============================================================

-- Usuarios autenticados pueden insertar casos
create policy "auth_users_insert_cases" on cases
  for insert with check (auth.uid() is not null);
