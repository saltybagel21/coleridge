# Preserved custom-rule specials builder

This folder contains the exact `SpecialsBuilder.tsx` that was live before the
structured tiered-pricing system was introduced in August 2026.

It is not imported by the website and cannot affect the live admin or public
store. To restore the former local-only custom-rule builder, copy
`SpecialsBuilder.tsx` back to `src/admin/SpecialsBuilder.tsx` and remove the
current re-export. The preserved version creates WhatsApp copy only; it does
not publish pricing to the store or alter cart totals.

