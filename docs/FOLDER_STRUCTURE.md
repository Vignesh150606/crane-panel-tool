# Folder Structure

```
crane-panel-tool/
├── frontend/                        React 19 + Vite SPA
│   └── src/
│       ├── pages/                   One file per route (18 pages) — see below
│       ├── components/
│       │   ├── ui/                  Design-system primitives: Card, Button, Badge,
│       │   │                        NumberField, FormulaExplainer, HandbookEntry,
│       │   │                        CollapsibleSection, StatPlate, Toast, …
│       │   ├── layout/              App shell: Sidebar, MobileHeader, CommandPalette
│       │   │                        (⌘K search), ContextPanel, WorkflowStepper,
│       │   │                        ProjectStatusBar, Breadcrumb, PageTransition
│       │   ├── training/            MiniControlCircuit + InspectionPanel — shared by
│       │   │                        Challenge Mode and Virtual Commissioning
│       │   ├── tutor/                TutorPanel, TutorMessage, SuggestedQuestions
│       │   ├── CraneDiagram.jsx     Standalone SVG illustration
│       │   └── illustrations/       PanelSchematic and similar static SVG art
│       ├── tutor/                    Engineering Tutor logic (not UI — see components/tutor
│       │                            for that): tutorStore, contextBuilder, retrieval,
│       │                            tutorApi, pageContextStore, useTutorPageContext
│       ├── store/                    Zustand stores, persisted to localStorage:
│       │                            projectStore (the design itself), trainingStore
│       │                            (practice progress — deliberately separate, see
│       │                            its own file comment), handbookStore, tierStore,
│       │                            uiStore
│       ├── data/                     Static reference data as plain JS, not fetched:
│       │                            handbookContent.js (the Engineering Handbook),
│       │                            workspaceIndex.js (cross-page search index +
│       │                            "related topics" + "next step" logic),
│       │                            craneData.js, faultLibrary.js, panelComponents.js,
│       │                            cableReference.js, commissioningChecklist.js
│       ├── config/navigation.js      Single source of truth for the nav sidebar,
│       │                            Home page cards, and route metadata
│       │                            (findNavItem/ALL_NAV_ITEMS)
│       ├── lib/                      relayLogic.js (the interlock decision function
│       │                            shared by ControlCircuit and MiniControlCircuit),
│       │                            safeStorage.js (localStorage wrapper that
│       │                            degrades gracefully if storage is unavailable),
│       │                            validate.js
│       ├── hooks/                    useCountUp, useToast
│       ├── api/                      client.js (fetch wrapper — timeouts, error
│       │                            shaping, optional headers), calculations.js
│       │                            (typed wrappers per calculator endpoint)
│       ├── App.jsx                   Routes (React.lazy per page), AppShell layout
│       └── main.jsx                  Entry point
│
├── backend/                          FastAPI
│   └── app/
│       ├── main.py                   App instance, CORS, router registration
│       ├── engineering.py            Pure calculation functions — the actual
│       │                            engineering. No I/O, no side effects.
│       ├── explain.py                Generates the tiered FormulaExplainer content
│       ├── models.py                 Pydantic request/response models for the
│       │                            calculator endpoints
│       ├── config.py                 ALLOWED_ORIGINS (CORS) from env
│       ├── status.py                 /health
│       ├── data/standards.py         IEC/IS reference tables (efficiency classes,
│       │                            duty classes, etc.)
│       ├── routers/                  calculations.py (/api/motor, /api/nameplate,
│       │                            /api/star-delta), cable.py (/api/cable-busbar),
│       │                            bom.py (/api/bom), tutor.py (/api/tutor/*)
│       └── tutor/                    Engineering Tutor backend (added in V3) —
│                                    config, models, identity (anon id + IP
│                                    resolution), store (Supabase-backed rate
│                                    limit + cache), domain_guard (injection
│                                    detection + cache-eligibility), prompt_builder,
│                                    gemini_client, service (orchestration)
│   └── supabase/schema.sql           Run once in Supabase's SQL editor — creates
│                                    tutor_usage/tutor_cache tables + the atomic
│                                    rate-limit stored procedure
│
├── docs/                             This documentation set + docs/screenshots/
├── README.md                         Setup, feature overview, deployment quick-start
├── CHANGELOG.md
├── V3_ENGINEERING_TUTOR.md           Standalone report from the V3 build pass
├── V1.0_PRODUCTIZATION_REPORT.md     Standalone report from this pass
├── REDESIGN_NOTES.md                 Standalone report from the earlier UI/UX
│                                    redesign phases (pre-dates the training
│                                    platform and tutor)
└── TRAINING_PLATFORM_NOTES.md        Standalone report from the V2 training-
                                     platform build (Panel Explorer, Challenge
                                     Mode, Virtual Commissioning)
```

## Pages (18 routes)

| Route | File | Calls backend? |
|---|---|---|
| `/` | `Home.jsx` | No |
| `/dashboard` | `ProjectDashboard.jsx` | No — reads projectStore/trainingStore only |
| `/handbook` | `EngineeringHandbook.jsx` | No — static content |
| `/crane-selector` | `CraneSelector.jsx` | No — static crane data |
| `/calculator` | `LoadCalculator.jsx` | Yes — `/api/motor` |
| `/nameplate` | `NameplateCalculator.jsx` | Yes — `/api/nameplate` |
| `/cable-busbar` | `CableBusbar.jsx` | Yes — `/api/cable-busbar` |
| `/star-delta` | `StarDelta.jsx` | Yes — `/api/star-delta` |
| `/control-circuit` | `ControlCircuit.jsx` | No — client-side relay logic |
| `/power-circuit` | `PowerCircuit.jsx` | No |
| `/panel-layout` | `PanelLayout.jsx` | No |
| `/bom` | `BOMGenerator.jsx` | Yes — `/api/bom` |
| `/report` | `ProjectReport.jsx` | No — assembles projectStore data |
| `/simulator` | `PanelSimulator.jsx` | No |
| `/fault-diagnosis` | `FaultDiagnosis.jsx` | No — static fault library |
| `/panel-explorer` | `PanelExplorer.jsx` | No |
| `/challenge-mode` | `ChallengeMode.jsx` | No |
| `/commissioning` | `VirtualCommissioning.jsx` | No |

Every page except `LoadCalculator`, `NameplateCalculator`, `CableBusbar`,
`StarDelta`, and `BOMGenerator` runs entirely client-side — no network
dependency beyond the initial page load. The Engineering Tutor panel is the
one thing layered on top of *every* page (mounted once in `App.jsx`), and it
does call the backend (`/api/tutor/ask`, `/api/tutor/usage`).
