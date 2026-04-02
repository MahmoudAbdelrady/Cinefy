---
alwaysApply: true
---

Scan all SCSS files under `src/` for repeated raw color values, border-radii, and layout patterns. Extract any duplicates into shared variables/mixins in `src/shared/styles/`, then update all files to use them.

Follow all rules defined in `.cursor/rules/scss-dedup-rule.mdc`.
