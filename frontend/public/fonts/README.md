# Font Self-Hosting Setup

This directory contains self-hosted fonts for Ubuntu HRMS to eliminate slow network calls and Chrome fallback warnings.

## Required Font Files

Download the following font files and place them in this directory (`frontend/public/fonts/`):

### Inter Font Family
- `Inter-Light.woff2` (300 weight)
- `Inter-Regular.woff2` (400 weight)
- `Inter-Medium.woff2` (500 weight)
- `Inter-SemiBold.woff2` (600 weight)
- `Inter-Bold.woff2` (700 weight)

### Roboto Font Family
- `Roboto-Light.woff2` (300 weight)
- `Roboto-Regular.woff2` (400 weight)
- `Roboto-Medium.woff2` (500 weight)
- `Roboto-Bold.woff2` (700 weight)

### Open Sans Font Family
- `OpenSans-Light.woff2` (300 weight)
- `OpenSans-Regular.woff2` (400 weight)
- `OpenSans-Medium.woff2` (500 weight)
- `OpenSans-SemiBold.woff2` (600 weight)
- `OpenSans-Bold.woff2` (700 weight)

### Playfair Display Font Family
- `PlayfairDisplay-Regular.woff2` (400 weight)
- `PlayfairDisplay-Bold.woff2` (700 weight)

## Download Instructions

### Option 1: Google Fonts Direct Download

1. **Inter Font**
   - Visit: https://fonts.google.com/specimen/Inter
   - Click "Download family"
   - Extract and copy the .woff2 files to this directory

2. **Roboto Font**
   - Visit: https://fonts.google.com/specimen/Roboto
   - Click "Download family"
   - Extract and copy the .woff2 files to this directory

3. **Open Sans Font**
   - Visit: https://fonts.google.com/specimen/Open+Sans
   - Click "Download family"
   - Extract and copy the .woff2 files to this directory

4. **Playfair Display Font**
   - Visit: https://fonts.google.com/specimen/Playfair+Display
   - Click "Download family"
   - Extract and copy the .woff2 files to this directory

### Option 2: Direct URL Download

You can download individual font files directly from Google Fonts CDN:

**Inter:**
- https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2 (Regular)
- https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2 (SemiBold)
- https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLKYAZ9hiA.woff2 (Bold)

**Roboto:**
- https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2 (Regular)
- https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4.woff2 (Medium)
- https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.woff2 (Bold)

**Open Sans:**
- https://fonts.gstatic.com/s/opensans/v36/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4taVIGxA.woff2 (Regular)
- https://fonts.gstatic.com/s/opensans/v36/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1B4taVIGxA.woff2 (SemiBold)
- https://fonts.gstatic.com/s/opensans/v36/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1B4gaVI.woff2 (Bold)

**Playfair Display:**
- https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWbn2PKdFvXDXbtM.woff2 (Regular)
- https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXDTnYh0hPB.woff2 (Bold)

### Option 3: Using a Font Downloader Tool

Use a tool like [google-font-download](https://github.com/ctrl-f5/google-font-download) to download all required weights at once.

## File Naming Convention

Ensure the downloaded files are renamed to match the font-face declarations in `src/fonts.css`:

- Inter: `Inter-Light.woff2`, `Inter-Regular.woff2`, `Inter-Medium.woff2`, `Inter-SemiBold.woff2`, `Inter-Bold.woff2`
- Roboto: `Roboto-Light.woff2`, `Roboto-Regular.woff2`, `Roboto-Medium.woff2`, `Roboto-Bold.woff2`
- Open Sans: `OpenSans-Light.woff2`, `OpenSans-Regular.woff2`, `OpenSans-Medium.woff2`, `OpenSans-SemiBold.woff2`, `OpenSans-Bold.woff2`
- Playfair Display: `PlayfairDisplay-Regular.woff2`, `PlayfairDisplay-Bold.woff2`

## Verification

After downloading the fonts, verify they're working by:
1. Starting the dev server: `npm run dev`
2. Opening Chrome DevTools
3. Checking the Network tab - fonts should load from `/fonts/` not from Google Fonts CDN
4. No "slow network, fallback font" warnings should appear

## Benefits

- **Faster page load** - fonts load instantly from disk
- **No network dependency** - works offline
- **No Chrome warnings** - eliminates "slow network, fallback font" issues
- **Better privacy** - no external font requests
- **Consistent rendering** - fonts always available
