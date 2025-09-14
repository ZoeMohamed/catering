-- Create site_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  site_name TEXT NOT NULL DEFAULT 'Catering Aja',
  title TEXT NOT NULL DEFAULT 'Catering Aja - Solusi Katering Anda',
  logo_url TEXT,
  favicon_url TEXT,
  promo_banner_enabled BOOLEAN DEFAULT false,
  promo_banner_text TEXT,
  promo_banner_bg_color TEXT DEFAULT '#dc2626',
  promo_banner_text_color TEXT DEFAULT '#ffffff',
  company_name TEXT,
  company_phone TEXT,
  company_address TEXT
);

-- Insert default settings if not exists
INSERT INTO site_settings (id, site_name, title)
VALUES (1, 'Catering Aja', 'Catering Aja - Solusi Katering Anda')
ON CONFLICT (id) DO NOTHING; 