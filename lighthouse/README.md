# Lighthouse screenshots

Run against the deployed Vercel URL with the desktop preset:

```
npx lighthouse <deployed-url> \
  --preset=desktop \
  --view \
  --output=html \
  --output-path=./lighthouse/desktop.html
```

Save the report screenshots here:

- `desktop-summary.png` — top-of-report scores (Performance / Accessibility / Best Practices / SEO)
- `desktop-perf-detail.png` — Performance metrics detail (LCP/CLS/TBT)

Mobile (optional) under `mobile-*.png`.
