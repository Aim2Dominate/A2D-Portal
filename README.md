# A2D Celestial League Portal

A **live, real-time women's esports league dashboard** powered by Google Sheets.

## Features

✅ **Live Data Sync** — Auto-syncs from Google Sheets every 60 seconds  
✅ **4 Tab Dashboard** — Overview, Teams, Players, Divisions  
✅ **Search & Filter** — Find orgs, players, and ranks instantly  
✅ **Division Management** — Blood Thorns, Sapphire Azure, Emerald Siege  
✅ **SR Rankings** — Color-coded skill rating display  
✅ **Dark Theme UI** — Optimized for esports  
✅ **Fully Responsive** — Desktop, tablet, mobile  

## Setup (15 minutes)

### Step 1: Prepare Your Google Sheet

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1tuj1h2dEfPuE4qNX2mTJNk56aC56RGot9f5hiALIXso/edit?gid=467779826
2. Click **Share** → Select "Anyone with the link" → Viewer
3. Your Sheet ID is already configured: `1tuj1h2dEfPuE4qNX2mTJNk56aC56RGot9f5hiALIXso`
4. Sheet tab name: `Form Responses 1`

### Step 2: Connect Your Google Form

1. Google Form: https://docs.google.com/forms/d/1VjSsdsd0253gSFBEIcHzTZzgJn2oWWH5Ikv47SmOYZ8/edit
2. Ensure responses are being written to the "Form Responses 1" sheet
3. Form ID is already configured: `1VjSsdsd0253gSFBEIcHzTZzgJn2oWWH5Ikv47SmOYZ8`

### Step 3: Deploy to Vercel (Free)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → "New Project"
3. Import your GitHub repository
4. Vercel auto-detects React → Deploy
5. Get a live URL (e.g., `a2d-portal.vercel.app`)

### Step 4: Run Locally (Optional)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Column Mapping

Ensure your Google Sheet columns match this order:

| Col | Name | Example |
|-----|------|---------|
| A (0) | Timestamp | 5/24/2026 14:35:22 |
| B (1) | Email | team@example.com |
| C (2) | Organization Name | Aim2Dominate |
| D (3) | Twitter Handle | @Aim2Dominate |
| E (4) | Player 1 ID | PlayerOne#1234 |
| F (5) | Player 2 ID | PlayerTwo#5678 |
| G (6) | Player 3 ID | PlayerThree#9012 |
| H (7) | Player 4 ID | PlayerFour#3456 |
| I (8) | Sub 1 ID | SubOne#7890 |
| J (9) | Sub 2 ID | SubTwo#2345 |
| K (10) | Player 1 Rank | Diamond 2 – 6,800 SR |
| L (11) | Player 2 Rank | Plat 2 – 5,200 SR |
| M (12) | Player 3 Rank | Plat 3 – 4,800 SR |
| N (13) | Player 4 Rank | Gold 1 – 3,900 SR |
| O (14) | Sub 1 Rank | Plat 2 – 5,100 SR |
| P (15) | Sub 2 Rank | Gold 3 – 3,500 SR |
| Q (16) | Division | Blood Thorns |

## Customization

### Add/Edit Divisions

Edit `src/App.jsx` line ~40:

```javascript
const DIVISIONS = {
  "Blood Thorns"  : { c: "#C41E3A", label: "Crim 2+",    sr: ">8,300 SR+"      },
  "Sapphire Azure": { c: "#1A5FC8", label: "Diamond 2+", sr: "6,100–8,300 SR"  },
  "Emerald Siege" : { c: "#16924F", label: "Plat 2+",    sr: "4,199–6,099 SR"  },
};
```

### Add Organization Logos

Edit `src/App.jsx` line ~34:

```javascript
const LOGOS = {
  "Your Org Name": "https://drive.google.com/thumbnail?id=YOUR_FILE_ID&sz=w160",
};
```

### Adjust SR Color Thresholds

Edit `src/App.jsx` line ~160:

```javascript
const srColor = (v) => {
  if (!v) return "#44445A";
  if (v >= 8300) return "#E03050";  // Crimson
  if (v >= 6100) return "#3A8FE0";  // Blue
  if (v >= 4199) return "#28B468";  // Green
  return "#8888A8";                 // Gray
};
```

## Troubleshooting

### "Could not load sheet data"

- ✅ Verify Sheet is shared as "Anyone with the link"
- ✅ Check `SHEET_ID` matches your URL
- ✅ Ensure tab name is exactly `"Form Responses 1"`
- ✅ Open the Sheet in a private/incognito window to test access

### No data appearing

- ✅ Check that Google Form responses are writing to the sheet
- ✅ Verify column order matches the mapping above
- ✅ Ensure no blank rows exist between data rows

### Form not connected

- ✅ Verify Google Form is set to write to the correct sheet
- ✅ Form ID is for reference only (auto-linked in comments)
- ✅ All data flows through the Sheet

## Links

🔗 **Google Form**: https://docs.google.com/forms/d/1VjSsdsd0253gSFBEIcHzTZzgJn2oWWH5Ikv47SmOYZ8/edit  
🔗 **Google Sheet**: https://docs.google.com/spreadsheets/d/1tuj1h2dEfPuE4qNX2mTJNk56aC56RGot9f5hiALIXso/edit?gid=467779826  
🔗 **GitHub Repo**: https://github.com/Aim2Dominate/A2D-Portal

## License

MIT
