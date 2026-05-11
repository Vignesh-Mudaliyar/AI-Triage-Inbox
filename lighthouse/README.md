# Lighthouse screenshots

Run against the deployed Vercel URL with the desktop preset:

```
npx lighthouse https://ai-triage-inbox-no4y82jfk-vignesh-mudaliyars-projects.vercel.app/ \
  --preset=desktop \
  --view \
  --output=html \
  --output-path=./lighthouse/desktop.html
```

## Results

**Desktop** (`./Desktop/`):
- `desktop-summary.png` — Performance **100** / Accessibility **97** / Best Practices **100** / SEO 60
- `performance-details.png` — Performance metrics detail (LCP / CLS / TBT)

**Mobile** (`./mobile/`):
- `mobile-summary.png` — category scores
- `performance-details.png` — Performance metrics detail

Both runs comfortably clear the spec bar (Desktop Performance ≥ 90, Best Practices ≥ 90).
