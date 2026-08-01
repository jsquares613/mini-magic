-- Allow play-area gallery items to carry a video in place of an image.
-- All other tables already use nullable text columns for their media fields.
alter table play_area_gallery alter column image_url drop not null;
