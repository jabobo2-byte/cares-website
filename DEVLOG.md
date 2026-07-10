# CARES Website — Development Log

Keep this updated as you work in VS Code. Each entry = one work session. This is your paper trail for the board presentation: what you did, why, and what you used.

Suggested format per entry:
```
## YYYY-MM-DD — Short title
**Did:** what changed
**Why:** the decision behind it
**Sources/tools used:** anything referenced (docs, data, libraries)
```

---

## 2026-07-08 — Project kickoff & proposal

**Did:**
- Reviewed program requirements from CARES.docx (event details, 4 required site sections, color palette, no sign-up/sign-in requirement)
- Sourced real Tennessee road safety facts and laws from official state sources (see list below)
- Chose technical approach: static HTML/CSS/JS frontend, Google Sheets + Apps Script as free data storage, free static hosting for deployment
- Designed a road-signage-inspired visual system (stop-sign red, caution yellow, guide-sign blue, black/white) instead of a generic template
- Built initial site skeleton: `index.html`, `styles.css`, `script.js`
- Built `google-apps-script.gs` — backend that writes form/quiz submissions into a Google Sheet
- Wrote and reviewed `CARES_Website_Proposal.docx` for professor sign-off before continuing the build

**Why:**
- Boss needs quiz scores for research → needed real (free) data storage, not just a demo form
- No account/login requirement → ruled out any auth-based backend, used a plain webhook instead
- Needed free hosting that doesn't require walking someone else through setup → static site + Netlify/GitHub Pages fits

**Sources used for facts/laws:**
- tn.gov/safety/stats/crashdata.html — TN Dept. of Safety & Homeland Security, Teen Driver Crash Statistics 2019–2023
- tn.gov/safety/driver-services.html — Graduated Driver License (GDL) tiers and restrictions
- tntrafficsafety.org — GDL reference materials
- tnroadsafetystandards.org — general road safety standards reference
- TCA 55-9-603 (seatbelt law), TCA 55-8-199 (texting while driving law), TCA 55-8-132 (move-over law)

**Tools used:** Claude (planning, content drafting, code, proposal doc), Google Fonts (Oswald, Public Sans)

**Next up:** get proposal sign-off, then continue building/testing in VS Code — Apps Script deployment, cross-device testing, and final hosting deploy.

---

<!-- Add new entries above this line as you go -->

## 2026-07-08 — Expanded hands-on section, trimmed quiz

**Did:**
- Turned Section 2 from a single reaction test into a 4-game tabbed menu: Stop Sign Reaction, Traffic Light Reaction, Look Both Ways (crosswalk check), Speed Limit Sign Recognition
- Made games self-directed (pick any, no requirement to finish all) to keep total time-per-visitor reasonable at a walk-up event booth
- Added `--signal-green` as a scoped color exception, used only in the Traffic Light game bulb and correct-answer states — kept out of the core brand palette everywhere else
- Reduced quiz from 8 to 6 questions, keeping the 5 "Know the Law" points plus the unbelted-fatality stat for impact
- Ran automated click-through tests (Playwright) on every game, the quiz, and the interest form to confirm no JS errors and correct scoring/feedback

**Why:**
- 5 forced sequential games + an 8-question quiz was too long a commitment for an event booth; self-directed tabs let variety scale without adding required time
- Green is functionally required for a traffic light to read correctly — treated as a one-off exception rather than changing the whole palette

**Tools used:** Playwright (automated browser testing)


