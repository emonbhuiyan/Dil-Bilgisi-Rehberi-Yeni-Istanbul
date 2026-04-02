# Website files for Dil-Bilgisi-Rehberi-Yeni-Istanbul

## Files
- `index.html`
- `styles.css`
- `app.js`

## How it works
The website calls the GitHub Contents API for the current repository root, looks for files named like:
- `A1_Grammar.md`
- `A2_Vocabulary.md`
- `B1_Grammar.md`
- `C2_Vocabulary.md`

Any future files that follow the same naming pattern are picked up automatically.

## How to use in the repo
1. Put these 3 files in the root of your repository.
2. Commit and push.
3. Enable GitHub Pages for the repository.
4. Open the Pages URL.

## Notes
- This is built as a static site, so it works well with GitHub Pages.
- Study progress, favorites, theme, and study mode are saved in the browser with localStorage.
- If you ever rename the repository, update the `owner` and `repo` values at the top of `app.js`.
