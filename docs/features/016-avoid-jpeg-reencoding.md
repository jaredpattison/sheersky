# Avoid Unnecessary JPEG Re-Encoding

**GitHub Issue:** [#9701](https://github.com/bluesky-social/social-app/issues/9701)
**Upvotes:** 12
**Category:** Bug Fix — Image Quality
**Effort:** Low
**Scope:** Client-side only

## Problem

When uploading images, the app re-encodes JPEGs even when they're already within the size limits. This degrades image quality and increases file size unnecessarily (generational quality loss).

## Expected Behavior

- If a selected image is already JPEG and within the upload size limit (~1MB), upload it as-is without re-encoding
- Only re-encode if the image exceeds size limits or is in a non-JPEG format
- PNG images with transparency should remain PNG (not converted to JPEG)

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/media/manip.ts` | Image manipulation — compression and resizing logic |
| `src/view/com/composer/photos/` | Photo selection in composer |

## Implementation Approach

### 1. Check Before Re-Encoding

Before running the image through compression:

```ts
async function prepareImage(uri: string): Promise<PreparedImage> {
  const fileInfo = await getFileInfo(uri)
  const mimeType = getMimeType(uri)

  // Skip re-encoding if already JPEG and under size limit
  if (mimeType === 'image/jpeg' && fileInfo.size <= MAX_UPLOAD_SIZE) {
    return { uri, mimeType: 'image/jpeg', size: fileInfo.size }
  }

  // Otherwise, compress/resize as usual
  return compressImage(uri)
}
```

### 2. Size Limit

The AT Protocol blob upload limit is typically 1MB. Only re-encode when the original file exceeds this.

## Edge Cases

- EXIF orientation: some JPEGs have rotation in EXIF metadata — the app may need to re-encode to apply rotation. Check if the JPEG has non-standard orientation before skipping re-encoding
- Images from camera: may be very large and always need compression
- Images from clipboard/share sheet: format may vary
- Progressive JPEG: should be fine to upload as-is
- HEIC images (iOS): these always need conversion to JPEG
