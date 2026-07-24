-- Offers hero banner is image-only now — drop the text fields, keep image/active.
alter table offer_banner
  drop column if exists badge_text,
  drop column if exists heading,
  drop column if exists subheading,
  drop column if exists terms_text;
