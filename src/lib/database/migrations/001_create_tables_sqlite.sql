-- Migration 001: Create core tables
-- SQLite version

-- Card sets table (normalized set information)
CREATE TABLE IF NOT EXISTS card_sets (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    release_date DATE,
    card_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cards table (based on MTGCard interface)
CREATE TABLE IF NOT EXISTS cards (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    set_code TEXT NOT NULL,
    set_name TEXT NOT NULL,
    rarity TEXT,
    type_line TEXT,
    mana_cost TEXT,
    cmc INTEGER,
    oracle_text TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (set_code) REFERENCES card_sets(code)
);

-- Price history table (time-series data for MTGCardPrices)
CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_uuid TEXT NOT NULL,
    price_date DATE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    source TEXT NOT NULL DEFAULT 'tcgplayer',
    variant TEXT NOT NULL DEFAULT 'normal', -- normal, foil
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_uuid) REFERENCES cards(uuid),
    UNIQUE(card_uuid, price_date, source, variant)
);

-- Import logs table (tracking for admin endpoints)
CREATE TABLE IF NOT EXISTS import_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_type TEXT NOT NULL, -- 'mtgjson', 'cardsphere_csv', etc.
    status TEXT NOT NULL, -- 'started', 'completed', 'failed'
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    metadata TEXT -- JSON for additional import details
);

-- Strategic indexes for performance
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
CREATE INDEX IF NOT EXISTS idx_cards_set_code ON cards(set_code);
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);
CREATE INDEX IF NOT EXISTS idx_cards_name_set ON cards(name, set_code);

CREATE INDEX IF NOT EXISTS idx_price_history_card_date ON price_history(card_uuid, price_date);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(price_date);
CREATE INDEX IF NOT EXISTS idx_price_history_source_variant ON price_history(source, variant);

CREATE INDEX IF NOT EXISTS idx_card_sets_release_date ON card_sets(release_date);

CREATE INDEX IF NOT EXISTS idx_import_logs_type_status ON import_logs(import_type, status);
CREATE INDEX IF NOT EXISTS idx_import_logs_started_at ON import_logs(started_at);

-- Update trigger for cards table
CREATE TRIGGER IF NOT EXISTS update_cards_timestamp 
    AFTER UPDATE ON cards
    FOR EACH ROW
BEGIN
    UPDATE cards SET updated_at = CURRENT_TIMESTAMP WHERE uuid = NEW.uuid;
END;

-- Update trigger for card_sets table
CREATE TRIGGER IF NOT EXISTS update_card_sets_timestamp 
    AFTER UPDATE ON card_sets
    FOR EACH ROW
BEGIN
    UPDATE card_sets SET updated_at = CURRENT_TIMESTAMP WHERE code = NEW.code;
END;