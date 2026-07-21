# Resonance — Product Requirements Document

**Version:** 1.0 (Draft)
**Owner:** You
**Status:** Draft for review

---

## 1. Overview

Resonance is a personal music player that streams audio sourced from YouTube via pasted links/playlists. It starts as a React (web) + Node.js (backend) app, with a React Native mobile client planned for a later phase, syncing playlists and library data across both.

**Core idea:** you paste a YouTube link or playlist URL → the backend resolves it into playable audio → songs get organized into playlists, themed, shuffled, exported, and (later) downloaded for offline playback.

---

## 2. Goals

- Single-user product (you), but architected for multi-device sync (web + future mobile) from day one.
- Paste-first song ingestion (no search dependency for MVP).
- Rich playlist management: many-to-many song↔playlist relationships.
- Portable library via export/import (JSON-based).
- Deep playback controls: loop, shuffle, "super shuffle" across all playlists.
- A genuinely custom, non-generic theming system.
- Backend cheap/free to host (Render/Railway/Fly.io class).

## 3. Non-Goals (for MVP)

- No multi-user accounts, sharing, or social features.
- No YouTube search/discovery (link-paste only).
- No offline download in MVP — designed for, not built, in phase 1.
- No monetization, ads, or public distribution.

> Note: Extracting streamable audio from YouTube outside their official player sits in a legal/ToS gray area. This is fine for a personal project but is a reason **not** to publicly distribute or monetize this app, and to expect the extraction layer will need occasional maintenance as YouTube changes its internals.

---

## 4. Users & Platforms

| Platform | Phase | Notes |
|---|---|---|
| Web (React) | MVP | Primary build target |
| Backend (Node) | MVP | Required — browsers can't extract YouTube audio directly (CORS + rotating signature ciphers) |
| Mobile (React Native) | Phase 2 | Reuses backend + data model; local filesystem storage for real offline downloads |

---

## 5. Feature Breakdown

### 5.1 MVP (Phase 1)

| Feature | Detail |
|---|---|
| Paste YouTube link → play | Single video URL resolved to playable audio |
| Paste YouTube playlist → import | Bulk-resolves all videos in a playlist into your library |
| Play/pause/seek/stream | Core player controls |
| Create playlists | Named, user-created collections |
| Song in multiple playlists | Many-to-many relationship, not a hard "move" |
| Loop | Single-song repeat and playlist repeat |
| Shuffle | Randomized order within a playlist |
| Super shuffle | Randomized playback pulling from **all** playlists combined (with dedup logic — see §7.4) |
| Theme builder | Custom theme creation (colors, accents, possibly typography) — see §7.5 |
| Export | Export a single playlist, or your entire library, to a JSON file |
| Import | Re-import a previously exported JSON file |

### 5.2 Phase 2 (Post-MVP)

| Feature | Detail |
|---|---|
| Offline download | Save audio locally for offline playback |
| YouTube search | Official YouTube Data API integration for in-app search |
| React Native mobile app | Same backend, native filesystem storage, sync with web |
| Cross-device sync | Playlists/library consistent between web and mobile |

---

## 6. Architecture

```
                    YOUR MACHINE (fully local, Phase 1)

  ┌─────────────────────┐
  │   React (Web App)    │
  │   localhost:3000     │
  └──────────┬───────────┘
             │
             │  HTTP API calls
             ▼
  ┌─────────────────────┐
  │   Node / Express      │
  │   - CRUD API           │
  │     (playlists, songs, │
  │      themes)           │
  │   - YouTube link        │
  │     resolver            │
  │   - Audio stream proxy  │
  └──────────┬───────────┘
             │
      ┌──────┴───────┐
      │               │
      ▼               ▼
┌───────────┐   ┌─────────────────────┐
│  Local      │   │  YouTube extractor    │
│  Postgres   │   │  (play-dl / yt-dlp)   │
│             │   │                        │
│  - Songs     │   │  Resolves a pasted    │
│  - Playlists │   │  link → audio stream  │
│  - Themes    │   │  + metadata           │
└───────────┘   └─────────────────────┘
```

**How data flows:**
1. You open the React app in your browser at `localhost:3000`.
2. React sends all requests (get playlists, add a song, save a theme, etc.) to your local Node/Express server over HTTP.
3. Node handles two kinds of requests differently:
   - **Regular data requests** (playlists, songs, themes) → Node reads/writes directly to **local Postgres**.
   - **"Paste a YouTube link" requests** → Node hands the link to the **YouTube extractor** (`play-dl`/`yt-dlp`), which resolves it into an audio stream + metadata (title, duration, thumbnail). Node then saves that metadata into Postgres and proxies the actual audio back to React for playback.

**Phase 1 (this PRD's priority): fully local.** No hosting, no cloud DB, no auth service — everything above runs on your machine. Node does everything (resolver + CRUD API), since there's no separate cloud service to call directly from the client. React only ever talks to your local Node server; Node is the only thing that talks to Postgres and to YouTube.

**Why local Postgres, not SQLite:** even though this is a local-only phase, using Postgres now (instead of SQLite) means Phase 2's migration to Supabase is a straightforward `pg_dump` → `pg_restore`, not a rewrite — same schema, same SQL dialect, zero data-model changes needed later.

**No auth needed in Phase 1** — it's your machine, your app, single user. Skip login screens entirely for now (see §14 for what changes when this migrates).

---

## 7. Key Technical Decisions

### 7.1 YouTube Extraction
- Library candidates: `play-dl`, `ytdl-core` (less actively maintained), or shelling out to `yt-dlp` (most robust, Python-based, but heavier to host).
- Recommendation: start with `play-dl` for simplicity; fall back to a `yt-dlp` binary invocation if extraction breaks often (it will, occasionally — build a small retry/health-check pattern into the resolver).
- The resolver takes a URL → returns audio stream URL + metadata (title, duration, thumbnail, channel) → backend proxies the audio stream to the frontend (so the raw extracted URL, which expires, is never exposed to or stored by the client).

### 7.2 Data Storage & Auth
- **Database:** Local Postgres running on your machine (via a native install or a simple Docker Compose setup — either works, Docker is easier to tear down/reset if needed). Same schema as originally planned for Supabase, so nothing about the data model changes.
- **Auth:** None in Phase 1. There's no network exposure, no other users — the app just assumes "you." This removes an entire layer of complexity (no login screen, no session handling, no token management) for now.
- **Node backend's role in this model:** does everything — the YouTube resolver (§7.1) *and* the CRUD API for playlists/songs/themes, talking directly to local Postgres. React only ever talks to `localhost` Node.
- **Run-on-boot:** since the whole stack lives on your machine, set Node (and Postgres, if not using Docker's own restart policy) to start automatically on system boot — e.g. via `pm2` (process manager, has a `pm2 startup` command for this) or a simple systemd service on Linux / Task Scheduler on Windows. This is what makes "just works whenever my system is on" actually true, rather than requiring you to manually start servers each time.



### 7.3 Export / Import Format
Proposed JSON schema (versioned for future-proofing):

```json
{
  "resonanceExportVersion": 1,
  "type": "playlist",            // "playlist" | "library"
  "exportedAt": "2026-07-17T12:00:00Z",
  "playlists": [
    {
      "id": "uuid",
      "name": "Late Night Coding",
      "createdAt": "...",
      "songs": ["songId1", "songId2"]
    }
  ],
  "songs": [
    {
      "id": "songId1",
      "youtubeId": "dQw4w9WgXcQ",
      "title": "...",
      "channel": "...",
      "durationSec": 212,
      "thumbnailUrl": "..."
    }
  ]
}
```
- `type: "library"` exports every playlist + every song in one file; `type: "playlist"` exports just one.
- Import merges by `youtubeId` (dedupes automatically) and re-links playlist membership.
- Since only the YouTube ID + metadata is stored (not audio itself), export files stay small and portable.

### 7.4 Super Shuffle — Dedup Logic
Since a song can belong to multiple playlists, a naive "combine all playlists and shuffle" would let a song appear multiple times in the shuffled queue. Super shuffle should first build a **deduplicated set** of unique songs across all playlists (by song ID), then shuffle that set — so each song plays once per super-shuffle cycle regardless of how many playlists it's in.

### 7.5 Theme Builder
Full custom theme builder scope, suggested v1 controls:
- Primary/accent/background/surface colors (with a live preview)
- Typography choice (a curated set of fonts, not arbitrary upload)
- Save/name multiple custom themes, switch between them
- Export/import themes as JSON too (same pattern as playlists) — nice symmetry with §7.3

### 7.6 Offline Download (Phase 2 design note, not built in MVP)
- **Web:** IndexedDB storing downloaded audio as Blobs. Subject to browser storage quotas (varies, but generally generous — often 50%+ of free disk space). File System Access API (Chrome/Edge only) is a stronger alternative if you want a real folder-based library instead of Blob storage.
- **Mobile (React Native):** Real filesystem access via `react-native-fs` or similar — simpler and more reliable than the web equivalent.

---

## 8. Data Model (Simplified)

```
User (single row, effectively "you")
  └── has many → Playlist
  └── has many → Song

Playlist
  - id, name, createdAt, themeId (optional per-playlist theme override?)

Song
  - id, youtubeId, title, channel, durationSec, thumbnailUrl, addedAt

PlaylistSong (join table — enables many-to-many)
  - playlistId, songId, addedAt, order

Theme
  - id, name, colors (json), font, createdAt
```

---

## 9. Non-Functional Requirements

- **Cost:** Zero — fully local, no hosting bills at all in Phase 1.
- **Resilience:** YouTube extraction will occasionally break when YouTube changes internals — resolver should fail gracefully (clear error, not a crash) and be easy to patch/restart.
- **Portability:** All library data exportable — you should never be "locked in" to the app's own database, and the local Postgres schema is designed to migrate cleanly to a cloud Postgres later (see §14).
- **Availability:** The app is only usable while your machine is on and the local services are running — this is an accepted tradeoff for Phase 1, not a bug.

---

## 10. Open Questions / Risks

1. **Extraction fragility** — YouTube extraction libraries break periodically; expect light maintenance over time.
2. **Legal/ToS** — Fine for personal use; not for public distribution or monetization.
3. **Machine-on requirement** — the app (including web access) only works while your machine is running Node + Postgres. Fine for Phase 1; revisit if this becomes annoying enough to justify Phase 2 earlier.
4. **Storage quota (web offline downloads, Phase 2)** — browser storage limits vary by browser/device; needs a fallback UX (e.g., "storage full" handling).
5. **Sync conflict handling (Phase 2+)** — once mobile + web both write to the same library, need a simple last-write-wins or timestamp-based merge strategy.

---

## 11. Suggested Roadmap

| Phase | Scope |
|---|---|
| 1 — MVP (local, top priority) | Paste-to-play, playlists, loop/shuffle/super shuffle, theme builder, export/import — fully local: Node backend + local Postgres, run-on-boot, no auth, no hosting |
| 2 — Cloud Migration | Migrate local Postgres → Supabase (or another managed Postgres), add Auth + RLS, move resolver to a lightweight always-on host if needed |
| 3 — Offline | IndexedDB-based offline downloads on web |
| 4 — Mobile | React Native app, shared backend, real filesystem downloads |
| 5 — Sync & Search | Cross-device sync, YouTube Data API search integration |

---

## 12. Tech Stack Summary

- **Frontend:** React (Vite), your choice of state management (Zustand/Redux — TBD)
- **Backend:** Node.js + Express — does everything in Phase 1: YouTube resolver + full CRUD API, using `play-dl`/`yt-dlp` for extraction
- **Database:** Local Postgres (native install or Docker Compose)
- **Auth:** None (Phase 1) — single local user, no network exposure
- **Hosting:** None — runs entirely on your machine, started automatically on boot via `pm2`/systemd/Task Scheduler
- **Mobile (Phase 4):** React Native, `react-native-fs`

---

## 13. Local Setup Notes

- **Postgres:** either install natively, or use a one-line `docker-compose.yml` with a Postgres image — the latter is easier to reset/rebuild during development and keeps your system otherwise clean.
- **Run-on-boot:** use `pm2` for both the Node server and (if not using Docker's built-in restart policy) to keep things alive across reboots. `pm2 startup` + `pm2 save` handles this on most OSes with minimal setup.
- **Local-only networking:** Node binds to `localhost`, no port-forwarding or firewall changes needed — nothing is exposed to your home network or the internet in Phase 1.

---

## 14. Future Cloud Migration (Phase 2 — not built now, designed for)

When you're ready to move to cloud (Supabase or otherwise), the migration is intentionally straightforward because of choices made in Phase 1:

- **Database:** `pg_dump` your local Postgres → `pg_restore` into Supabase (or any managed Postgres). Same schema, same SQL dialect — no data-model rewrite.
- **Auth:** Add Supabase Auth (or equivalent) at this point; since Phase 1 has no auth at all, this is additive, not a refactor.
- **Backend split:** optionally split the Node backend at this stage — move CRUD operations to talk directly to Supabase from the frontend (as originally discussed), keeping Node scoped to just the YouTube resolver. This is a nice-to-have simplification, not required for migration to work.
- **Mobile:** once cloud-hosted, React Native can point at the same Supabase project, which is what unlocks true cross-device sync.

This section exists so that Phase 1 decisions (schema design, Postgres over SQLite, clean export/import format) don't box you in later — but none of this is scoped or built until you actually decide to move to cloud.
