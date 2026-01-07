# Cloudinary Migration Report

**Date:** January 7, 2026
**Status:** Complete

---

## Summary

All image attachments have been migrated from legacy storage to the client's Cloudinary account.

| Metric | Value |
|--------|-------|
| Total attachments processed | 831 |
| Successfully migrated | 829 |
| Failed (corrupted files) | 2 |
| Target Cloudinary account | `dmdlf5lkx` |

---

## Migration Details

### Source Storage
- **Legacy Cloudinary** (`dt0a6xpny`): 829 images migrated
- **R2 Storage**: 2 corrupted HEIC files (deleted from database)

### Failed Files
These files were empty/corrupted on the source and have been removed from the database:
- `IMG_6172.HEIC` (cmjdiezjr000dl804q7p1d6bb)
- `IMG_6173.HEIC` (cmjdiezx6000fl804x8z5nzsh)

---

## Current Architecture

```
Image Uploads:
├── New uploads → Cloudinary (dmdlf5lkx)
│   ├── JPEG, PNG, GIF, WebP
│   └── HEIC/HEIF (auto-converted to JPEG)
│
Document Uploads:
└── PDF, DOC, etc. → Cloudflare R2
```

---

## Environment Variables

### Required (in production)
```env
CLOUDINARY_CLOUD_NAME=dmdlf5lkx
CLOUDINARY_API_KEY=534823466531897
CLOUDINARY_API_SECRET=<secret>

R2_ACCOUNT_ID=<id>
R2_ACCESS_KEY_ID=<key>
R2_SECRET_ACCESS_KEY=<secret>
R2_BUCKET_NAME=claims-app-files
R2_PUBLIC_DOMAIN=https://pub-8700b556917d4cbf8a348395a2ddc93d.r2.dev
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
```

### Removed
- Developer Cloudinary (`debqautsy`) - test account
- Legacy Cloudinary (`dt0a6xpny`) - migrated from

---

## Post-Migration Cleanup

### Completed
- [x] Migration script deleted (`scripts/migrate-to-cloudinary.ts`)
- [x] Package.json migration commands removed
- [x] `.env` cleaned up (legacy vars removed)
- [x] Corrupted file records deleted from database

### Can Be Safely Deleted (External)
After verifying the production app works correctly:
- [ ] Legacy Cloudinary account (`dt0a6xpny`) - all files migrated
- [ ] R2 image files - backup copies (documents still use R2)
- [ ] Developer Cloudinary (`debqautsy`) - test files only

---

## Verification Checklist

- [ ] Test image upload in production → should appear in Cloudinary
- [ ] Test existing image display → all 829 images should load
- [ ] Test image deletion → should remove from Cloudinary
- [ ] Test PDF upload → should go to R2
- [ ] Test HEIC upload → should auto-convert to JPEG

---

## Notes

- Original files in legacy storage are preserved as backups
- Demo branch (ep-nameless-dew-afjcar14) has 48 test files - left in place
- All URLs in production database now point to `dmdlf5lkx`
