// The 13-item commissioning checklist, in the order a real commissioning
// walk-through would follow: incoming supply first, then control logic,
// then each motion, then protection and safety devices last (you don't test
// a motion until you've confirmed the supply and control logic feeding it
// are correct). Three items are deliberate "traps" — a subtly wrong reading
// the trainee has to actually catch, not rubber-stamp — mirroring how real
// commissioning training includes known-bad steps so a learner can't pass
// by clicking through. Spread across different categories on purpose
// (incoming, protection, safety) so catching traps isn't just "expect item
// #7 to be wrong."
export const COMMISSIONING_ITEMS = [
  {
    id: 'verify_supply', label: 'Verify Supply', category: 'Incoming', order: 1,
    instructions: 'Measure all three line-to-line voltages at the incomer before proceeding with anything downstream.',
    inspectionChecks: [
      { id: 'v_ry', label: 'Measure R-Y', reading: '414V', abnormal: false },
      { id: 'v_yb', label: 'Measure Y-B', reading: '416V', abnormal: false },
      { id: 'v_rb', label: 'Measure R-B', reading: '413V', abnormal: false },
    ],
    trap: false, correctAssessment: 'pass',
    explanation: 'All three line-to-line readings fall within ±5% of 415V — healthy 3-phase supply confirmed.',
    bestPractice: 'Always verify supply voltage first. Every other test on this checklist assumes it\'s correct.',
  },
  {
    id: 'verify_phase_sequence', label: 'Verify Phase Sequence', category: 'Incoming', order: 2,
    instructions: 'Confirm phase sequence at the incomer with a phase-sequence meter before any motion is test-run.',
    inspectionChecks: [
      { id: 'seq_meter', label: 'Check phase sequence meter', reading: 'R-B-Y (reversed)', abnormal: true, note: 'Should read R-Y-B.' },
    ],
    trap: true, correctAssessment: 'fail',
    explanation: 'Sequence reads R-B-Y instead of R-Y-B — two incoming leads are swapped. Every motion will run opposite to the button pressed until this is corrected at the incomer (swap any two leads, not all three).',
    bestPractice: 'Never skip this because "the motors spin" — spinning in the WRONG direction on a crane is worse than not spinning at all. Catch it here, not during the first live lift.',
  },
  {
    id: 'verify_control_transformer', label: 'Verify Control Transformer', category: 'Incoming', order: 3,
    instructions: 'Check primary voltage, then secondary voltage both idle and under load (with another motion also commanded).',
    inspectionChecks: [
      { id: 'primary_v', label: 'Primary voltage', reading: '415V', abnormal: false },
      { id: 'secondary_idle', label: 'Secondary voltage, idle', reading: '111V', abnormal: false },
      { id: 'secondary_loaded', label: 'Secondary voltage, under load', reading: '106V', abnormal: false },
    ],
    trap: false, correctAssessment: 'pass',
    explanation: 'Secondary holds within the ±5% band even under combined load — no sag risk for contactor chatter later.',
    bestPractice: 'Check secondary voltage UNDER LOAD, not just at idle — a marginally-sized transformer can pass an idle-only check and still cause chatter once the panel is in service.',
  },
  {
    id: 'test_estop', label: 'Test E-Stop', category: 'Safety', order: 4,
    instructions: 'With a motion commanded and running, press E-Stop and confirm it cuts control power to both directions immediately.',
    simConfig: { motionLabel: 'Hoist', fwdLabel: 'UP', revLabel: 'DOWN', showMasterControls: true, showLimitControls: false, faults: {} },
    trap: false, correctAssessment: 'pass',
    explanation: 'E-Stop cuts control power to both directions immediately regardless of what was running — correct master-feed behavior.',
    bestPractice: 'Test E-Stop under an actually-running motion, not just at standstill — that\'s the real-world case it has to handle correctly.',
  },
  {
    id: 'test_forward', label: 'Test Forward', category: 'Control Logic', order: 5,
    instructions: 'Command FORWARD on Long Travel. Confirm it energizes, and that REVERSE is correctly blocked while it runs.',
    simConfig: { motionLabel: 'Long Travel', fwdLabel: 'FORWARD', revLabel: 'REVERSE', showMasterControls: false, showLimitControls: false, faults: {} },
    trap: false, correctAssessment: 'pass',
    explanation: 'FORWARD energizes correctly on command, and the interlock correctly blocks REVERSE while FORWARD is active.',
    bestPractice: 'Always test that the OPPOSING direction is blocked, not just that the commanded direction works — that\'s the actual safety function being verified.',
  },
  {
    id: 'test_reverse', label: 'Test Reverse', category: 'Control Logic', order: 6,
    instructions: 'Command REVERSE on Long Travel. Confirm it energizes, and that FORWARD is correctly blocked while it runs.',
    simConfig: { motionLabel: 'Long Travel', fwdLabel: 'FORWARD', revLabel: 'REVERSE', showMasterControls: false, showLimitControls: false, faults: {} },
    trap: false, correctAssessment: 'pass',
    explanation: 'REVERSE energizes correctly on command, and the interlock correctly blocks FORWARD while REVERSE is active.',
    bestPractice: 'The same interlock wiring protects both directions — a real fault here would usually show up on both Forward and Reverse tests, not just one.',
  },
  {
    id: 'test_hoist', label: 'Test Hoist', category: 'Motions', order: 7,
    instructions: 'Command UP and DOWN on the Hoist motion independently. Confirm each energizes and the opposite is blocked.',
    simConfig: { motionLabel: 'Hoist', fwdLabel: 'UP', revLabel: 'DOWN', showMasterControls: false, showLimitControls: false, faults: {} },
    trap: false, correctAssessment: 'pass',
    explanation: 'Hoist UP and DOWN both energize correctly on command with the interlock holding between them.',
    bestPractice: 'Hoist carries the load directly — treat any hesitation or irregular contactor sound here as worth stopping and re-checking before moving on, even if it "worked."',
  },
  {
    id: 'test_lt', label: 'Test LT (Full Travel)', category: 'Motions', order: 8,
    instructions: 'Run Long Travel through its full physical travel span at walking pace. Confirm smooth motion with no unusual vibration or noise.',
    confirmOnly: true,
    trap: false, correctAssessment: 'pass',
    explanation: 'Full-span run confirms mechanical alignment and rail condition, not just the control logic already checked in Test Forward/Reverse.',
    bestPractice: 'The control-logic test (Forward/Reverse) and a full mechanical run test two different things — a panel can pass one and still have a rail alignment or wheel issue that only shows up in an actual full-span run.',
  },
  {
    id: 'test_ct', label: 'Test CT (Full Travel)', category: 'Motions', order: 9,
    instructions: 'Run Cross Travel through its full physical travel span at walking pace. Confirm smooth motion with no unusual vibration or noise.',
    confirmOnly: true,
    trap: false, correctAssessment: 'pass',
    explanation: 'Full-span run confirms the crab\'s mechanical condition independent of the control logic already verified.',
    bestPractice: 'Cross Travel mechanisms are often less closely inspected than Hoist — a full run test here catches what a control-logic test alone can\'t.',
  },
  {
    id: 'test_limit_switches', label: 'Test Limit Switches', category: 'Protection', order: 10,
    instructions: 'Physically trigger each limit switch (don\'t just trust the wiring diagram) and confirm the corresponding direction stops.',
    simConfig: { motionLabel: 'Long Travel', fwdLabel: 'FORWARD', revLabel: 'REVERSE', showMasterControls: false, showLimitControls: true, faults: { limitFwdStuckOpen: true } },
    trap: true, correctAssessment: 'fail',
    explanation: 'Limit FWD reads triggered even with nothing physically at the limit — either wired incorrectly (NC/NO reversed) or a genuinely stuck switch. Must be corrected before handover: a limit switch that reads wrong could just as easily fail to stop the crane at the real limit.',
    bestPractice: 'Test every limit switch by physically triggering it during commissioning, not by trusting the as-built wiring diagram — reversed NC/NO wiring is a common installation-stage error that a diagram check alone won\'t catch.',
  },
  {
    id: 'test_overload', label: 'Test Overload', category: 'Protection', order: 11,
    instructions: 'Trip the overload relay and confirm both directions stop immediately. Reset and confirm normal operation resumes.',
    simConfig: { motionLabel: 'Hoist', fwdLabel: 'UP', revLabel: 'DOWN', showMasterControls: true, showLimitControls: false, faults: {} },
    trap: false, correctAssessment: 'pass',
    explanation: 'Tripping the overload correctly blocks both directions, and un-tripping (reset) correctly restores normal operation — both the protection and the reset mechanism check out.',
    bestPractice: 'Confirm the RESET works too, not just the trip — a relay that trips correctly but won\'t reset cleanly still fails commissioning.',
  },
  {
    id: 'verify_indicators', label: 'Verify Indicators', category: 'Safety', order: 12,
    instructions: 'Confirm every panel indicator lamp\'s colour matches its function per IEC 60204-1 convention (red = fault/emergency, amber = caution, green = normal/running).',
    inspectionChecks: [
      { id: 'running_lamp', label: 'Check "Running" indicator colour', reading: 'Green', abnormal: false },
      { id: 'fault_lamp', label: 'Check "Fault" indicator colour', reading: 'Green (should be Red)', abnormal: true },
    ],
    trap: true, correctAssessment: 'fail',
    explanation: 'The fault lamp is wired green instead of red. IEC 60204-1 reserves red specifically for fault/emergency indication — this is a genuine labelling error to correct before handover, not a cosmetic detail.',
    bestPractice: 'Colour convention isn\'t a style choice here — it\'s a safety standard operators are trained to trust at a glance without reading a label.',
  },
  {
    id: 'verify_brake', label: 'Verify Brake', category: 'Safety', order: 13,
    instructions: 'Measure brake coil voltage during a Hoist command, and inspect lining wear against the service limit.',
    inspectionChecks: [
      { id: 'brake_coil_v', label: 'Brake coil voltage during Hoist UP', reading: '110V', abnormal: false },
      { id: 'brake_lining', label: 'Brake lining wear', reading: 'Within service limit', abnormal: false },
    ],
    trap: false, correctAssessment: 'pass',
    explanation: 'Brake coil energizes correctly on command and lining is within service limits — confirmed safe for handover.',
    bestPractice: 'Check coil voltage AND lining wear separately — a brake can release correctly (coil fine) and still not hold reliably (lining worn), or the reverse. They\'re two different failure modes.',
  },
]

export function getCommissioningItem(id) {
  return COMMISSIONING_ITEMS.find((i) => i.id === id) || null
}

export const COMMISSIONING_MAX_SCORE = COMMISSIONING_ITEMS.length * 10
