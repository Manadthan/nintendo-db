-- Contrôle du 20/11/2026 (Virtual Boy) : données fausses en production, corrigées une fois.
-- Données seulement : aucun changement de schéma.

-- 1. Développeurs collés par l'ancienne lecture des listes Wikipédia à cartouches (« Hudson SoftRaizing ») :
--    la cellule était lue comme un seul texte au lieu d'une liste à puces (corrigé dans wikipedia-cartouches.ts).
--    Seule la valeur collée exacte est remplacée : une correction faite à la main n'est jamais touchée.
--    Mario's Tennis portait « $1e » (origine inconnue).
update public.games g
set developpeur = v.nouveau, updated_at = now()
from (values
  ('gb', 'alleyway', 'Nintendo R&D1Intelligent Systems', 'Nintendo R&D1, Intelligent Systems'),
  ('gb', 'alleyway', 'Nintendo R&D1 Intelligent Systems', 'Nintendo R&D1, Intelligent Systems'),
  ('gb', 'balloon-kid', 'Nintendo R&D1Pax Softnica', 'Nintendo R&D1, Pax Softnica'),
  ('gb', 'balloon-kid', 'Nintendo R&D1 Pax Softnica', 'Nintendo R&D1, Pax Softnica'),
  ('gb', 'bomberman-gb', 'S-PlanA.I', 'S-Plan, A.I'),
  ('gb', 'bomberman-gb', 'S-Plan A.I', 'S-Plan, A.I'),
  ('gb', 'donkey-kong', 'Nintendo EADPax Softnica', 'Nintendo EAD, Pax Softnica'),
  ('gb', 'donkey-kong', 'Nintendo EAD Pax Softnica', 'Nintendo EAD, Pax Softnica'),
  ('gb', 'game-watch-gallery', 'Nintendo R&D1TOSE', 'Nintendo R&D1, TOSE'),
  ('gb', 'game-watch-gallery', 'Nintendo R&D1 TOSE', 'Nintendo R&D1, TOSE'),
  ('gb', 'golf', 'Nintendo R&D2HAL Laboratory', 'Nintendo R&D2, HAL Laboratory'),
  ('gb', 'golf', 'Nintendo R&D2 HAL Laboratory', 'Nintendo R&D2, HAL Laboratory'),
  ('gb', 'kid-icarus-of-myths-and-monsters', 'Nintendo R&D1TOSE', 'Nintendo R&D1, TOSE'),
  ('gb', 'kid-icarus-of-myths-and-monsters', 'Nintendo R&D1 TOSE', 'Nintendo R&D1, TOSE'),
  ('gb', 'kirbys-block-ball', 'TOSENintendo R&D1', 'TOSE, Nintendo R&D1'),
  ('gb', 'kirbys-block-ball', 'TOSE Nintendo R&D1', 'TOSE, Nintendo R&D1'),
  ('gb', 'marios-picross', 'JupiterApe', 'Jupiter, Ape'),
  ('gb', 'marios-picross', 'Jupiter Ape', 'Jupiter, Ape'),
  ('gb', 'mole-mania', 'Pax SoftnicaNintendo EAD', 'Pax Softnica, Nintendo EAD'),
  ('gb', 'mole-mania', 'Pax Softnica Nintendo EAD', 'Pax Softnica, Nintendo EAD'),
  ('gb', 'picross-2', 'JupiterCreatures Inc.', 'Jupiter, Creatures Inc.'),
  ('gb', 'picross-2', 'Jupiter Creatures Inc.', 'Jupiter, Creatures Inc.'),
  ('gb', 'radar-mission', 'Nintendo R&D1Pax Softnica', 'Nintendo R&D1, Pax Softnica'),
  ('gb', 'radar-mission', 'Nintendo R&D1 Pax Softnica', 'Nintendo R&D1, Pax Softnica'),
  ('gb', 'solar-striker', 'Nintendo R&D1Minakuchi Engineering', 'Nintendo R&D1, Minakuchi Engineering'),
  ('gb', 'solar-striker', 'Nintendo R&D1 Minakuchi Engineering', 'Nintendo R&D1, Minakuchi Engineering'),
  ('gb', 'tennis', 'Nintendo R&D1Intelligent Systems', 'Nintendo R&D1, Intelligent Systems'),
  ('gb', 'tennis', 'Nintendo R&D1 Intelligent Systems', 'Nintendo R&D1, Intelligent Systems'),
  ('gb', 'tetris-2', 'Nintendo R&D1TOSE', 'Nintendo R&D1, TOSE'),
  ('gb', 'tetris-2', 'Nintendo R&D1 TOSE', 'Nintendo R&D1, TOSE'),
  ('gb', 'tetris-blast', 'Bullet-Proof SoftwareTOSE', 'Bullet-Proof Software, TOSE'),
  ('gb', 'tetris-blast', 'Bullet-Proof Software TOSE', 'Bullet-Proof Software, TOSE'),
  ('gb', 'tetris-plus', 'Natsume Co.Ltd.', 'Natsume Co., Ltd.'),
  ('gb', 'tetris-plus', 'Natsume Co. Ltd.', 'Natsume Co., Ltd.'),
  ('gb', 'wave-race', 'Pax SoftnicaNintendo EAD', 'Pax Softnica, Nintendo EAD'),
  ('gb', 'wave-race', 'Pax Softnica Nintendo EAD', 'Pax Softnica, Nintendo EAD'),
  ('gb', 'x', 'Argonaut GamesNintendo R&D1', 'Argonaut Games, Nintendo R&D1'),
  ('gb', 'x', 'Argonaut Games Nintendo R&D1', 'Argonaut Games, Nintendo R&D1'),
  ('vb', 'marios-tennis', 'Nintendo R&D1Tose', 'Nintendo R&D1, Tose'),
  ('vb', 'marios-tennis', 'Nintendo R&D1 Tose', 'Nintendo R&D1, Tose'),
  ('vb', 'panic-bomber', 'Hudson SoftRaizing', 'Hudson Soft, Raizing'),
  ('vb', 'panic-bomber', 'Hudson Soft Raizing', 'Hudson Soft, Raizing'),
  ('n64', 'the-new-tetris', 'H2O EntertainmentBlue Planet Software', 'H2O Entertainment, Blue Planet Software'),
  ('n64', 'the-new-tetris', 'H2O Entertainment Blue Planet Software', 'H2O Entertainment, Blue Planet Software'),
  ('n64', 'pilotwings-64', 'Nintendo EADNintendo R&D3Paradigm Simulation', 'Nintendo EAD, Nintendo R&D3, Paradigm Simulation'),
  ('n64', 'pilotwings-64', 'Nintendo EAD Nintendo R&D3 Paradigm Simulation', 'Nintendo EAD, Nintendo R&D3, Paradigm Simulation'),
  ('n64', 'starcraft-64', 'Blizzard EntertainmentMass Media', 'Blizzard Entertainment, Mass Media'),
  ('n64', 'starcraft-64', 'Blizzard Entertainment Mass Media', 'Blizzard Entertainment, Mass Media'),
  ('n64', 'star-wars-rogue-squadron', 'Factor 5LucasArts', 'Factor 5, LucasArts'),
  ('n64', 'star-wars-rogue-squadron', 'Factor 5 LucasArts', 'Factor 5, LucasArts'),
  ('gbc', 'pokemon-pinball', 'HAL LaboratoryJupiter Corporation', 'HAL Laboratory, Jupiter Corporation'),
  ('gbc', 'pokemon-pinball', 'HAL Laboratory Jupiter Corporation', 'HAL Laboratory, Jupiter Corporation'),
  ('gbc', 'pokemon-trading-card-game', 'Hudson SoftCreatures Inc.', 'Hudson Soft, Creatures Inc.'),
  ('gbc', 'pokemon-trading-card-game', 'Hudson Soft Creatures Inc.', 'Hudson Soft, Creatures Inc.'),
  ('gbc', 'toreedo-batoru-kaado-hiiroo', 'Nintendo R&D1Intelligent Systems', 'Nintendo R&D1, Intelligent Systems'),
  ('gbc', 'toreedo-batoru-kaado-hiiroo', 'Nintendo R&D1 Intelligent Systems', 'Nintendo R&D1, Intelligent Systems'),
  ('gba', 'disneys-magical-quest-starring-mickey-minnie', 'CapcomNintendo', 'Capcom, Nintendo'),
  ('gba', 'disneys-magical-quest-starring-mickey-minnie', 'Capcom Nintendo', 'Capcom, Nintendo'),
  ('gba', 'koro-koro-puzzle-happy-panechu', 'Mobile21Nintendo R&D2', 'Mobile21, Nintendo R&D2'),
  ('gba', 'koro-koro-puzzle-happy-panechu', 'Mobile21 Nintendo R&D2', 'Mobile21, Nintendo R&D2'),
  ('snes', 'bubsy-in-claws-encounters-of-the-furred-kind', 'AccoladeSolid Software', 'Accolade, Solid Software'),
  ('snes', 'bubsy-in-claws-encounters-of-the-furred-kind', 'Accolade Solid Software', 'Accolade, Solid Software'),
  ('snes', 'earthbound', 'ApeHAL Laboratory', 'Ape, HAL Laboratory'),
  ('snes', 'earthbound', 'Ape HAL Laboratory', 'Ape, HAL Laboratory'),
  ('snes', 'kirbys-avalanche', 'HAL Laboratory (Kirby''s Avalanche/Kirby''s Ghost Trap only)Compile', 'HAL Laboratory (Kirby''s Avalanche/Kirby''s Ghost Trap only), Compile'),
  ('snes', 'kirbys-avalanche', 'HAL Laboratory (Kirby''s Avalanche/Kirby''s Ghost Trap only) Compile', 'HAL Laboratory (Kirby''s Avalanche/Kirby''s Ghost Trap only), Compile'),
  ('snes', 'kirbys-dream-course', 'HAL LaboratoryNintendo EAD', 'HAL Laboratory, Nintendo EAD'),
  ('snes', 'kirbys-dream-course', 'HAL Laboratory Nintendo EAD', 'HAL Laboratory, Nintendo EAD'),
  ('snes', 'mario-no-super-picross', 'ApeJupiter', 'Ape, Jupiter'),
  ('snes', 'mario-no-super-picross', 'Ape Jupiter', 'Ape, Jupiter'),
  ('snes', 'mario-paint', 'Nintendo R&D1Intelligent Systems', 'Nintendo R&D1, Intelligent Systems'),
  ('snes', 'mario-paint', 'Nintendo R&D1 Intelligent Systems', 'Nintendo R&D1, Intelligent Systems'),
  ('snes', 'power-lode-runner-ja', 'Atelier DoubleAeon', 'Atelier Double, Aeon'),
  ('snes', 'power-lode-runner-ja', 'Atelier Double Aeon', 'Atelier Double, Aeon'),
  ('snes', 'simcity', 'Nintendo EADIntelligent Systems', 'Nintendo EAD, Intelligent Systems'),
  ('snes', 'simcity', 'Nintendo EAD Intelligent Systems', 'Nintendo EAD, Intelligent Systems'),
  ('snes', 'star-fox', 'Nintendo EADArgonaut Software', 'Nintendo EAD, Argonaut Software'),
  ('snes', 'star-fox', 'Nintendo EAD Argonaut Software', 'Nintendo EAD, Argonaut Software'),
  ('snes', 'stunt-race-fx', 'Nintendo EADArgonaut Software', 'Nintendo EAD, Argonaut Software'),
  ('snes', 'stunt-race-fx', 'Nintendo EAD Argonaut Software', 'Nintendo EAD, Argonaut Software'),
  ('snes', 'super-metroid', 'Nintendo R&D1Intelligent Systems', 'Nintendo R&D1, Intelligent Systems'),
  ('snes', 'super-metroid', 'Nintendo R&D1 Intelligent Systems', 'Nintendo R&D1, Intelligent Systems'),
  ('snes', 'super-punch-out', 'Nintendo R&D3Locomotive Corporation', 'Nintendo R&D3, Locomotive Corporation'),
  ('snes', 'super-punch-out', 'Nintendo R&D3 Locomotive Corporation', 'Nintendo R&D3, Locomotive Corporation'),
  ('snes', 'super-scope-6', 'Nintendo R&D1Intelligent Systems', 'Nintendo R&D1, Intelligent Systems'),
  ('snes', 'super-scope-6', 'Nintendo R&D1 Intelligent Systems', 'Nintendo R&D1, Intelligent Systems'),
  ('snes', 'warios-woods', 'NintendoIntelligent Systems', 'Nintendo, Intelligent Systems'),
  ('snes', 'warios-woods', 'Nintendo Intelligent Systems', 'Nintendo, Intelligent Systems'),
  ('snes', 'wrecking-crew-98', 'Nintendo R&D1Pax Softonica', 'Nintendo R&D1, Pax Softonica'),
  ('snes', 'wrecking-crew-98', 'Nintendo R&D1 Pax Softonica', 'Nintendo R&D1, Pax Softonica'),
  ('vb', 'marios-tennis', '$1e', 'Nintendo R&D1, Tose')
) as v (console, slug, ancien, nouveau)
join public.consoles c on c.slug = v.console
where g.console_id = c.id and g.slug = v.slug and g.developpeur = v.ancien;

-- 2. 3D Tetris (Virtual Boy) n'est jamais sorti au Japon (Wikipédia : « —N/a ») ; la base le disait sorti, sans date.
update public.releases r
set sortie = false, titre = null, titre_romanise = null, date_sortie = null, precision_date = null,
    editeur = null, code_produit = null, updated_at = now()
from public.games g
join public.consoles c on c.id = g.console_id
where r.game_id = g.id and c.slug = 'vb' and g.slug = '3d-tetris'
  and r.region = 'JAP' and r.sortie and r.date_sortie is null and r.jaquette_path is null;
