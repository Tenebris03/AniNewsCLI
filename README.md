# AniNewsCLI

Anime episode release schedule right in your terminal. Fetches data from [AniList](https://anilist.co) — no API key needed.

## Install

```bash
npm install -g aninewscli
```

Or install directly from GitHub:

```bash
npm install -g github:Tenebris03/AniNewsCLI
```

## Usage

```bash
aninews                 # Today's anime releases
aninews tomorrow        # Tomorrow's releases
aninews yesterday       # Yesterday's releases
aninews 25.12.2025      # A specific date (DD.MM.YYYY)
aninews track           # Browse & track currently airing anime
aninews --help          # Show help
```

### Track Command

`aninews track` opens an interactive panel where you can browse all currently airing anime and mark shows to follow:

- `↑`/`↓` or `j`/`k` — navigate the list
- `Space` — toggle tracking on/off
- `g` — jump to top, `G` — jump to bottom
- `Enter` — save and exit
- `q` or `Esc` — quit without saving

Tracked shows are saved to `~/.config/aninews/tracked.json`.

## Data Source

All data comes from the free [AniList GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs).

## License

MIT
