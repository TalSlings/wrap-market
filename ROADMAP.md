# Roadmap

## Before public launch

1. Complete the deferred color-structure help: one explanation per option and
   a yes/no image pair. The current release intentionally adds no empty info
   icons for these future notes.
2. Move the marketplace to the new address at
   `ksharim-baby.org.il/woven-market`, then update and verify the canonical
   URLs, metadata, Open Graph, robots, sitemap, Supabase Auth redirects and
   sharing previews.
3. Run final end-to-end testing with family and friends on mobile and desktop,
   including login, publishing, editing, favorites, search, contact reveal,
   sharing and all footer links.

## Post-launch: learning resources and beginner FAQ

- Add curated babywearing information sources to the learning page.
- Build a beginner FAQ about woven wraps and ring slings.
- Use the FAQ to direct readers more efficiently to meetings, workshops,
  individual guidance with babywearing instructors and other relevant
  information sources.
- Keep the current launch page focused on learning through meetings, workshops
  and instruction with babywearing instructors until those resources are ready.
- Complete every item tracked in `FAQ_CONTENT_PLAN.md`; keep the existing FAQ
  anchors stable because the form and listing pages link to them.

## Post-launch: delegated admin roles

- Add a less-privileged manager role below the primary administrator role.
- Let the primary administrator grant access to selected admin pages or
  management areas instead of granting access to the entire admin interface.
- Define permissions explicitly and enforce them in database/server checks, not
  only by hiding interface tabs.
- Add a simple interface for granting, reviewing and revoking those permissions.

## Post-launch: verify permanent listing deletion

- Test the complete 60-day deleted-listing lifecycle with controlled test dates.
- Verify that the cron permanently removes both the listing row and its stored
  images after the recovery period.
- Record the result and fix any gap before treating the mechanism as fully
  verified.

## Post-launch: catalog images

- Build an explicit catalog-image flow before allowing users to rely on
  manufacturer or catalog photos.
- Require the seller to mark that an uploaded image is a catalog image and
  confirm that they have permission or another lawful basis to use it.
- Display catalog images clearly as illustrative rather than as evidence of the
  condition of the specific item.
- Keep at least one original photo of the actual item as a publication
  requirement.
- Update the Terms of Use only after the feature is implemented and tested.

## Post-launch: inactive accounts and email notifications

This work was deliberately removed from the launch version. It must not be
described as active in the privacy policy until it is implemented and tested
end to end.

- Reconfirm the final inactivity periods before implementation. The current
  working plan is:
  - accounts without listing history: deletion after 18 months without a
    successful login, with one warning 30 days before deletion;
  - accounts with listing history: deletion after 30 months without a
    successful login, with warnings 30, 7, 3 and 1 day before deletion.
- Keep a successful login as the event that cancels a pending deletion.
- Keep admin and instructor accounts outside automatic inactive-account
  deletion.
- Configure a reliable transactional email sender and verify delivery from the
  production deployment.
- Send a confirmation after an account is deleted, without retaining the
  address after successful delivery.
- Implement bounded retry handling for failed messages and remove retry data
  when it is no longer needed.
- Test both account paths with shortened test dates:
  scheduling, every warning, login cancellation, deletion, confirmation,
  database cleanup and file cleanup.
- Only after all tests pass, update the privacy policy with the final retention
  periods, warning schedule, email behavior and effective date.

## Other future work

- Import from WrapTrack/manufacturer pages.
- Face-cover sticker editor.
- Luxury badge requested per listing and approved by admin.
- New-price / no-longer-sold-new context.
- Full admin UI and contact reveal rate limiting.

