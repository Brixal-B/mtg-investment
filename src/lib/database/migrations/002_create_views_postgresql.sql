-- Migration 002: Create views
-- PostgreSQL version

-- Current prices view (latest pricing data)
CREATE OR REPLACE VIEW current_prices AS
SELECT 
    p.card_uuid,
    c.name,
    c.set_code,
    c.set_name,
    p.price as latest_price,
    p.price_date,
    p.source,
    p.variant
FROM price_history p
INNER JOIN cards c ON p.card_uuid = c.uuid
INNER JOIN (
    SELECT 
        card_uuid, 
        source, 
        variant, 
        MAX(price_date) as max_date
    FROM price_history
    GROUP BY card_uuid, source, variant
) latest ON p.card_uuid = latest.card_uuid 
    AND p.source = latest.source 
    AND p.variant = latest.variant 
    AND p.price_date = latest.max_date;

-- Cards with prices view (joined card and price information)
CREATE OR REPLACE VIEW cards_with_prices AS
SELECT 
    c.uuid,
    c.name,
    c.set_code,
    c.set_name,
    c.rarity,
    c.type_line,
    c.mana_cost,
    c.cmc,
    c.oracle_text,
    c.image_url,
    cp.latest_price,
    cp.price_date,
    cp.source as price_source,
    cp.variant as price_variant
FROM cards c
LEFT JOIN current_prices cp ON c.uuid = cp.card_uuid
    AND cp.source = 'tcgplayer' 
    AND cp.variant = 'normal';