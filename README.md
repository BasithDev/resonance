# Resonance — Premium Audio Web App

<div align="center">
  <h3>🎵 High-Performance YouTube Audio Player & Music Library</h3>
  <p>Stream, search, curate, and backup your YouTube music collection with zero bloat.</p>
</div>

---

## ✨ Features

### 🔍 Universal Search & View Switcher
- **Universal Search Engine**: Search for songs, artists, or paste YouTube URLs directly in the top header.
- **Dedicated Search View (`/search`)**: Instantly browse YouTube search results with high-res cover art.
- **🔲 Dual View Switcher**: Easily toggle between 5-column **Grid View** and compact **Horizontal List View**.
- **Instant Playback**: Stream any search result directly in the global player on-the-fly without importing first.

### 🔗 Interactive Media Import Modal
- **Link Resolver**: Paste single video links or full YouTube playlist URLs.
- **▶️ In-Modal Audio Preview**: Listen to preview tracks directly inside the import modal before adding to your library.
- **1-Click Library Import**: Add single songs or entire YouTube playlists into your database with clean success notifications.

### 🎵 Playlists & Master Library
- **Master Library (`/`)**: View recently added tracks and custom playlists in one central dashboard.
- **Custom Playlists**: Create, rename, and manage custom music collections.
- **⋮ 3-Dot Playlist Context Menu**: Quick access to:
  - ▶️ **Play**: Sequential playback from track 1.
  - 🔀 **Shuffle & Play**: Fisher-Yates shuffle array and start playing.
  - ✏️ **Rename**: Custom playlist renaming.
  - 🗑️ **Delete Playlist**: Remove custom playlists with confirmation.

### 🔎 In-Playlist Search & Hero Controls
- **In-Playlist Track Filter**: Search and filter tracks inside any playlist in real time by title or artist.
- **🔀 Shuffle Play Button**: Instant shuffle playback directly from the playlist header.
- **🔁 Loop / Repeat Toggle**: Cycle loop modes (`Loop Off` ➔ `Loop Playlist` ➔ `Loop Track`) with visual active indicators.

### 📦 Complete Export & Import System (`/export-import`)
- **JSON Backup (`.json`)**: 1-click full library export and restoration of all songs and custom playlists.
- **CSV Spreadsheet Export (`.csv`)**: Export track lists compatible with Excel, Sheets, or Spotify tools.
- **Batch Link Importer**: Paste multiple YouTube links or IDs line-by-line for instant bulk importing.

### 🎨 Modern UI & Animation System
- **Sleek Dark Mode**: Tailored HSL colors, vibrant glassmorphic surfaces, and material icon badges.
- **Smooth Sidebar Rail**: Buttery-smooth collapse/expand transition with border-centered toggle handle and persistent icon alignment.
- **Flicker-Free Silent Updates**: Background playlist state syncs without unmounting UI or showing flash spinners.

---

## 🚀 Tech Stack

- **Core Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons & Fonts**: Google Material Symbols Sharp & Rounded, Inter Variable Font
- **Package Manager**: `pnpm`

---

## 🛠️ Getting Started

### 1. Prerequisites
Ensure the **Resonance Backend** server (`resonance-backend`) is running locally at `http://127.0.0.1:4000`.

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/BasithDev/resonance.git
cd resonance/web

# Install dependencies
pnpm install
```

### 3. Development Server
```bash
# Start Vite development server with API proxying
pnpm dev
```
The web application will open at `http://localhost:5173`.

### 4. Build for Production
```bash
# Build production bundle
pnpm build
```

---

## 📁 Project Structure

```
web/
├── src/
│   ├── api/             # Centralized API client methods
│   ├── components/      # UI components (Sidebar, SearchBar, MiniPlayer, FullPlayer, Modals, etc.)
│   ├── pages/           # Application views (LibraryPage, SearchPage, PlaylistsPage, PlaylistDetailPage, ExportImportPage)
│   ├── App.jsx          # Router, state management, and sticky layout mounts
│   ├── main.jsx         # App entry point
│   └── index.css        # Material Design 3 tokens and custom utilities
├── public/              # Static assets & favicons
├── index.html           # Document head, SVG favicon, and root mount
└── vite.config.js       # Vite configuration & dev proxy settings
```
