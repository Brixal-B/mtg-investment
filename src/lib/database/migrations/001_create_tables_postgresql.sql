-- Migration 001: Create core tables
-- PostgreSQL version

-- Card sets table (normalized set information)
CREATE TABLE IF NOT EXISTS card_sets (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    release_date DATE,
    card_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cards table (based on MTGCard interface)
CREATE TABLE IF NOT EXISTS cards (
    uuid VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    set_code VARCHAR(10) NOT NULL,
    set_name VARCHAR(255) NOT NULL,
    rarity VARCHAR(20),
    type_line TEXT,
    mana_cost VARCHAR(50),
    cmc INTEGER,
    oracle_text TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (set_code) REFERENCES card_sets(code)
);

-- Price history table (time-series data for MTGCardPrices)
CREATE TABLE IF NOT EXISTS price_history (
    id BIGSERIAL PRIMARY KEY,
    card_uuid VARCHAR(36) NOT NULL,
    price_date DATE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'tcgplayer',
    variant VARCHAR(20) NOT NULL DEFAULT 'normal', -- normal, foil
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_uuid) REFERENCES cards(uuid),
    UNIQUE(card_uuid, price_date, source, variant)
);

-- Import logs table (tracking for admin endpoints)
CREATE TABLE IF NOT EXISTS import_logs (
    id BIGSERIAL PRIMARY KEY,
    import_type VARCHAR(50) NOT NULL, -- 'mtgjson', 'cardsphere_csv', etc.
    status VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB -- JSON for additional import details
);

-- Strategic indexes for performance
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
CREATE INDEX IF NOT EXISTS idx_cards_set_code ON cards(set_code);
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);
CREATE INDEX IF NOT EXISTS idx_cards_name_set ON cards(name, set_code);

CREATE INDEX IF NOT EXISTS idx_price_history_card_date ON price_history(card_uuid, price_date);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(price_date);
CREATE INDEX IF NOT EXISTS idx_price_history_source_variant ON price_history(source, variant);
CREATE INDEX IF NOT EXISTS idx_price_history_card_date_desc ON price_history(card_uuid, price_date DESC);

CREATE INDEX IF NOT EXISTS idx_card_sets_release_date ON card_sets(release_date);

CREATE INDEX IF NOT EXISTS idx_import_logs_type_status ON import_logs(import_type, status);
CREATE INDEX IF NOT EXISTS idx_import_logs_started_at ON import_logs(started_at);

-- Update trigger function for cards table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update triggers
DROP TRIGGER IF EXISTS update_cards_timestamp ON cards;
CREATE TRIGGER update_cards_timestamp 
    BEFORE UPDATE ON cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_card_sets_timestamp ON card_sets;
CREATE TRIGGER update_card_sets_timestamp 
    BEFORE UPDATE ON card_sets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();