-- Allow listing owners to choose a primary image by changing image positions.
-- The owner_id cannot be transferred to another user by this policy.

drop policy if exists p_images_update_own on public.listing_images;
create policy p_images_update_own
on public.listing_images
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

