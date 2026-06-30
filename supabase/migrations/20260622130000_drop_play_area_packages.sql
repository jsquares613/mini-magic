-- Packages feature removed entirely (product decision, not a hide/disable) —
-- drop the FK column on enquiries first, then the table it pointed to.
alter table enquiries drop column if exists package_id;
drop table if exists play_area_packages;
