-- Étape 30 (ADR-21 point 3) : un amiibo vu seulement chez Nintendo Europe (Resident Evil, Pragmata… : ni AmiiboAPI ni
-- la liste Nintendo US) reçoit l'identifiant « eu:{nom} ». La migration 0033 n'acceptait que les 16 chiffres
-- hexadécimaux d'AmiiboAPI ou « us:{slug} ».
alter table public.amiibo drop constraint amiibo_identifiant_check;
alter table public.amiibo add constraint amiibo_identifiant_check
  check (identifiant ~ '^([0-9a-f]{16}|(us|eu):[a-z0-9-]{1,120})$');

alter table public.amiibo_exclus drop constraint amiibo_exclus_identifiant_check;
alter table public.amiibo_exclus add constraint amiibo_exclus_identifiant_check
  check (identifiant ~ '^([0-9a-f]{16}|(us|eu):[a-z0-9-]{1,120})$');
