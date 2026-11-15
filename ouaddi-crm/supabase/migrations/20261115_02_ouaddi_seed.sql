-- =====================================================================
-- Ouaddi Living — 5 sample leads + rendez-vous, to see the CRM working.
-- Run AFTER 20261115_01_ouaddi_schema.sql. Dates are relative to today.
-- To remove them later:  delete from public.leads where source_detail like 'DEMO%';
-- =====================================================================
do $$
declare
  l1 uuid; l2 uuid; l3 uuid; l4 uuid; l5 uuid;
  today timestamptz := date_trunc('day', now() at time zone 'Africa/Casablanca') at time zone 'Africa/Casablanca';
  -- next Saturday (Rabat day)
  sat timestamptz := today + ((6 - extract(dow from now() at time zone 'Africa/Casablanca')::int + 7) % 7) * interval '1 day';
begin
  if exists (select 1 from public.leads where source_detail like 'DEMO%') then
    raise notice 'Démo déjà présente, rien à faire.';
    return;
  end if;

  insert into public.leads (full_name, phone, city, address, source, source_detail, service, stage, estimated_value, notes, created_at)
  values ('Salma Bennani', '212661000001', 'casablanca', 'Maârif, rue Ibnou Mounir', 'meta_ads', 'DEMO — Rideaux lin salon',
          'rideaux', 'rdv_mesures', 8500, 'Salon + 2 chambres, aime le lin naturel.', now() - interval '2 days')
  returning id into l1;
  insert into public.leads (full_name, phone, city, address, source, source_detail, service, stage, estimated_value, notes, created_at)
  values ('Youssef El Amrani', '212662000002', 'rabat', 'Hay Riad, Rabat', 'instagram_auto', 'DEMO — Fauteuils sur mesure',
          'fauteuils', 'contacte', 12000, 'Veut 2 fauteuils velours vert.', now() - interval '5 days')
  returning id into l2;
  insert into public.leads (full_name, phone, city, address, source, source_detail, service, stage, estimated_value, notes, created_at)
  values ('Nadia Tazi', '212663000003', 'casablanca', 'Californie, villa 12', 'whatsapp', 'DEMO — WhatsApp direct',
          'les_deux', 'devis_envoye', 23000, 'Villa : rideaux occultants + 1 canapé.', now() - interval '8 days')
  returning id into l3;
  insert into public.leads (full_name, phone, city, address, source, source_detail, service, stage, estimated_value, notes, created_at)
  values ('Karim Alaoui', '212664000004', 'rabat', 'Agdal, Rabat', 'referral', 'DEMO — Parrainage Nadia',
          'rideaux', 'pose_planifiee', 9800, 'Pose voilages + double rideaux.', now() - interval '15 days')
  returning id into l4;
  insert into public.leads (full_name, phone, city, source, source_detail, service, stage, notes, created_at)
  values ('Imane Chraibi', '212665000005', 'casablanca', 'meta_ads', 'DEMO — Promo automne',
          'rideaux', 'nouveau', 'Demande prix pour baie vitrée 4 m.', now() - interval '3 hours')
  returning id into l5;

  insert into public.appointments (lead_id, type, scheduled_at, city, address, status, notes) values
    (l1, 'mesures',   today + interval '11 hours',          'casablanca', 'Maârif, rue Ibnou Mounir', 'confirme', 'Apporter échantillons lin'),
    (l3, 'visite',    today + interval '16 hours 30 minutes','casablanca', 'Californie, villa 12',     'planifie', 'Présenter le devis'),
    (l2, 'mesures',   sat + interval '10 hours',            'rabat',      'Hay Riad, Rabat',          'planifie', ''),
    (l4, 'pose',      sat + interval '14 hours',            'rabat',      'Agdal, Rabat',             'confirme', 'Prévoir perceuse + tringles'),
    (l3, 'livraison', today + interval '3 days 10 hours',   'casablanca', 'Californie, villa 12',     'planifie', '');

  insert into public.activities (lead_id, type, content, created_at) values
    (l1, 'whatsapp', 'Premier contact via la pub, RDV mesures calé.', now() - interval '2 days'),
    (l2, 'appel',    'Appelé, intéressé, rappeler pour fixer samedi.', now() - interval '5 days'),
    (l3, 'note',     'Devis envoyé : 23 000 DH.', now() - interval '4 days'),
    (l4, 'appel',    'Acompte reçu, pose ce samedi.', now() - interval '1 day');

  -- Youssef: last contact 5 days ago -> shows as "à relancer" (the RDV line added automatically is backdated too).
  update public.activities set created_at = now() - interval '5 days' where lead_id = l2;

  insert into public.tasks (lead_id, title, due_date) values
    (l2, 'Rappeler pour fixer le RDV mesures', current_date),
    (l3, 'Relancer sur le devis', current_date);
end $$;
