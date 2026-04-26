---
title: Notion Publishing Workflow
date: 2026-04-26
excerpt: A sample article that explains how content moves from Notion into the generated static site.
group: tech
tags:
  - notion
  - publishing
  - workflow
---

This sample article explains the repository workflow at a high level.

## Publishing flow

1. Write content in Notion
2. Fill in the required database fields
3. Mark the page as `Published`
4. Run the sync script
5. Build static assets and deploy

## Why keep sample posts

The repository includes a small set of public-safe sample posts so contributors can verify the UI and build output without access to a private Notion workspace.

## Notes

- `Draft` pages are not published
- `Published` pages are exported
- Notion body content becomes the blog post body
