# Roadmap

- Import from WrapTrack/manufacturer pages.
- Face-cover sticker editor.
- Luxury badge requested per listing and approved by admin.
- New-price / no-longer-sold-new context.

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

- Full admin UI and contact reveal rate limiting.
