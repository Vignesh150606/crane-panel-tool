// Single source of truth for every fault scenario in the app. The first
// five entries (symptoms/cause/diagnosis/fix/component/interviewTip) are
// unchanged from FaultDiagnosis.jsx's original FAULTS array — moved here so
// Challenge Mode can extend the SAME scenarios with interactive fields
// (simConfig/inspectionChecks/diagnosisOptions/hints) instead of defining a
// second, drifting copy. FaultDiagnosis.jsx now imports from here.
//
// Two interaction shapes, not one, because not every fault is representable
// the same way:
//   - simConfig: faults that are genuinely part of the FWD/REV relay
//     interlock this app already models (see MiniControlCircuit +
//     lib/relayLogic.js) — the user operates a live, fault-injected circuit.
//   - inspectionChecks: faults outside that model (phase sequence, brake
//     circuit, transformer sag, an aux contact feeding an indicator lamp) —
//     the user clicks "test points" to reveal readings, the same
//     find-the-open-point method FaultDiagnosis's own explainer teaches.
// A fault can have either, and diagnosisOptions/hints apply either way.
export const FAULTS = [
  {
    id: 'phase_loss',
    title: 'Single Phasing',
    difficulty: 'beginner',
    symptoms: ["Motor hums but doesn't rotate", 'SPP trips immediately', 'Increased current on remaining phases'],
    cause: 'One of the three supply phases (R/Y/B) has lost continuity — blown fuse, loose connection, or cable damage.',
    diagnosis: 'SPP (Single Phase Preventer) detects the imbalance and opens its output contact, de-energizing the main contactor coil.',
    fix: 'Check incoming supply at MCB terminals with a multimeter on each phase. Identify the missing phase, check the upstream fuse/breaker and cable continuity.',
    component: 'SPP',
    interviewTip: "Why can't the motor's own overload relay always catch this fast enough on its own? Total current can look close to normal while the two remaining phases each carry roughly double the per-phase load — a thermal element watching total current doesn't see that imbalance directly, which is exactly why a dedicated phase-loss device exists instead of relying on the overload relay alone.",
    inspectionChecks: [
      { id: 'v_ry', label: 'Measure R-Y at incomer', reading: '415V', abnormal: false },
      { id: 'v_yb', label: 'Measure Y-B at incomer', reading: '0V', abnormal: true, note: 'Y phase not present at this terminal.' },
      { id: 'v_rb', label: 'Measure R-B at incomer', reading: '415V', abnormal: false },
      { id: 'spp_status', label: 'Check SPP trip indicator', reading: 'TRIPPED', abnormal: true },
    ],
    diagnosisOptions: [
      { id: 'a', text: 'Y phase lost upstream of the incomer (blown fuse or loose connection) — SPP correctly tripped to prevent motor damage', correct: true, rationale: 'Two line pairs read full voltage, one reads zero — that isolates the missing phase directly. The SPP tripping is it doing its job, not a fault of its own.' },
      { id: 'b', text: 'The SPP itself has failed and needs replacing', correct: false, rationale: 'The SPP tripped correctly given what it measured — nothing here shows the SPP misreading a healthy supply.' },
      { id: 'c', text: 'Overload relay is set incorrectly', correct: false, rationale: 'The OLR was never even in the fault path here — the SPP opened the circuit before the motor drew any sustained current.' },
      { id: 'd', text: 'Motor winding has an internal fault', correct: false, rationale: 'A winding fault wouldn\'t explain a 0V reading on a supply-side line pair measured at the incomer, before the motor.' },
    ],
    hints: [
      'Compare all three line-to-line voltages, not just one.',
      'The SPP tripping here is doing its job — ask what it\'s protecting against, not whether it\'s faulty.',
      'Two voltage pairs read normal and one reads zero. Which single phase, if missing, produces exactly that pattern?',
    ],
    handbookAnchor: null,
  },
  {
    id: 'overload_trip',
    title: 'Overload Relay Trip',
    difficulty: 'beginner',
    symptoms: ['Motor stops suddenly during operation', 'Overload relay trip flag visible', 'Motor casing hot to touch'],
    cause: 'Motor drawing current above the overload relay setting for an extended period — mechanical jam, excessive load, or voltage imbalance.',
    diagnosis: 'Thermal overload relay bimetallic strip heats up and trips its NC contact in the contactor coil circuit, de-energizing the contactor.',
    fix: 'Check for mechanical obstruction on crane motion. Verify overload setting matches motor FLC (should be ~105% of FLC). Allow cooldown before reset.',
    component: 'Overload Relay',
    interviewTip: 'A candidate who immediately resets and re-runs the motor without checking for a mechanical jam first hasn\'t actually fixed anything — the relay tripped for a reason, and resetting clears the symptom, not the cause. This is the fault most likely to repeat within minutes if skipped.',
    simConfig: { motionLabel: 'Hoist', fwdLabel: 'UP', revLabel: 'DOWN', showMasterControls: true, showLimitControls: false, faults: { overloadWontReset: 'always' } },
    inspectionChecks: [
      { id: 'casing_temp', label: 'Touch motor casing (panel isolated first)', reading: 'Hot to the touch', abnormal: true },
      { id: 'mech_jam', label: 'Hand-rotate the motion mechanically', reading: 'Binding / resistance felt', abnormal: true },
      { id: 'olr_setting', label: 'Check OLR dial vs. motor nameplate FLC', reading: 'Set correctly at ~105% FLC', abnormal: false },
    ],
    diagnosisOptions: [
      { id: 'a', text: 'Mechanical obstruction is causing sustained overcurrent — the OLR tripped correctly', correct: true, rationale: 'A hot casing plus felt mechanical binding, with the OLR setting confirmed correct, points at the load itself, not the protection device.' },
      { id: 'b', text: 'OLR is set too low and nuisance-tripping', correct: false, rationale: 'The setting check came back correct at ~105% FLC — a nuisance-trip diagnosis needs the setting to actually be wrong.' },
      { id: 'c', text: 'Contactor coil is faulty', correct: false, rationale: 'A hot motor casing and felt mechanical binding have nothing to do with the contactor coil — they point upstream of it, at the load.' },
      { id: 'd', text: 'MPCB is undersized for this motor', correct: false, rationale: 'An undersized MPCB would trip on starting current almost immediately, not after a period of running — this tripped the OLR, a different device.' },
    ],
    hints: [
      'The OLR tripping is a symptom being reported correctly, not necessarily the root fault — ask what made it trip.',
      'Compare what you feel at the motor casing and mechanism to what the OLR setting tells you.',
      'If the setting is confirmed correct and the motor is hot, the sustained overcurrent has to be coming from somewhere physical.',
    ],
    handbookAnchor: 'overload-relay',
  },
  {
    id: 'limit_stuck',
    title: 'Limit Switch Stuck (Open)',
    difficulty: 'beginner',
    symptoms: ["One direction of motion doesn't work", 'Opposite direction works fine', 'No fault indication on panel'],
    cause: 'Limit switch roller mechanically stuck in pressed position, or wiring to limit switch broken (open circuit on NC contact).',
    diagnosis: 'The stuck-open NC contact permanently breaks the relay coil circuit for that direction, so the relay never energizes regardless of push button.',
    fix: 'Inspect limit switch roller for mechanical binding/debris. Check continuity of NC contact with a multimeter — should read 0Ω when not triggered.',
    component: 'Limit Switch',
    interviewTip: '"No fault indication on panel" is the diagnostic giveaway here — electrically, a stuck-open limit switch looks identical to nobody pressing the button at all. Symptom #2 (the opposite direction still works fine) is what actually separates this from "the push button itself is broken."',
    simConfig: { motionLabel: 'Long Travel', fwdLabel: 'FORWARD', revLabel: 'REVERSE', showMasterControls: false, showLimitControls: true, faults: { limitFwdStuckOpen: true } },
    diagnosisOptions: [
      { id: 'a', text: 'Limit FWD switch mechanically stuck in the triggered position', correct: true, rationale: 'FORWARD never energizes no matter what you press, REVERSE works fine, and the Limit FWD indicator reads triggered even with nothing near it — that\'s a stuck switch, not a button or relay fault.' },
      { id: 'b', text: 'PB FWD push button is broken', correct: false, rationale: 'A broken push button would mean pbFwd never shows as pressed at all — here the button responds, but the relay still never energizes because the limit contact is open.' },
      { id: 'c', text: 'R-FWD relay coil is burnt out', correct: false, rationale: 'A dead coil is possible in principle, but the Limit FWD indicator already shows triggered with nothing physically at the limit — that\'s the more direct explanation and the one the evidence actually points to.' },
      { id: 'd', text: 'FWD contactor is welded open', correct: false, rationale: '"Welded open" isn\'t a real contactor failure mode — contacts weld CLOSED under arcing, not open.' },
    ],
    hints: [
      'One direction fails, the other works — that already rules out anything in the shared master feed.',
      'Check each contact\'s live state in the diagram before assuming which device is at fault.',
      'A limit switch reading "triggered" with nothing physically at the limit is the tell.',
    ],
    handbookAnchor: 'no-nc-contacts',
  },
  {
    id: 'contactor_chatter',
    title: 'Contactor Chattering',
    difficulty: 'intermediate',
    symptoms: ['Buzzing/chattering sound from contactor', 'Motor starts and stops rapidly', 'Visible arcing at contacts'],
    cause: 'Low control voltage (110V coil supply dropping), worn contactor coil, or loose connection to coil terminal A1/A2.',
    diagnosis: 'Insufficient holding force on the contactor armature causes it to partially release and re-energize repeatedly — a chattering cycle.',
    fix: 'Measure voltage at contactor coil terminals during operation. Check control transformer secondary voltage (should be 110V ±5%). Tighten coil terminal connections.',
    component: 'Contactor',
    interviewTip: 'If chattering only happens under load (not at rest), suspect the control transformer secondary sagging under load rather than the contactor coil itself — check what else shares that 110V rail, since a marginal transformer can be "just adequate" until something else draws current on the same secondary at the same moment.',
    inspectionChecks: [
      { id: 'coil_v_idle', label: 'Coil voltage, no other motion active', reading: '112V', abnormal: false },
      { id: 'coil_v_loaded', label: 'Coil voltage, another motion also running', reading: '89V', abnormal: true, note: 'Well below the ±5% band around 110V.' },
      { id: 'coil_terminal', label: 'Check coil terminal A1/A2 tightness', reading: 'Tight, no corrosion', abnormal: false },
    ],
    diagnosisOptions: [
      { id: 'a', text: 'Control transformer secondary sags under combined load — not the contactor itself', correct: true, rationale: 'Coil voltage is fine alone but drops well outside tolerance only when another motion runs simultaneously — that isolates the shared transformer secondary, not this one contactor.' },
      { id: 'b', text: 'This contactor\'s coil is worn and needs replacing', correct: false, rationale: 'The coil terminal is tight and voltage is normal at idle — the drop only appears under combined load, which points upstream of this contactor.' },
      { id: 'c', text: 'Loose coil terminal connection', correct: false, rationale: 'Already checked and confirmed tight — rule this out and look at what else changes between the two readings.' },
      { id: 'd', text: 'Wrong contactor selected for this rating', correct: false, rationale: 'A wrong-rating contactor wouldn\'t behave fine alone and only chatter when a second, electrically unrelated motion starts.' },
    ],
    hints: [
      'Measure the same thing twice, under two different conditions — what else is different between them?',
      'This coil\'s own terminal and idle voltage both check out fine.',
      'What single device feeds every contactor coil on this panel?',
    ],
    handbookAnchor: null,
  },
  {
    id: 'both_directions',
    title: 'Both Directions Active (Interlock Failure)',
    difficulty: 'advanced',
    symptoms: ['Both Forward and Reverse contactors energize together', 'Tripping of main MCB or fuse blow', 'Possible motor winding damage'],
    cause: 'NC interlock contact wiring missing, miswired as NO, or relay contact welded closed due to a previous overload.',
    diagnosis: 'Without a proper interlock, both directional contactors can close simultaneously, creating a phase-to-phase short circuit through the motor.',
    fix: 'CRITICAL — de-energize immediately. Verify NC contact wiring between the relay pair (e.g. R1-R2). Check for welded/stuck relay contacts and replace if found.',
    component: 'Interlock Relay',
    interviewTip: "This is the fault almost every crane-panel interview eventually asks about — it's the one failure mode here that can destroy a motor and panel in under a second, not minutes. See the Control Circuit page's explanation of why swapping two phases (not three) is what makes this specific failure a direct phase-to-phase short, not just a wiring inconvenience.",
    simConfig: { motionLabel: 'Cross Travel', fwdLabel: 'LEFT', revLabel: 'RIGHT', showMasterControls: false, showLimitControls: false, faults: { interlockBypassed: true } },
    diagnosisOptions: [
      { id: 'a', text: 'NC interlock contact wiring is missing or welded closed — both directions can energize at once', correct: true, rationale: 'Pressing both buttons here energizes both relays together — the one thing a correct NC interlock structurally cannot allow. This is a wiring/contact fault, not an operator error.' },
      { id: 'b', text: 'Two operators pressed both buttons at the same instant — normal, would self-resolve', correct: false, rationale: 'A healthy interlock blocks this even on a genuine simultaneous press — one relay always wins because it pulls in fractionally first and locks the other out. Both staying energized together is never normal.' },
      { id: 'c', text: 'Overload relay malfunction', correct: false, rationale: 'The overload relay isn\'t in this circuit path at all here — both relays energizing together is purely an interlock-wiring issue.' },
      { id: 'd', text: 'MPCB undersized for starting current', correct: false, rationale: 'An undersized MPCB affects starting current tripping, not whether two opposing relays can both hold energized at once.' },
    ],
    hints: [
      'Press both push buttons and hold them — what should a correct interlock do, and what does this one do?',
      'Look at each relay\'s status independently: are both genuinely energized, or does it just look that way?',
      'This is a wiring/contact fault, not a timing coincidence — a real interlock survives a simultaneous press too.',
    ],
    handbookAnchor: 'forward-reverse-interlock',
  },
  {
    id: 'motor_no_start',
    title: "Motor Doesn't Start At All",
    difficulty: 'beginner',
    symptoms: ['No motion in either direction', 'No relay or contactor activity on any button press', 'Panel otherwise appears powered (indicator lamps on)'],
    cause: 'E-Stop left mechanically latched from a previous stop — a twist-release mushroom head that looks released but hasn\'t fully reset.',
    diagnosis: 'E-Stop is a master NC device in series with both directions — if it hasn\'t fully released, control power never reaches either relay branch, regardless of which button is pressed.',
    fix: 'Physically inspect the E-Stop button — twist fully to confirm release, don\'t just glance at it. Confirm control power is restored before assuming a deeper fault.',
    component: 'E-Stop',
    interviewTip: 'A half-released mushroom head is easy to miss on a quick visual check — the diagnostic habit that catches it is testing the master feed (voltage present past the E-Stop contact) before chasing either direction branch individually.',
    simConfig: { motionLabel: 'Hoist', fwdLabel: 'UP', revLabel: 'DOWN', showMasterControls: true, showLimitControls: false, faults: { eStopStuckPressed: true } },
    diagnosisOptions: [
      { id: 'a', text: 'E-Stop mechanically latched from a previous stop — needs a full manual twist-release', correct: true, rationale: 'Neither direction responds regardless of which button is pressed, and the E-Stop status still reads pressed even though it visually looks released — that\'s the master-feed device, not either direction branch.' },
      { id: 'b', text: 'Main supply has failed', correct: false, rationale: 'Indicator lamps are confirmed on, meaning control power is present up to some point — a full supply failure would take those down too.' },
      { id: 'c', text: 'Both MPCBs tripped at the same moment', correct: false, rationale: 'Two independent breakers tripping simultaneously on two different motions is possible but far less likely than one shared master-feed device — and the E-Stop status directly confirms the simpler explanation.' },
      { id: 'd', text: 'Control transformer primary fuse has blown', correct: false, rationale: 'That would remove control power entirely, including the indicator lamps — which are confirmed still on.' },
    ],
    hints: [
      'Neither direction works at all — that points at something shared by both branches, not either one individually.',
      'Indicator lamps are on, so control power exists somewhere — where does it stop?',
      'Check the master feed devices before either direction branch.',
    ],
    handbookAnchor: 'no-nc-contacts',
  },
  {
    id: 'reverse_fails',
    title: 'Reverse Fails, Forward Works',
    difficulty: 'intermediate',
    symptoms: ['REVERSE never activates the motor', 'FORWARD works normally', 'PB REV visibly responds (button itself moves/clicks)'],
    cause: 'Broken wire or a dead coil on the REV relay — the push button and every upstream condition are fine, but the relay itself never pulls in.',
    diagnosis: 'PB REV shows as pressed and every interlock/limit condition allows it, but R-REV never shows energized — the open point is the relay branch itself, downstream of everything that tested fine.',
    fix: 'With REV held, voltage-test from the PB REV output toward the R-REV coil terminals. The point where voltage is present but the coil still doesn\'t pull in is the coil or its final wire run.',
    component: 'Relay (REV)',
    interviewTip: 'This is a good one to walk through out loud: the fault-finding value isn\'t in guessing "probably the relay" — it\'s in confirming everything upstream (button, interlock NC, limit NC) tests fine first, so the relay is the only thing left, not just the first guess.',
    simConfig: { motionLabel: 'Cross Travel', fwdLabel: 'LEFT', revLabel: 'RIGHT', showMasterControls: false, showLimitControls: true, faults: { relayRevWontEnergize: true } },
    diagnosisOptions: [
      { id: 'a', text: 'Broken wire or dead coil on the REV relay — conditions are met but the relay never pulls in', correct: true, rationale: 'PB REV responds, the FWD interlock NC and Limit REV both test as allowing the circuit, yet R-REV status never shows energized — that isolates the fault to the relay branch itself.' },
      { id: 'b', text: 'Limit REV switch is stuck triggered', correct: false, rationale: 'A stuck-triggered limit switch would show in the Limit REV indicator as permanently open — check it directly rather than assuming.' },
      { id: 'c', text: 'FWD interlock NC contact is welded closed', correct: false, rationale: 'A welded-closed FWD NC would block REV the same way a real FWD-energized condition would — but FWD isn\'t energized here, so that NC should read closed (allowing current) already.' },
      { id: 'd', text: 'REV contactor is mechanically jammed open', correct: false, rationale: 'The contactor is downstream of the relay — if the relay itself never energizes, the contactor was never given the chance to close or fail to close.' },
    ],
    hints: [
      'Confirm the push button and every contact ahead of the relay first — don\'t jump straight to the relay as a guess.',
      'Check the Limit REV and interlock NC status directly instead of assuming which one is at fault.',
      'If everything upstream tests as allowing current but the relay still doesn\'t energize, the fault is the relay branch itself.',
    ],
    handbookAnchor: 'forward-reverse-interlock',
  },
  {
    id: 'forward_fails',
    title: 'Forward Fails, Reverse Works',
    difficulty: 'intermediate',
    symptoms: ['FORWARD relay energizes (visible in diagram) but the contactor never closes', 'REVERSE works normally end-to-end', 'No trip or fault flag anywhere on the panel'],
    cause: 'The R-FWD relay\'s NO auxiliary contact feeding the FWD contactor coil has failed — welded open or broken — so the contactor never gets the signal even though the relay itself is healthy.',
    diagnosis: 'This is a step further downstream than a relay fault: the relay pulls in correctly, but the contactor coil circuit past its NO contact stays open.',
    fix: 'With FWD held (relay shown energized), voltage-test across the relay\'s NO auxiliary contact and on to the contactor coil. Replace the failed auxiliary contact block, not the relay itself.',
    component: 'Auxiliary Contact (Relay NO)',
    interviewTip: 'The giveaway here is that the RELAY shows energized in the diagram/status but the CONTACTOR doesn\'t follow — that\'s a fundamentally different fault location than "the relay never energized at all" (see Reverse Fails), even though both present as "one direction doesn\'t work."',
    simConfig: { motionLabel: 'Long Travel', fwdLabel: 'FORWARD', revLabel: 'REVERSE', showMasterControls: false, showLimitControls: true, faults: { contactorFwdWontClose: true } },
    diagnosisOptions: [
      { id: 'a', text: 'R-FWD relay\'s NO auxiliary contact to the contactor coil has failed — relay is healthy, the contact feeding the contactor isn\'t', correct: true, rationale: 'The relay status shows ENERGIZED, but the contactor status shows "WON\'T CLOSE" — that gap between the two is exactly what an auxiliary-contact failure downstream of a healthy relay looks like.' },
      { id: 'b', text: 'R-FWD relay coil itself is dead', correct: false, rationale: 'A dead coil means the relay never shows energized at all — here it clearly does; the fault is further downstream.' },
      { id: 'c', text: 'Limit FWD switch is stuck triggered', correct: false, rationale: 'A stuck limit switch would prevent the relay from energizing in the first place — but the relay already shows energized here.' },
      { id: 'd', text: 'PB FWD button contact is worn', correct: false, rationale: 'The relay energizing at all confirms the button and everything ahead of the relay is working — a worn button would show the relay never energizing.' },
    ],
    hints: [
      'Check the relay\'s own status before assuming the fault is upstream of it.',
      'The relay shows energized. Where does the circuit go immediately after that, before reaching the contactor?',
      'This is one step further downstream than a relay-coil fault — same symptom pattern ("one direction doesn\'t work"), different location.',
    ],
    handbookAnchor: 'forward-reverse-interlock',
  },
  {
    id: 'wrong_phase_sequence',
    title: 'Wrong Phase Sequence',
    difficulty: 'advanced',
    symptoms: ['Every motion runs opposite to the button pressed (UP lowers the load, FORWARD reverses)', 'No trip, no fault flag — panel believes everything is normal', 'Fault appeared immediately after panel installation or a supply reconnection'],
    cause: 'Two of the three incoming phase leads were swapped somewhere between the incomer and the motors — commonly right after a supply reconnection or a panel relocation.',
    diagnosis: 'A 3-phase motor\'s rotation direction is set entirely by phase sequence. Swapping any two lines reverses every motion wired the same way, all at once — which is the tell that separates this from an individual motor or contactor fault.',
    fix: 'Verify phase sequence at the incomer with a phase-sequence meter, then correct by swapping any two (not all three) leads at the incomer — not at each individual motor.',
    component: 'Incoming Supply Wiring',
    interviewTip: 'The diagnostic signature is "every motion is reversed, all at once, right after supply work" — a single motor or contactor fault would never affect Hoist, LT and CT identically at the same time. See the Power Circuit page\'s explanation of why swapping two (not three) leads is what actually reverses direction.',
    inspectionChecks: [
      { id: 'phase_seq_meter', label: 'Check phase sequence meter at incomer', reading: 'R-B-Y (reversed)', abnormal: true },
      { id: 'hoist_direction', label: 'Press Hoist UP, observe actual motion', reading: 'Load lowers instead of lifting', abnormal: true },
      { id: 'lt_direction', label: 'Press Long Travel FORWARD, observe actual motion', reading: 'Bridge moves in REVERSE direction', abnormal: true },
      { id: 'terminal_check', label: 'Compare motor terminal wiring to as-built diagram', reading: 'Two phase leads swapped vs. diagram', abnormal: true },
    ],
    diagnosisOptions: [
      { id: 'a', text: 'Two phase leads swapped between the incomer and the motors, reversing every motion wired the same way', correct: true, rationale: 'The phase sequence meter directly confirms R-B-Y instead of R-Y-B, and every motion (not just one) is reversed — that\'s the specific signature of a phase swap upstream of all of them.' },
      { id: 'b', text: 'Motor winding fault', correct: false, rationale: 'A winding fault would affect one motor, not all three motions identically at once — and wouldn\'t show up on a phase-sequence meter reading.' },
      { id: 'c', text: 'Wrong motor was installed for this application', correct: false, rationale: 'A wrong-motor-model issue wouldn\'t make every motion reverse identically, and wouldn\'t change what the phase sequence meter reads.' },
      { id: 'd', text: 'Only this one motion\'s contactor is miswired', correct: false, rationale: 'The symptom affects Hoist AND Long Travel (and by extension Cross Travel) identically — a single contactor miswiring couldn\'t produce that pattern across independent branches.' },
    ],
    hints: [
      'Is this affecting one motion, or all of them, and does that pattern match a single-component fault?',
      'When did this start — right after any supply or panel work?',
      'Check the phase sequence at the incomer directly rather than guessing at any one motor.',
    ],
    handbookAnchor: null,
  },
  {
    id: 'brake_failure',
    title: 'Brake Failure',
    difficulty: 'advanced',
    symptoms: ['Hoist motor runs but the load doesn\'t lift (brake never releases)', 'OR: load creeps down slowly after Hoist UP/DOWN is released (brake doesn\'t hold)', 'Audible click from the brake solenoid may be present or absent depending on which failure mode'],
    cause: 'Brake coil circuit open (fails to release — safe but crane can\'t move) or brake lining worn beyond service limit (fails to hold reliably once released — a genuine safety concern).',
    diagnosis: 'These are two different failure modes with the same component and opposite risk profiles — a brake that won\'t release is an availability problem; a brake that won\'t hold is a safety problem, and the two need to be told apart before deciding how urgent the fix is.',
    fix: 'Measure brake coil voltage during a motion command first — 0V means an open coil circuit (fails safe). If voltage is present and the brake still doesn\'t hold, inspect lining wear against the service limit — that fails toward danger and should be treated as urgent.',
    component: 'Electromagnetic Brake',
    interviewTip: 'A candidate who treats every brake fault as "the same problem" is missing the most important distinction on this page: fails-to-release is an inconvenience, fails-to-hold is a load-drop risk. The diagnostic sequence (coil voltage first, then lining) is what separates them.',
    inspectionChecks: [
      { id: 'brake_coil_v', label: 'Measure brake coil voltage during Hoist UP', reading: '0V', abnormal: true, note: 'Coil circuit is open — brake mechanically stays applied.' },
      { id: 'brake_lining', label: 'Inspect brake lining wear against service limit', reading: 'Worn beyond service limit', abnormal: true },
      { id: 'brake_mech', label: 'Manually check mechanical brake release', reading: 'Pads do not lift off the drum', abnormal: true },
    ],
    diagnosisOptions: [
      { id: 'a', text: 'Brake coil circuit is open — the brake never releases (fails safe, but the crane can\'t move)', correct: true, rationale: '0V at the coil during a motion command, with the pads confirmed not lifting mechanically, points directly at an open coil circuit rather than a worn-lining hold failure.' },
      { id: 'b', text: 'Hoist motor is undersized for the load', correct: false, rationale: 'An undersized motor is a load-calculation issue, not something that would read 0V at the brake coil specifically.' },
      { id: 'c', text: 'Hoist contactor has failed', correct: false, rationale: 'Contactor failure is a separate circuit from the brake coil — this reading is specific to the brake circuit itself.' },
      { id: 'd', text: 'Overload relay is nuisance-tripping', correct: false, rationale: 'Nothing here shows an OLR trip flag — the symptom and the readings both point at the brake circuit, not the motor\'s thermal protection.' },
    ],
    hints: [
      'Check brake coil voltage before assuming which failure mode this is — release failure and hold failure need different first checks.',
      '0V at the coil during a motion command is a specific, different signature than a coil with voltage present that still doesn\'t hold.',
      'This fails toward "can\'t move," not toward "load drops" — which of the two failure modes does that match?',
    ],
    handbookAnchor: null,
  },
  {
    id: 'aux_contact_failure',
    title: 'Auxiliary Contact Failure (False Indication)',
    difficulty: 'intermediate',
    symptoms: ['"Running" indicator lamp for Hoist stays off even during normal operation', 'Motor itself runs completely normally', 'No other fault, trip, or symptom anywhere on the panel'],
    cause: 'The auxiliary NO contact on KM1 (wired to the "Hoist Running" indicator lamp, not to the motor\'s main power circuit) has failed open.',
    diagnosis: 'This is deliberately the odd one out on this list: nothing is actually malfunctioning in the power or control path — only the INDICATION of it is wrong, because the aux contact used purely for the lamp circuit is a separate physical contact block from the main power contacts.',
    fix: 'Confirm the motor is genuinely running normally first (this rules out every other fault on this list). Then check the aux contact block\'s continuity when energized — replace the aux block, not the contactor.',
    component: 'Auxiliary Contact (Indicator Circuit)',
    interviewTip: 'The value of this scenario is entirely in the first step: verifying the motor is ACTUALLY fine before trusting or distrusting an indicator lamp. Panel Explorer\'s Indicator Lamps entry makes the same point — a lamp is evidence about the circuit that drives it, not proof of the thing it\'s meant to represent.',
    inspectionChecks: [
      { id: 'motor_physical', label: 'Physically observe the Hoist motor shaft', reading: 'Rotating normally, full speed', abnormal: false },
      { id: 'indicator_lamp', label: 'Check "Hoist Running" indicator lamp', reading: 'OFF, even while motor runs', abnormal: true },
      { id: 'aux_continuity', label: 'Check KM1 auxiliary NO contact continuity (energized)', reading: 'Open circuit — should be closed when energized', abnormal: true },
      { id: 'main_contacts', label: 'Check KM1 main power contacts', reading: 'Closed, carrying normal current', abnormal: false },
    ],
    diagnosisOptions: [
      { id: 'a', text: 'KM1\'s auxiliary NO contact (feeding the indicator only) has failed open — the motor itself is fine', correct: true, rationale: 'The motor is confirmed physically running and the main power contacts are confirmed closed and carrying current — only the auxiliary contact feeding the lamp circuit tests open.' },
      { id: 'b', text: 'Hoist motor has actually stopped', correct: false, rationale: 'Directly contradicted by physically observing the shaft rotating normally.' },
      { id: 'c', text: 'KM1\'s main power contacts are worn', correct: false, rationale: 'The main contacts tested closed and carrying normal current — the fault is isolated to the separate auxiliary contact block.' },
      { id: 'd', text: 'The indicator lamp transformer has failed', correct: false, rationale: 'A failed shared lamp transformer would take out every indicator lamp on the panel, not just this one.' },
    ],
    hints: [
      'Before trusting the lamp, verify independently whether the motor is actually running.',
      'A contactor has more than one contact block — the main power contacts and any auxiliary contacts are physically separate.',
      'Everything in the main power path tests fine. What\'s left that only affects indication?',
    ],
    handbookAnchor: 'no-nc-contacts',
  },
]

export function getFault(id) {
  return FAULTS.find((f) => f.id === id) || null
}

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
