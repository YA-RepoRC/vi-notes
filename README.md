# VI Notes — Vehicle & Scene Inspection App

Standalone, offline-first replacement for the VI & SI Notes Template (Excel).
No server, no account, no install beyond "Add to Home Screen". All data stays on the device.

## Files
- `index.html` — the whole app (schema + logic + styles). Open this.
- `sw.js`, `manifest.webmanifest`, `icon-*.png` — make it installable and offline-capable when served over http(s).
- `schema.js`, `app.js`, `head.html` — the source pieces that are concatenated into `index.html`.
  Edit `schema.js` to add/remove/rename fields, then rebuild (see below).

## Running it
**Laptop, quick look:** double-click `index.html`. Everything works except install/offline caching (browsers don't run service workers from file://).

**iPad / phone (recommended):** the folder needs to be served over https. Easiest options:
1. Put the folder in a GitHub repo and turn on GitHub Pages (free, private repo is fine — Pages URL is public but unguessable; or use a private hosting option). 
2. Any static host (Netlify drop, Cloudflare Pages, an internal IIS/nginx folder).

Then in Safari on the iPad open the URL → Share → **Add to Home Screen**. After the first load it runs fully offline.

## Using it
- **New Inspection** → fill Case & Inspection → Vehicle (type the VIN and tap **Decode** when online to fill year/make/model/body/engine/drive/GVWR from NHTSA).
- **Sections › Edit** turns sections on/off per case (e.g. drop Scene or Brakes when they don't apply).
- Every field and every sub-heading has a **camera button**: Take Photo (opens the camera) or Choose from Library. Photos are auto-numbered, tagged to that item, and can be captioned, moved, or deleted by tapping the thumbnail.
- **Mark N/A** on a sub-heading (Third Row, Passenger Knee Airbag, Spare, etc.) greys it out and prints it as Not Applicable.
- **Report** → Print / Save PDF. Options: blank form for handwriting, include empty fields, photos inline, photo log.
  On iPad: Print → pinch out on the preview → Share → Save to Files.
- **Export** → a .zip with `inspection.json` + full-resolution `photos/P001.jpg …`. **Import** on the list screen restores it (photos included) on any device.

## Rebuilding index.html after editing schema.js
    { cat head.html; echo '<script>'; cat schema.js; echo '</script><script>'; cat app.js; echo '</script></body></html>'; } > index.html
(or on Windows PowerShell: `Get-Content head.html, ('<script>'), schema.js, ('</script><script>'), app.js, ('</script></body></html>') | Set-Content index.html`)

## Data storage note
Inspections and photos live in the browser's IndexedDB for that site. Clearing Safari website data deletes them — export finished inspections to a case folder as a matter of routine.

## Schema field types
`text`, `num`, `date`, `area`, `select` (one chip), `multi` (many chips), `yn`, `status` (chip + comment), `lr` (two columns), `lrsel` (chip + comment per side), `tread` (3 × /32), `table` (add-row grid), `heading` (sub-section; `na:true` gives it a Mark N/A toggle).
