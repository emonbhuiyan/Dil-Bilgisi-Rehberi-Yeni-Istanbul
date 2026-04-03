# Dil Bilgisi Rehberi – Yeni İstanbul Study Helper

Dil Bilgisi Rehberi is a personal Turkish study helper website built to support learners using the **Yeni İstanbul** course books.

It turns structured Markdown notes into a simple, interactive website for studying **grammar** and **vocabulary** by level and unit.  
The project is designed to help with revision, quick lookup, and organized self-study beside the book.

## Purpose

This project was made as a **study companion** for myself and my classmates.

It is not meant to replace the original books.  
It is simply a cleaner and more practical way to review topics, organize notes, and study more comfortably.

## Current Levels

At the moment, the website supports:

- A1
- A2
- B1
- B2

The structure is already prepared so future levels can be added easily, including:

- C1
- C2

## Features

- Reads content directly from Markdown files
- Automatically detects available levels and content types
- Supports both **Grammar** and **Vocabulary**
- Search by topic, rule, or word
- Filter by level and content type
- Progress tracking using browser storage
- Favorite documents
- Study mode
- Dark mode
- Responsive layout for desktop and mobile
- GitHub Pages friendly

## Project Structure

```text
.
├── index.html
├── styles.css
├── app.js
├── src/
│   ├── A1_Grammar.md
│   ├── A1_Vocabulary.md
│   ├── A2_Grammar.md
│   ├── A2_Vocabulary.md
│   ├── B1_Grammar.md
│   ├── B1_Vocabulary.md
│   ├── B2_Grammar.md
│   └── B2_Vocabulary.md
└── assets/
    ├── logo.png
    ├── favicon.ico
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    ├── apple-touch-icon.png
    ├── android-chrome-192x192.png
    ├── android-chrome-512x512.png
    └── site.webmanifest
```

## How It Works

The website loads Markdown files from the `src/` folder using the GitHub API.

It looks for files with this naming format:

```text
LEVEL_Type.md
```

Examples:

```text
A1_Grammar.md
A1_Vocabulary.md
A2_Grammar.md
A2_Vocabulary.md
B1_Grammar.md
B1_Vocabulary.md
B2_Grammar.md
B2_Vocabulary.md
```

Supported levels:

- A1
- A2
- B1
- B2
- C1
- C2

Supported content types:

- Grammar
- Vocabulary

As long as new files follow the same naming pattern, they will be picked up automatically by the website.

## Adding New Content

To add a new level later, just place new Markdown files inside the `src/` folder.

Examples:

```text
src/C1_Grammar.md
src/C1_Vocabulary.md
src/C2_Grammar.md
src/C2_Vocabulary.md
```

No manual update is needed in the HTML structure.

## Running the Project

This is a static website, so it can be opened directly in a browser or hosted with GitHub Pages.

### Local use

You can simply open `index.html` in your browser.

For best results, you can also run a local server.

### GitHub Pages

1. Push the repository to GitHub
2. Go to **Settings**
3. Open **Pages**
4. Select the correct branch
5. Save

After publishing, the site will load the Markdown files from the repository.

## Configuration

In `app.js`, update the repository settings if needed:

```js
const REPO_CONFIG = {
  owner: "emonbhuiyan",
  repo: "Dil-Bilgisi-Rehberi",
  branch: "main",
  contentPath: "src",
  acceptedLevels: ["A1", "A2", "B1", "B2", "C1", "C2"],
  acceptedTypes: ["Grammar", "Vocabulary"],
};
```

## Tech Used

- HTML
- CSS
- JavaScript
- Marked.js for Markdown rendering
- Font Awesome CDN for icons
- GitHub API for loading repository content

## Disclaimer

This website is an independent study helper created for personal learning and classroom support alongside the **Yeni İstanbul** course books.

It is **not an official publication** and is **not intended to replace, reproduce, re-sell, or republish** the original books.

All course-book rights, titles, and related intellectual property belong to their respective owners.

This project is shared only to help with study, revision, and topic organization for personal use and classmates.

If any copyright owner believes any content should be changed or removed, I am willing to review and remove it promptly.

## Notes

This project works best when the content is written as:

- personal notes
- summaries
- explanations
- organized study material

instead of copying large portions from the original book.

## Future Plans

- Add C1
- Add C2
- Better study navigation
- Flashcards or quiz mode
- Improved progress system
- More structured content formatting

## Author

Created by **Emon Bhuiyan** as a Turkish study helper project.