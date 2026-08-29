# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal static site that centralizes the user's notes from LinuxTips' Kubernetes training course. The course is structured in days; each day becomes a folder of markdown notes rendered through a small dark/orange "terminal" themed UI. There is no build step, no package.json, no backend — plain HTML/CSS/JS served statically, with markdown rendering and diagrams done client-side via CDN libraries (marked.js, highlight.js, mermaid.js).

The user is a student progressing through the course day by day, and this material is meant to be shared with other people, not just kept as private notes. Expect recurring tasks of three kinds:
1. Adding a new day / new note file and wiring it into the site.
2. Formatting notes the user pastes or writes: fact-check technical claims, format didactically (diagrams/tables/callouts), and flag anything factually off explicitly in chat — but never fabricate or embellish technical content into the note file itself unless the user explicitly asks for that content to be added.
3. Splitting a note file when it has accumulated multiple distinct topics — prefer one concept per file/sidebar entry (see "One topic per file" below). This has already happened once in `01_day`; expect it to recur as other days grow.

**Write all note content impersonally** — never address the reader directly ("você usa...", "que você viu..."). Use third-person/neutral phrasing instead. This applies to note markdown (including cross-reference callouts between notes), not to conversation replies to the user.

## Running it

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Markdown files are loaded via `fetch()`, so the site must be served over HTTP — opening `index.html` directly via `file://` fails due to browser CORS restrictions.

There are no tests, linters, or build commands in this repo.

## Architecture

**`data/days.json` is the single source of truth for site structure.** Both `index.html` (day list) and `day.html` (single day view) are driven entirely by this manifest — nothing is derived from the filesystem automatically. Each entry:

```json
{
  "id": "01",
  "folder": "01_day",
  "title": "Dia 01",
  "description": "...",
  "topics": [{ "title": "...", "file": "o_que_eh_um_container.md" }]
}
```

Adding a new day means: create `NN_day/` with markdown files, then add a matching entry to `data/days.json`. Adding a note to an existing day means: add the `.md` file and append to that day's `topics` array. The site does not glob directories — an untracked file is invisible to the UI.

**`assets/app.js`** has two entry points called directly from inline `<script>` tags in the HTML pages (`initIndex()` from `index.html`, `initDay()` from `day.html`) — there's no router or framework.

- `initIndex()`: fetches `days.json`, renders one card per day, and appends a synthesized "next day" locked/disabled placeholder card (`nextId = lastDay + 1`) so the grid always shows what's coming.
- `initDay()`: reads `?dia=NN` from the query string, finds the matching day, renders the topic sidebar, and on topic click fetches that raw `.md` file and renders it client-side:
  1. `marked.parse()` → HTML
  2. Any ` ```mermaid ` fenced code block is pulled out and re-rendered via `mermaid.run()` as a diagram (this must happen *before* highlight.js runs, otherwise hljs would try to syntax-highlight mermaid syntax as code)
  3. Remaining `pre code` blocks go through `hljs.highlightElement()`
  4. An empty/whitespace-only markdown file shows a friendly "not written yet" placeholder instead of a blank page

Mermaid is initialized once at script load with a dark theme matching the site's CSS custom properties (`assets/app.js` top of file), not re-initialized per render.

**Styling** lives entirely in `assets/style.css` using CSS custom properties (`--bg`, `--orange`, `--orange-2`, `--mono`, etc.) defined once in `:root`. The visual language is deliberately terminal/LinuxTips-styled: dark backgrounds, orange/amber gradient accents, JetBrains Mono for headers and code, fake terminal title bars (three colored dots) on cards and the content panel. Reuse existing CSS classes (`.markdown-body`, `.callout`-style blockquotes, `.mermaid`) rather than introducing new visual patterns — keep new notes' markdown consistent with what these classes already style well (headers, tables, blockquotes as callouts, mermaid fences, fenced code blocks).

**No bundler**: marked.js, highlight.js, and mermaid.js are all loaded from CDN (`cdnjs.cloudflare.com`, `cdn.jsdelivr.net`) as pinned versions directly in `day.html`'s `<script>` tags. If adding a new client-side library, follow the same pattern — pinned CDN `<script src>`, no npm/build step.

## Content conventions for notes

When writing or editing a day's `.md` files, prefer the patterns established in `01_day/`:
- An `# Title` matching the topic, with a one-line blockquote summary right under it (renders as an orange-accented callout box)
- Mermaid `flowchart` diagrams to visualize relationships/pipelines instead of prose-only explanations
- Tables for comparisons
- Fenced ` ```bash ` blocks for practical/hands-on examples
- A stub section (italic placeholder line) for content the user has started but not finished, rather than omitting the heading

**One topic per file.** `01_day/` holds 4 separate files — `o_que_eh_um_container.md`, `container_engine_e_runtime.md`, `o_que_eh_kubernetes.md`, `arquitetura_kubernetes.md` — each its own sidebar entry in `days.json`, in the order they should be read. They were originally one file that grew unwieldy; when a note accumulates more than one clear concept, split it the same way and reorder/relabel `topics` in `days.json` to match. Files cross-reference each other with two callout patterns, both impersonal and both naming the target note explicitly (never "above"/"lá em cima", since notes now live in separate files):
- `> 👉 Continua em **<Next Note Title>**: <one-line teaser>` at the end of a file, pointing to what comes next
- `> 🔗 **Conexão:** ...` mid-file, linking a concept back to a component covered in another note

Never fabricate or embellish technical claims beyond what the user's actual notes say — visual/structural improvements only, unless the user explicitly asks for new explanatory content (e.g. they asked to have the OCI section filled in outright).
