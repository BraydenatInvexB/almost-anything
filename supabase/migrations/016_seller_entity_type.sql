-- Legal entity type for marketplace sellers

ALTER TABLE sellers ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT 'private_company'
  CHECK (entity_type IN (
    'sole_proprietor',
    'partnership',
    'private_company',
    'public_company',
    'close_corporation',
    'trust',
    'npo',
    'other'
  ));

CREATE INDEX IF NOT EXISTS idx_sellers_entity_type ON sellers(entity_type);
