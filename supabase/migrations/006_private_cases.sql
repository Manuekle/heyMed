-- ============================================================
-- heyMed! — Casos privados por usuario + 3 casos default
-- ============================================================

-- 1. Agregar columnas a cases
alter table cases
  add column if not exists user_id    uuid references auth.users(id) on delete cascade,
  add column if not exists is_default boolean not null default false;

-- 2. Reemplazar policies de cases
drop policy if exists "cases_public_read"      on cases;
drop policy if exists "auth_users_insert_cases" on cases;

-- SELECT: usuario ve sus propios casos + los default del sistema
create policy "cases_private_read" on cases
  for select using (is_default = true OR user_id = auth.uid());

-- INSERT: usuario solo puede insertar con su propio user_id
create policy "cases_own_insert" on cases
  for insert with check (auth.uid() = user_id);

-- 3. Insertar los 3 casos default del sistema
insert into cases (description, correct_diagnosis, difficulty, system, is_default, user_id) values
(
  'Mujer de 28 años con fiebre de 38.9°C, disuria, polaquiuria y dolor en fosa renal derecha. Uroanálisis muestra leucocituria y bacteriuria.',
  'Pielonefritis aguda',
  'easy',
  'otro',
  true,
  null
),
(
  'Paciente masculino de 45 años con dolor torácico opresivo que irradia al brazo izquierdo, diaforesis y disnea de 30 minutos de evolución. ECG muestra elevación del ST en derivaciones II, III y aVF.',
  'Infarto agudo de miocardio con elevación del ST (IAMCEST) de cara inferior',
  'medium',
  'cardio',
  true,
  null
),
(
  'Hombre de 60 años con ictericia progresiva, coluria, acolia, pérdida de 8 kg en 3 meses y masa palpable en cuadrante superior derecho. CA 19-9 elevado.',
  'Adenocarcinoma de páncreas (cabeza pancreática)',
  'hard',
  'gastro',
  true,
  null
);
