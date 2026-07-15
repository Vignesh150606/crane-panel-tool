// Panel Explorer's component encyclopedia. Ratings here are typical
// reference ranges for teaching purposes (framed as "typical," the same way
// Panel Layout already frames its clearances as "panel-builder practice,
// not a calculated value") — NOT a recalculation of this project's engineering
// logic. Where a component IS something this app already sizes (contactor,
// MPCB, overload relay), relatedCalc points at the real calculator instead
// of restating a number here, so there's exactly one place that value comes
// from.
//
// Two naming notes worth being upfront about (also in TRAINING_PLATFORM_NOTES.md):
//   - "Incoming MCCB" and "MCB" are listed as the brief named them, but this
//     app's own BOM/engineering model (backend/app/routers/bom.py) sizes ONE
//     shared incomer, called "Main MCB" there. Rather than inventing a second
//     sized device that doesn't exist in this app's model, Incoming MCCB here
//     IS that same device (larger panels commonly use an MCCB in that role);
//     MCB here is the separate, smaller breaker protecting the control
//     transformer primary — a real, distinct device this app's calculators
//     don't size.
//   - "KM1/KM2/KM3" (the brief's naming) is shown as one designation per
//     motion (Hoist/LT/CT) — physically each is a forward/reverse contactor
//     pair under electrical interlock (see Control Circuit), not a single
//     physical device. Noted on the component itself, not just here.
export const PANEL_COMPONENTS = [
  {
    id: 'incoming_mccb', label: 'Incoming MCCB', category: 'Incoming & Protection',
    x: 15, y: 20, w: 58, h: 50, color: '#3b82f6',
    function: 'First point of isolation and protection for the whole panel — breaks all three phases on short-circuit or sustained overcurrent, and gives a lockable manual isolation point for maintenance.',
    typicalRating: '100–400A, 415V AC, 3-pole, thermal-magnetic or electronic trip, Icu ≥ 25kA',
    ratingNote: 'This is the same device this app\'s BOM sizes as "Main MCB" (sized to total connected FLC × 1.25) — an MCCB is simply the common choice for that role once the frame current gets past typical MCB range.',
    failureSymptoms: ['Nuisance tripping on motor start (undersized for combined starting current)', 'Won\'t reset — internal trip unit latched or mechanically damaged', 'Overheating at terminals from a loose lug connection'],
    maintenanceTips: ['Torque-check incoming and outgoing terminals per manufacturer spec — loose lugs are the most common cause of nuisance heating', 'Exercise (open/close) periodically even if never tripped — contacts can stick from disuse', 'Verify trip unit setting still matches the actual connected load after any panel modification'],
    interviewQuestions: ['Why size the incomer to the sum of all motors\' starting current, not just running current?', 'What does "Icu" mean on a breaker nameplate, and why does it matter here?'],
    relatedHandbookAnchor: 'mpcb-sizing',
    relatedCalc: { path: '/calculator', label: 'See how total FLC drives incomer sizing' },
    relatedPage: { path: '/power-circuit', label: 'See it in the Power Circuit' },
  },
  {
    id: 'mcb', label: 'MCB (Control Supply)', category: 'Incoming & Protection',
    x: 78, y: 20, w: 48, h: 50, color: '#60a5fa',
    function: 'Small dedicated breaker protecting the control transformer primary (and sometimes the 110V secondary separately) — an overload or short here shouldn\'t be handled by the main incomer.',
    typicalRating: '2–10A, 415V AC, 2-pole or 3-pole, C-curve',
    ratingNote: 'Not sized by this app\'s calculators — chosen from the control transformer\'s own primary current, which is typically small enough that a fixed small-frame MCB covers the whole practical range.',
    failureSymptoms: ['Entire control circuit dead but main power still present (motors don\'t start, no indicator lamps)', 'Trips repeatedly right after reset — points at a downstream control-side short, not the breaker itself'],
    maintenanceTips: ['Label it clearly as "control supply" — it\'s easy to mistake for a spare/unused breaker during troubleshooting', 'Check it before assuming a "dead panel" is the main incomer or transformer\'s fault'],
    interviewQuestions: ['Why protect the control transformer with its own small breaker instead of relying on the main incomer?', 'If the whole control circuit is dead but the motors\' power circuit still has supply, where do you check first?'],
    relatedHandbookAnchor: null,
    relatedCalc: null,
    relatedPage: { path: '/control-circuit', label: 'See the 110V rail it protects' },
  },
  {
    id: 'spp', label: 'SPP', category: 'Incoming & Protection',
    x: 131, y: 20, w: 48, h: 50, color: '#8b5cf6',
    function: 'Single Phase Preventer — continuously monitors phase balance and sequence on the incoming supply, and opens its output relay contact fast if a phase is lost or the sequence is wrong, before a running motor is damaged.',
    typicalRating: '415V AC 3-phase sense input, adjustable imbalance trip (~±15–20%), output relay contact rated for contactor-coil control current',
    failureSymptoms: ['Motor hums but won\'t start, or trips immediately on start attempt', 'Panel appears dead on start even though incoming 3-phase supply is present'],
    maintenanceTips: ['Verify trip point periodically — a drifted-too-sensitive SPP nuisance-trips on normal supply fluctuation', 'Confirm phase sequence at commissioning, not just phase presence — SPP catches both, but they\'re different failure modes'],
    interviewQuestions: ['Why can\'t the motor\'s own thermal overload relay reliably catch single phasing fast enough?', 'What\'s the difference between a phase LOSS fault and a phase SEQUENCE fault, and does SPP catch both?'],
    relatedHandbookAnchor: null,
    relatedCalc: null,
    relatedPage: { path: '/power-circuit', label: 'See it in the protection chain' },
  },
  {
    id: 'transformer', label: 'Control Transformer', category: 'Incoming & Protection',
    x: 184, y: 20, w: 66, h: 50, color: '#94a3b8',
    function: 'Steps incoming 415V down to a safer 110V (sometimes 24V) control voltage for push buttons, relay coils, contactor coils and indicator lamps — isolates the control circuit from the full line voltage.',
    typicalRating: '415V/110V, 100–500VA typical for a crane panel\'s control load, per IS 12021 / IEC 61558-2-6',
    ratingNote: 'VA sizing isn\'t currently calculated by this app — it depends on the sum of every simultaneously-energized coil\'s VA draw, which would need a coil-inventory feature this app doesn\'t have yet.',
    failureSymptoms: ['Control voltage present but low/sagging under load — contactor chatter symptom (see Challenge Mode)', 'No control voltage at all — primary fuse/MCB blown or winding open'],
    maintenanceTips: ['Check secondary voltage under load, not just at no-load — a marginally-sized or aging transformer sags exactly when several coils pull in together', 'Verify both primary and secondary fusing/breaker protection are present and correctly rated'],
    interviewQuestions: ['Why step down to 110V for control wiring instead of switching 415V directly at the push buttons?', 'If a contactor chatters only when another motion starts at the same time, what does that suggest about the transformer?'],
    relatedHandbookAnchor: null,
    relatedCalc: null,
    relatedPage: { path: '/control-circuit', label: 'See the 110V rail it supplies' },
  },
  {
    id: 'mpcb', label: 'MPCB', category: 'Motor Protection',
    x: 15, y: 85, w: 110, h: 45, color: '#f5a623',
    function: 'Motor Protection Circuit Breaker — one per motion (Hoist/LT/CT), combining short-circuit protection with an adjustable thermal-magnetic trip set close to that specific motor\'s FLC. Selective: a fault on one motion trips only that MPCB.',
    typicalRating: '0.4–32A adjustable range (motor-dependent), 415V AC, motor-rated combination breaker, per IEC 60947-2',
    relatedCalc: { path: '/calculator', label: 'See the calculated MPCB rating for each motor' },
    failureSymptoms: ['Trips on every motor start (set too close to FLC — no allowance for starting current)', 'Never trips on a genuine overload (setting drifted too high or wrong motor\'s FLC used)'],
    maintenanceTips: ['Re-verify the trip setting any time a motor is swapped or rewound — it\'s sized to that motor\'s specific FLC, not a generic value', 'Test the trip mechanism periodically, not just visually inspect it — a breaker can look fine and still fail to trip'],
    interviewQuestions: ['Why does a crane panel use one MPCB per motion instead of one large breaker for all three motors?', 'A motor draws 6–8× FLC for a few seconds at start — how does the MPCB avoid nuisance-tripping on that?'],
    relatedHandbookAnchor: 'mpcb-sizing',
    relatedPage: { path: '/power-circuit', label: 'See it in the per-motion branch' },
  },
  {
    id: 'olr', label: 'OLR', category: 'Motor Protection',
    x: 130, y: 85, w: 120, h: 45, color: '#eab308',
    function: 'Thermal Overload Relay — a bimetallic (or electronic) element that trips its NC contact, de-energizing the contactor coil, when current stays above the set point long enough to represent real winding heating. Manual reset only, by design.',
    typicalRating: 'Class 10A or 10, adjustable range bracketing the motor\'s FLC, per IEC 60947-4-1',
    relatedCalc: { path: '/calculator', label: 'See the calculated overload setting for each motor' },
    failureSymptoms: ['Motor stops suddenly mid-operation, casing hot to touch (see Challenge Mode: Overload Trip)', 'Won\'t reset even after cooldown — mechanical latch fault or still genuinely too hot'],
    maintenanceTips: ['Set at ~105% of motor FLC, never at the breaker/contactor rating — those are sized with margin on purpose, the OLR isn\'t', 'Never bypass or auto-reset-defeat an OLR that trips repeatedly — find the mechanical or electrical cause first'],
    interviewQuestions: ['Why does a thermal overload relay deliberately NOT self-reset, unlike some other protection devices?', 'A candidate resets the OLR and immediately re-runs the motor without checking anything else — what\'s wrong with that?'],
    relatedHandbookAnchor: 'overload-relay',
    relatedPage: { path: '/fault-diagnosis', label: 'Walk through an Overload Trip fault' },
  },
  {
    id: 'km1', label: 'KM1 — Hoist Contactor', category: 'Switching',
    x: 15, y: 145, w: 76, h: 45, color: '#f0453d',
    function: 'Switches 3-phase power to the Hoist motor. Shown here as one designation for the motion; physically a Forward(Up)/Reverse(Down) contactor pair, electrically interlocked so only one can close at a time.',
    typicalRating: '9–95A AC-3 (load-dependent), 3-pole + 1NO/1NC auxiliary, coil 110V AC, per IEC 60947-4-1',
    relatedCalc: { path: '/calculator', label: 'See the calculated contactor rating for Hoist' },
    failureSymptoms: ['Audible chatter, visible arcing at contacts (see Challenge Mode: Contactor Chatter)', 'Contacts welded closed after an uncleared overload — both directions may become live at once'],
    maintenanceTips: ['Inspect contact tips for pitting/wear on a schedule tied to duty cycle, not calendar time alone — crane duty is repeated start/stop, harder on contacts than continuous run', 'Verify the mechanical/electrical interlock between the Fwd and Rev contactor of the same motion is still intact after any replacement'],
    interviewQuestions: ['Why are crane-duty contactors rated using the AC-3 category specifically?', 'What physically happens if both the Up and Down contactor of the same motion close together?'],
    relatedHandbookAnchor: 'contactor-sizing',
    relatedPage: { path: '/control-circuit', label: 'See the interlock that protects it' },
  },
  {
    id: 'km2', label: 'KM2 — Long Travel Contactor', category: 'Switching',
    x: 96, y: 145, w: 76, h: 45, color: '#f0453d',
    function: 'Switches 3-phase power to the Long Travel motor, moving the crane bridge along the runway. Forward/Reverse pair, same interlock principle as KM1.',
    typicalRating: '9–95A AC-3 (load-dependent), 3-pole + 1NO/1NC auxiliary, coil 110V AC, per IEC 60947-4-1',
    relatedCalc: { path: '/calculator', label: 'See the calculated contactor rating for Long Travel' },
    failureSymptoms: ['One direction works, the opposite doesn\'t (see Challenge Mode: Reverse/Forward Fails)', 'Nothing happens on either direction — check upstream MPCB and master feed first'],
    maintenanceTips: ['Long Travel sees the most duty cycles on most crane installations — prioritize it in a contact-wear inspection schedule', 'Check the auxiliary contact used for interlock/sealing separately from the main power contacts — they wear differently'],
    interviewQuestions: ['If Long Travel FORWARD works but REVERSE doesn\'t, and the opposite motion\'s contactor is confirmed healthy, where do you look next?'],
    relatedHandbookAnchor: 'contactor-sizing',
    relatedPage: { path: '/control-circuit', label: 'See the interlock that protects it' },
  },
  {
    id: 'km3', label: 'KM3 — Cross Travel Contactor', category: 'Switching',
    x: 177, y: 145, w: 76, h: 45, color: '#f0453d',
    function: 'Switches 3-phase power to the Cross Travel motor, moving the crab across the bridge. Forward/Reverse pair, same interlock principle as KM1/KM2.',
    typicalRating: '9–95A AC-3 (load-dependent), 3-pole + 1NO/1NC auxiliary, coil 110V AC, per IEC 60947-4-1',
    relatedCalc: { path: '/calculator', label: 'See the calculated contactor rating for Cross Travel' },
    failureSymptoms: ['Motion works in test/no-load but drops out under load — undersized or worn contact resistance causing voltage drop', 'Contactor buzzes continuously rather than pulling in cleanly'],
    maintenanceTips: ['Cross Travel contactors on outdoor/exposed cranes see more contamination — inspect enclosure sealing alongside the contacts themselves'],
    interviewQuestions: ['Why do all three motions (Hoist, LT, CT) get independent contactor pairs instead of sharing switching hardware?'],
    relatedHandbookAnchor: 'contactor-sizing',
    relatedPage: { path: '/control-circuit', label: 'See the interlock that protects it' },
  },
  {
    id: 'push_buttons', label: 'Push Buttons', category: 'Operator Interface',
    x: 15, y: 205, w: 118, h: 45, color: '#3fb950',
    function: 'Momentary NO contacts for each direction/motion (hold-to-run), plus a latching NC mushroom-head E-Stop. The entire control philosophy in this app\'s Control Circuit is built on these being momentary, not latching.',
    typicalRating: '22mm mounting, NO or NO+NC contact block, IP65-rated boot for pendant-mounted use, 110V AC coil-circuit duty',
    failureSymptoms: ['Direction doesn\'t respond even though the relay/contactor for it tests fine — worn or dirty NO contact inside the button', 'Button stays "stuck on" mechanically after release — mechanical return spring failure'],
    maintenanceTips: ['Pendant-mounted buttons see the most mechanical wear and moisture ingress of any control device — inspect boot seals and contact action on a shorter interval than panel-mounted devices', 'Never defeat the E-Stop\'s latching mechanism to "make it more convenient" — that\'s a safety-function change, not a maintenance shortcut'],
    interviewQuestions: ['Why is a hold-to-run push button (not a latching one) the standard for crane motion controls?', 'What\'s the practical difference in wiring between a Start push button and the E-Stop?'],
    relatedHandbookAnchor: 'no-nc-contacts',
    relatedPage: { path: '/control-circuit', label: 'Press them live in the Control Circuit' },
  },
  {
    id: 'indicator_lamps', label: 'Indicator Lamps', category: 'Operator Interface',
    x: 137, y: 205, w: 116, h: 45, color: '#22d3ee',
    function: 'Panel-mounted LED indicators showing supply-on, motion-running, and fault states at a glance — lets an operator or technician read panel status without opening the enclosure.',
    typicalRating: '22mm LED, 110V AC or 24V DC (matched to control voltage), red/green/amber per IEC 60204-1 colour convention',
    failureSymptoms: ['Lamp stays off even though the circuit it monitors is genuinely energized — burnt LED module or loose lamp-holder connection', 'Lamp stays on/glowing dim when it should be fully off — leakage current through a nearby circuit, or wrong voltage-dropping resistor'],
    maintenanceTips: ['Confirm lamp colour-coding follows IEC 60204-1 (red = fault/emergency, amber = abnormal/caution, green = normal/running) rather than site-specific habit', 'A "lamp says it\'s fine" should never be the only check during commissioning — verify the actual state independently the first time'],
    interviewQuestions: ['Why shouldn\'t a technician trust an indicator lamp as the sole evidence a circuit is actually energized?'],
    relatedHandbookAnchor: null,
    relatedCalc: null,
    relatedPage: { path: '/commissioning', label: 'Verify indicators in Virtual Commissioning' },
  },
  {
    id: 'terminal_blocks', label: 'Terminal Blocks', category: 'Wiring',
    x: 15, y: 265, w: 238, h: 35, color: '#94a3b8',
    function: 'DIN-rail mounted termination points between field wiring (motors, limit switches, pendant) and internal panel wiring — every external connection passes through here, never spliced directly.',
    typicalRating: '2.5–6mm² screw or spring-cage clamp, DIN rail mount, individually marked per the wiring diagram reference',
    failureSymptoms: ['Intermittent fault that comes and goes with vibration — classic loose terminal screw symptom', 'Correct voltage measured right up to a terminal, nothing beyond it — the terminal connection itself is the open point'],
    maintenanceTips: ['Torque-check terminals on a schedule, especially any that see vibration (crane bridge/trolley-mounted junction points) — thermal cycling loosens screw terminals over time', 'Keep terminal marking legible and matched to the as-built wiring diagram — a relabeled or unlabeled terminal block turns every future fault-find into guesswork'],
    interviewQuestions: ['Why does the voltage-drop test method (see Fault Diagnosis) work just as well for finding a bad terminal as a bad contact?', 'Why route field wiring through terminal blocks instead of splicing directly to internal panel wiring?'],
    relatedHandbookAnchor: null,
    relatedCalc: null,
    relatedPage: { path: '/panel-layout', label: 'See their position in the panel layout' },
  },
]

export function getPanelComponent(id) {
  return PANEL_COMPONENTS.find((c) => c.id === id) || null
}

export const PANEL_CATEGORIES = [...new Set(PANEL_COMPONENTS.map((c) => c.category))]
