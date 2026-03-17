-- ============================================================
-- heyMed! — Queries de referencia
-- ============================================================

-- ── 1. Historial del usuario (con info del caso) ─────────────
select
  a.id,
  a.created_at,
  a.user_answer,
  a.ai_result,
  a.ai_explanation,
  c.description,
  c.difficulty
from attempts a
join cases c on c.id = a.case_id
where a.user_id = auth.uid()
order by a.created_at desc
limit 20;

-- ── 2. Precisión del usuario (via función) ───────────────────
select get_user_accuracy(auth.uid());

-- ── 3. Leaderboard global ────────────────────────────────────
select
  p.username,
  p.score,
  rank() over (order by p.score desc) as rank
from profiles p
order by p.score desc
limit 10;

-- ── 4. Casos por dificultad (sin intentos previos del usuario) ─
select c.*
from cases c
where c.difficulty = 'medium'
  and not exists (
    select 1 from attempts a
    where a.case_id = c.id
      and a.user_id = auth.uid()
  )
order by c.created_at desc;

-- ── 5. Estadísticas por dificultad del usuario ───────────────
select
  c.difficulty,
  count(*)                                        as total,
  count(*) filter (where a.ai_result = 'correct') as correct,
  round(
    count(*) filter (where a.ai_result = 'correct')::numeric
    / count(*) * 100, 1
  )                                               as accuracy_pct
from attempts a
join cases c on c.id = a.case_id
where a.user_id = auth.uid()
  and a.ai_result is not null
group by c.difficulty
order by c.difficulty;

-- ── 6. Insertar intento (antes de llamar Edge Function) ──────
-- Ejecutar desde el cliente, la Edge Function recibe el attempt_id
insert into attempts (user_id, case_id, user_answer)
values (auth.uid(), '<case_id>', '<user_answer>')
returning id;

-- ── 7. Seed de casos de ejemplo ──────────────────────────────
insert into cases (description, correct_diagnosis, difficulty) values
(
  'Paciente masculino de 45 años con dolor torácico opresivo que irradia al brazo izquierdo, diaforesis y disnea de 30 minutos de evolución. ECG muestra elevación del ST en derivaciones II, III y aVF.',
  'Infarto agudo de miocardio con elevación del ST (IAMCEST) de cara inferior',
  'medium'
),
(
  'Mujer de 28 años con fiebre de 38.9°C, disuria, polaquiuria y dolor en fosa renal derecha. Uroanálisis muestra leucocituria y bacteriuria.',
  'Pielonefritis aguda',
  'easy'
),
(
  'Hombre de 60 años con ictericia progresiva, coluria, acolia, pérdida de 8 kg en 3 meses y masa palpable en cuadrante superior derecho. CA 19-9 elevado.',
  'Adenocarcinoma de páncreas (cabeza pancreática)',
  'hard'
);
