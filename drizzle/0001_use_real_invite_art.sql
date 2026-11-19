-- Passa a usar a arte real do convite em instalações que ainda estão com o SVG padrão.
-- Não sobrescreve uma imagem enviada manualmente pelo painel.
UPDATE "party_settings"
SET "data" = jsonb_set("data", '{inviteImageUrl}', '"/images/convite-luigi-marco.jpg"'::jsonb, true)
WHERE "data"->>'inviteImageUrl' = '/images/convite-padrao.svg';
