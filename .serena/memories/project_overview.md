# Wiki Nanodesu - Project Overview

## Purpose
This is a companion website for "アプリ版けものフレンズ３wikiなのだ！" (App Version Kemono Friends 3 Wiki). It hosts pages that are difficult to manage on Seesaa Wiki due to character limits per page.

## Key Information
- **Live Site**: https://reamkf.github.io/wiki-nanodesu/
- **Repository**: https://github.com/reamkf/wiki-nanodesu
- **Data Source**: Google Sheets for Friends and Photo data
- **Target**: Supplementary hosting for wiki pages with large datasets

## Project Structure
- `src/app/` - Next.js App Router pages
  - Friends-related pages (status, skills, kakeai graph)
  - Photo damage ranking
  - Abnormal status skills
- `src/components/` - Reusable React components organized by feature
- `src/data/` - Data files and processing logic
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions and helpers
- `gas/` - Google Apps Script integration
- `csv/` - CSV data files from Google Sheets

## Deployment
Automatically deployed to GitHub Pages via GitHub Actions when pushing to main branch.