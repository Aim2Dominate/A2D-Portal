/**
 * A2D Women's League Portal — Live Google Sheets Edition
 * ═══════════════════════════════════════════════════════
 *
 * HOW TO DEPLOY IN 15 MINUTES:
 *
 * Step 1 ── Make your Google Sheet publicly readable
 *   a) Open your Sheet
 *   b) Share → "Anyone with the link" → Viewer
 *   c) Copy the Sheet ID from the URL (the long string between /d/ and /edit)
 *      Your Sheet ID: 1tuj1h2dEfPuE4qNX2mTJNk56aC56RGot9f5hiALIXso
 *
 * Step 2 ── Paste your Sheet ID below
 *
 * Step 3 ── Deploy on Vercel (free)
 *   a) Create a new folder on your computer called "a2d-portal"
 *   b) Save this file as "a2d-portal/src/App.jsx"
 *   c) Go to vercel.com → New Project → import the folder
 *   d) Vercel auto-detects React → Deploy
 *   e) You get a URL like: a2d-portal.vercel.app
 *
 * ════════════════════════════════════════════════════════
 */

import { useState, useEffect, useMemo } from "react";

// ── CONFIG ── paste your Sheet ID here ──────────────────
const SHEET_ID   = "1tuj1h2dEfPuE4qNX2mTJNk56aC56RGot9f5hiALIXso";
const SHEET_NAME = "Form Responses 1"; // name of the tab in your Sheet
const FORM_ID    = "1VjSsdsd0253gSFBEIcHzTZzgJn2oWWH5Ikv47SmOYZ8"; // Google Form ID

// ── COLUMN MAP ─── matches the order Google Forms writes to the Sheet ──
// Column A=0, B=1, C=2 … adjust if your columns differ
const COL = {
  TIMESTAMP  : 0,
  EMAIL      : 1,
  ORG_NAME   : 2,
  ORG_TWITTER: 3,
  ACT_P1     : 4,
  ACT_P2     : 5,
  ACT_P3     : 6,
  ACT_P4     : 7,
  ACT_S1     : 8,
  ACT_S2     : 9,
  RANK_P1    : 10,
  RANK_P2    : 11,
  RANK_P3    : 12,
  RANK_P4    : 13,
  RANK_S1    : 14,
  RANK_S2    : 15,
  DIVISION   : 16,
};

// ── PARTNER LOGO FILE IDs (Google Drive) ────────────────
const LOGOS = {
  "God Slayers"             : "https://drive.google.com/thumbnail?id=1ICn-Esv1K2qQDzg607sjR1KeRcAIuO1T&sz=w120",
  "Aim2Dominate"            : "https://drive.google.com/thumbnail?id=1J-oV7dbatGyBNQTum46zUSjIN0dKLC0d&sz=w160",
};

const DIVISIONS = {
  "Blood Thorns"  : { c: "#C41E3A", label: "Crim 2+",    sr: ">8,300 SR+"      },
  "Sapphire Azure": { c: "#1A5FC8", label: "Diamond 2+", sr: "6,100–8,300 SR"  },
  "Emerald Siege" : { c: "#16924F", label: "Plat 2+",    sr: "4,199–6,099 SR"  },
};

// ────────────────────────────────────────────────────────
// DATA FETCHING — reads live from your Google Sheet
// ────────────────────────────────────────────────────────
async function fetchSheetData() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
  const res  = await fetch(url);
  const text = await res.text();

  // Google wraps the JSON in /*O_o*/ google.visualization.Query.setResponse({ ... });
  const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/)[1]);
  const rows = json.table.rows;

  return rows
    .map((row) => {
      const v = (i) => (row.c[i] && row.c[i].v != null ? String(row.c[i].v).trim() : "");
      const orgRaw = v(COL.ORG_NAME);
      if (!orgRaw) return null; // skip blank rows

      // Parse SR out of strings like "Diamond 2 – 6,800 SR" → 6800
      const parseSR = (str) => {
        if (!str) return null;
        const match = str.replace(/,/g, "").match(/(\d{4,6})/);
        return match ? parseInt(match[1]) : null;
      };

      // Determine which division key this matches
      const rawDiv  = v(COL.DIVISION);
      const divKey  = Object.keys(DIVISIONS).find((k) => rawDiv.includes(k)) || rawDiv;

      return {
        id       : orgRaw + "_" + v(COL.TIMESTAMP),
        org      : orgRaw,
        twitter  : v(COL.ORG_TWITTER),
        division : divKey,
        submitted: v(COL.TIMESTAMP).slice(0, 10),
        players  : [
          { s: "Player 1", id: v(COL.ACT_P1), rankStr: v(COL.RANK_P1), sr: parseSR(v(COL.RANK_P1)) },
          { s: "Player 2", id: v(COL.ACT_P2), rankStr: v(COL.RANK_P2), sr: parseSR(v(COL.RANK_P2)) },
          { s: "Player 3", id: v(COL.ACT_P3), rankStr: v(COL.RANK_P3), sr: parseSR(v(COL.RANK_P3)) },
          { s: "Player 4", id: v(COL.ACT_P4), rankStr: v(COL.RANK_P4), sr: parseSR(v(COL.RANK_P4)) },
          { s: "Sub 1",    id: v(COL.ACT_S1), rankStr: v(COL.RANK_S1), sr: parseSR(v(COL.RANK_S1)) },
          { s: "Sub 2",    id: v(COL.ACT_S2), rankStr: v(COL.RANK_S2), sr: parseSR(v(COL.RANK_S2)) },
        ],
      };
    })
    .filter(Boolean);
}

// ────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────
const srColor = (v) => {
  if (!v) return "#44445A";
  if (v >= 8300) return "#E03050";
  if (v >= 6100) return "#3A8FE0";
  if (v >= 4199) return "#28B468";
  return "#8888A8";
};

const avgSR = (players) => {
  const main = players.filter((p) => p.s.startsWith("P") && p.sr);
  return main.length ? Math.round(main.reduce((a, b) => a + b.sr, 0) / main.length) : 0;
};

const initials = (s) =>
  s.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const OrgLogo = ({ org, size = 38 }) => {
  const [err, setErr] = useState(false);
  const url = LOGOS[org];
  const style = {
    width: size, height: size, borderRadius: 6, overflow: "hidden",
    background: "#1C1C30", border: "1px solid rgba(255,255,255,0.1)",
    flexShrink: 0, display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#44445A",
  };
  if (!url || err)
    return <div style={style}>{initials(org)}</div>;
  return (
    <div style={style}>
      <img src={url} alt={org} onError={() => setErr(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
};

const DivBadge = ({ name }) => {
  const d = DIVISIONS[name] || { c: "#888", label: name };
  return (
    <span style={{
      background: d.c + "1A", color: d.c, border: `1px solid ${d.c}30`,
      borderRadius: 4, fontSize: 10, fontWeight: 700, padding: "3px 8px",
      letterSpacing: 0.3, whiteSpace: "nowrap",
    }}>{name}</span>
  );
};

// ────────────────────────────────────────────────────────
// MAIN APP
// ────────────────────────────────────────────────────────
export default function App() {
  const [teams,   setTeams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState("dashboard");
  const [divF,    setDivF]    = useState("");
  const [search,  setSearch]  = useState("");
  const [expanded,setExpanded]= useState({});

  // ── Fetch on mount, and re-fetch every 60 seconds ──
  useEffect(() => {
    const load = () => {
      setLoading(true);
      fetchSheetData()
        .then((data) => { setTeams(data); setLoading(false); })
        .catch((e)   => { setError(e.message); setLoading(false); });
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() =>
    teams.filter((t) => {
      const matchDiv    = !divF   || t.division === divF;
      const q           = search.toLowerCase();
      const matchSearch = !q     || t.org.toLowerCase().includes(q)
        || t.twitter.toLowerCase().includes(q)
        || t.players.some((p) => p.id.toLowerCase().includes(q));
      return matchDiv && matchSearch;
    }),
    [teams, divF, search]
  );

  const allPlayers = useMemo(() =>
    teams.flatMap((t) =>
      t.players.filter((p) => p.id).map((p) => ({ ...p, org: t.org, div: t.division }))
    ),
    [teams]
  );

  // ── Shared styles ──
  const S = {
    page:    { background: "#09090F", minHeight: "100vh", fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif", color: "#F2F2FF" },
    surface: { background: "#0F0F1C", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 },
    text2:   { color: "#8888A8" },
    text3:   { color: "#44445A" },
  };

  if (loading) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "2px solid #8B2557", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 13, ...S.text2 }}>Loading league data…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ ...S.surface, padding: 24, maxWidth: 400, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#C41E3A", marginBottom: 8 }}>Could not load sheet data</div>
        <div style={{ fontSize: 12, ...S.text2, marginBottom: 16 }}>{error}</div>
        <div style={{ fontSize: 11, ...S.text3 }}>
          Make sure your Sheet is shared as "Anyone with link → Viewer"<br />
          and the SHEET_ID at the top of this file is correct.
        </div>
      </div>
    </div>
  );

  // ─── NAV ───────────────────────────────────────────────
  const navTabs = ["dashboard", "teams", "players", "divisions"];

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={{ background: "#0F0F1C", borderBottom: "1px solid rgba(255,255,255,0.09)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "18px 24px 0" }}>
          {/* Logo Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <OrgLogo org="God Slayers" size={46} />
              <div style={{ fontSize: 10, ...S.text3, lineHeight: 1.4 }}>God<br />Slayers</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <OrgLogo org="Aim2Dominate" size={64} />
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 6 }}>
                Celestial League
              </div>
              <div style={{ fontSize: 11, ...S.text3, marginTop: 2 }}>Women's League · Season 1</div>
            </div>
            <div style={{ width: 56 }} />
          </div>

          {/* Nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <nav style={{ display: "flex" }}>
              {navTabs.map((t) => (
                <button key={t} onClick={() => { setTab(t); setSearch(""); setDivF(""); }}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    padding: "10px 16px", fontSize: 12, fontWeight: tab === t ? 700 : 400,
                    color: tab === t ? "#F2F2FF" : "#44445A",
                    borderBottom: `2px solid ${tab === t ? "#8B2557" : "transparent"}`,
                    textTransform: "capitalize", letterSpacing: 0.3, transition: "color 0.15s",
                  }}>
                  {t}
                </button>
              ))}
            </nav>
            <div style={{ fontSize: 11, ...S.text3, paddingRight: 4 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#16A34A", marginRight: 5, verticalAlign: "middle" }} />
              Live · {teams.length} submissions
            </div>
          </div>
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px" }}>

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.2px" }}>League Overview</div>
              <div style={{ fontSize: 11, ...S.text3 }}>Valid as of 5/24/26</div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8, marginBottom: 24 }}>
              {[
                ["Teams",     teams.length],
                ["Players",   allPlayers.filter(p => p.s.startsWith("P")).length],
                ["Subs",      allPlayers.filter(p => p.s.startsWith("S")).length],
                ["Divisions", Object.keys(DIVISIONS).length],
              ].map(([label, val]) => (
                <div key={label} style={{ ...S.surface, padding: "14px 16px" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-1px", lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 10, ...S.text2, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Division Cards */}
            {Object.entries(DIVISIONS).map(([name, d]) => {
              const divTeams = teams.filter(t => t.division === name);
              return (
                <div key={name} style={{ ...S.surface, overflow: "hidden", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width: 3, height: 36, background: d.c, borderRadius: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{name} League</div>
                      <div style={{ fontSize: 11, ...S.text3, marginTop: 2 }}>{d.label} · {d.sr}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: d.c }}>{divTeams.length}</div>
                      <div style={{ fontSize: 10, ...S.text3 }}>teams</div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {divTeams.length === 0
                      ? <span style={{ fontSize: 12, ...S.text3, fontStyle: "italic" }}>No teams submitted yet</span>
                      : divTeams.map(t => (
                        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 7, background: "#1C1C30", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5, padding: "5px 10px" }}>
                          <OrgLogo org={t.org} size={20} />
                          <span style={{ fontSize: 12, fontWeight: 500, color: "#8888A8" }}>{t.org}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── TEAMS ── */}
        {tab === "teams" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>
                Teams <span style={{ fontSize: 12, ...S.text3, fontWeight: 400 }}>({filtered.length})</span>
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search org or Activision ID…"
                style={{ background: "#0F0F1C", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 6, padding: "7px 12px", color: "#F2F2FF", fontSize: 12, outline: "none", width: 220 }} />
              <select value={divF} onChange={e => setDivF(e.target.value)}
                style={{ background: "#0F0F1C", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 6, padding: "7px 10px", color: "#F2F2FF", fontSize: 12, outline: "none" }}>
                <option value="">All Divisions</option>
                {Object.keys(DIVISIONS).map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            {filtered.map(t => {
              const d    = DIVISIONS[t.division] || { c: "#888" };
              const avg  = avgSR(t.players);
              const isEx = expanded[t.id];
              return (
                <div key={t.id} style={{ ...S.surface, overflow: "hidden", marginBottom: 8, borderLeft: `3px solid ${d.c}` }}>
                  <div onClick={() => setExpanded(p => ({ ...p, [t.id]: !p[t.id] }))}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}>
                    <OrgLogo org={t.org} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.org}</div>
                      <div style={{ fontSize: 11, ...S.text3, marginTop: 1 }}>{t.twitter}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      <DivBadge name={t.division} />
                      {avg > 0 && <span style={{ fontSize: 11, ...S.text3 }}>{avg.toLocaleString()} SR avg</span>}
                      <span style={{ fontSize: 11, ...S.text3, transform: isEx ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>▼</span>
                    </div>
                  </div>

                  {isEx && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                        <thead>
                          <tr style={{ background: "#151525" }}>
                            {[["14%","Slot"],["36%","Activision ID"],["24%","Rank & SR"],["14%","SR"],["12%",""]].map(([w,h]) => (
                              <th key={h} style={{ width: w, padding: "8px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#44445A", textTransform: "uppercase", letterSpacing: "0.7px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {t.players.map((p, i) => {
                            const isSub = p.s.startsWith("S");
                            return (
                              <tr key={i} style={{ background: i % 2 ? "#0F0F1C" : "#09090F", opacity: (!p.id || isSub) ? 0.5 : 1 }}>
                                <td style={{ padding: "8px 14px", fontSize: 11, fontWeight: 600, color: "#44445A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{p.s}</td>
                                <td style={{ padding: "8px 14px", fontSize: 11, fontFamily: "'SF Mono','Consolas',monospace", color: p.id ? "#F2F2FF" : "#44445A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{p.id || "—"}</td>
                                <td style={{ padding: "8px 14px", fontSize: 12, color: "#8888A8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{p.rankStr || "—"}</td>
                                <td style={{ padding: "8px 14px", fontSize: 12, fontWeight: 700, color: srColor(p.sr), borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{p.sr ? p.sr.toLocaleString() : "—"}</td>
                                <td style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)" }} />
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div style={{ padding: "8px 16px", background: "#151525", display: "flex", gap: 16 }}>
                        <span style={{ fontSize: 10, ...S.text3 }}>Submitted: {t.submitted}</span>
                        <span style={{ fontSize: 10, ...S.text3 }}>{DIVISIONS[t.division]?.label} · {DIVISIONS[t.division]?.sr}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ── PLAYERS ── */}
        {tab === "players" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>
                Players <span style={{ fontSize: 12, ...S.text3, fontWeight: 400 }}>({allPlayers.length})</span>
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search ID, org, rank…"
                style={{ background: "#0F0F1C", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 6, padding: "7px 12px", color: "#F2F2FF", fontSize: 12, outline: "none", width: 220 }} />
            </div>
            <div style={{ ...S.surface, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead>
                  <tr style={{ background: "#151525" }}>
                    {[["20%","Organization"],["10%","Slot"],["28%","Activision ID"],["18%","Rank"],["9%","SR"],["15%","Division"]].map(([w,h]) => (
                      <th key={h} style={{ width: w, padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#44445A", textTransform: "uppercase", letterSpacing: "0.7px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPlayers
                    .filter(p => !search || p.id.toLowerCase().includes(search.toLowerCase()) || p.org.toLowerCase().includes(search.toLowerCase()) || p.rank?.toLowerCase().includes(search.toLowerCase()))
                    .map((p, i) => {
                      const d    = DIVISIONS[p.div] || { c: "#888" };
                      const isSub = p.s.startsWith("S");
                      return (
                        <tr key={i} style={{ background: i % 2 ? "#0F0F1C" : "#09090F", opacity: isSub ? 0.6 : 1 }}>
                          <td style={{ padding: "8px 14px", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{p.org}</td>
                          <td style={{ padding: "8px 14px", fontSize: 11, color: isSub ? "#44445A" : "#8888A8", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{p.s}</td>
                          <td style={{ padding: "8px 14px", fontSize: 11, fontFamily: "'SF Mono','Consolas',monospace", color: "#8888A8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{p.id}</td>
                          <td style={{ padding: "8px 14px", fontSize: 12, color: "#8888A8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{p.rankStr || "—"}</td>
                          <td style={{ padding: "8px 14px", fontSize: 12, fontWeight: 700, color: srColor(p.sr), borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{p.sr ? p.sr.toLocaleString() : "—"}</td>
                          <td style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}><DivBadge name={p.div} /></td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── DIVISIONS ── */}
        {tab === "divisions" && (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Division Breakdown</div>
            {Object.entries(DIVISIONS).map(([name, d]) => {
              const divTeams  = teams.filter(t => t.division === name);
              const mainPl    = divTeams.flatMap(t => t.players.filter(p => p.s.startsWith("P") && p.sr));
              const avg       = mainPl.length ? Math.round(mainPl.reduce((a, b) => a + b.sr, 0) / mainPl.length) : 0;
              return (
                <div key={name} style={{ ...S.surface, overflow: "hidden", marginBottom: 14, borderLeft: `4px solid ${d.c}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: d.c }}>{name} League</div>
                      <div style={{ fontSize: 11, color: "#44445A", marginTop: 2 }}>{d.label} · {d.sr}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: d.c }}>{divTeams.length}</div>
                      <div style={{ fontSize: 10, color: "#44445A" }}>teams</div>
                    </div>
                    {avg > 0 && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: d.c }}>{avg.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: "#44445A" }}>avg SR</div>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "16px 18px" }}>
                    {divTeams.length === 0
                      ? <div style={{ fontSize: 12, color: "#44445A", fontStyle: "italic" }}>No teams submitted yet.</div>
                      : divTeams.map(t => (
                        <div key={t.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                            <OrgLogo org={t.org} size={24} />
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{t.org}</span>
                            <span style={{ fontSize: 11, color: "#44445A" }}>{t.twitter}</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {t.players.filter(p => p.id).map((p, i) => {
                              const isSub = p.s.startsWith("S");
                              return (
                                <span key={i} style={{ background: "#1C1C30", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "3px 8px", fontSize: 10, display: "inline-flex", gap: 5, opacity: isSub ? 0.5 : 1 }}>
                                  <span style={{ color: "#44445A", fontWeight: 600 }}>{p.s.replace("Player ", "P").replace("Sub ", "S")}</span>
                                  <span style={{ color: "#8888A8" }}>{p.id.split("#")[0]}</span>
                                  {p.sr && <span style={{ color: srColor(p.sr), fontWeight: 700 }}>{p.sr.toLocaleString()}</span>}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "14px 24px", textAlign: "center", marginTop: 24 }}>
        <div style={{ fontSize: 10, color: "#44445A" }}>
          Celestial League · Aim2Dominate Women's League · Partnered with GodSlayers · Data synced live from Google Sheets
        </div>
      </div>
    </div>
  );
}
