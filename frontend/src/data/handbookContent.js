// Every worked example number in this file was computed by actually running
// backend/app/engineering.py, not by hand — see the audit log in README.md.
// That keeps this handbook internally consistent with what the calculators
// themselves return, instead of drifting from them over time.

export const HANDBOOK_SECTIONS = [
  {
    id: 'fundamentals',
    title: 'Electrical Fundamentals',
    topics: [
      {
        id: 'three-phase-power',
        title: 'Three-Phase Power',
        equation: 'P = √3 × V(L-L) × I × cos(φ)',
        variables: [
          { symbol: 'P', name: 'Real power', unit: 'W' },
          { symbol: 'V(L-L)', name: 'Line-to-line voltage', unit: 'V' },
          { symbol: 'I', name: 'Line current', unit: 'A' },
          { symbol: 'cos(φ)', name: 'Power factor', unit: '—' },
        ],
        meaning:
          'For a balanced 3-phase load, this is the standard relationship between the voltage and current you can measure with a meter, and the real power actually being converted to useful work (or heat, in a resistive load). The √3 factor comes directly from the 120° phase relationship between the three line voltages — it is not an empirical fudge factor.',
        assumptions: 'Balanced 3-phase load (all three phases carrying equal current) — this app assumes balanced loading throughout, since single-phasing (an unbalanced fault condition) is treated separately on the Fault Diagnosis page, not folded into normal sizing math.',
        workedExample: 'A motor drawing 6.09 A at 415V with a 0.85 power factor: P = √3 × 415 × 6.09 × 0.85 ≈ 3,720 W ≈ 3.72 kW of real electrical input power.',
        industrialNote: 'This is why current alone doesn\'t tell you power — two loads drawing the same current at the same voltage can differ in real power if their power factors differ. A poor power factor means more current is needed to deliver the same real power, which is exactly why utilities penalize low power factor on industrial bills.',
        commonMistakes: ['Forgetting the √3 factor and using the single-phase formula (P = V×I×cosφ) for a 3-phase load — understates power by a factor of √3.'],
        relatedCalculator: { label: 'Load Calculator', path: '/calculator' },
        interviewTip: 'If asked "why √3 and not 3" — it\'s because the three line-to-line voltages are 120° apart, not additive; √3 falls straight out of the phasor geometry, not a rounding convention.',
      },
      {
        id: 'power-factor',
        title: 'Power Factor',
        equation: 'cos(φ) = Real Power (kW) / Apparent Power (kVA)',
        variables: [
          { symbol: 'kW', name: 'Real power — does actual work', unit: 'kW' },
          { symbol: 'kVA', name: 'Apparent power — what the supply actually has to deliver', unit: 'kVA' },
        ],
        meaning:
          'An induction motor doesn\'t just draw current in phase with voltage — its windings need magnetizing current too, which does no useful work but still has to flow through every cable, breaker and transformer upstream. Power factor is the fraction of the total (apparent) current that\'s actually doing work.',
        assumptions: 'This app uses a flat default of 0.85 for power factor calculations unless overridden — a reasonable typical value for a loaded squirrel-cage induction motor, not a measured or guaranteed figure for any specific motor.',
        workedExample: 'A motor with 3.72 kW real power at 0.85 PF has an apparent power of 3.72 / 0.85 ≈ 4.38 kVA — the supply, cables and transformer all have to be sized for that larger kVA figure, not the smaller kW figure.',
        industrialNote: 'This is exactly why the full load current formula on this page divides by power factor — a lower PF means the same real power needs more current, which is why utilities in India commonly bill a power factor penalty below about 0.9, and industrial panels sometimes add capacitor banks purely to correct it.',
        commonMistakes: ['Confusing kW and kVA as interchangeable — they\'re only equal at unity (1.0) power factor, which a real induction motor never actually has.'],
        relatedCalculator: { label: 'Load Calculator', path: '/calculator' },
        interviewTip: 'A classic follow-up: "why is PF always less than 1 for an induction motor, and never leading?" — because the motor is fundamentally an inductive load (magnetizing current), so it always lags, never leads.',
      },
      {
        id: 'motor-efficiency',
        title: 'Motor Efficiency (IE Classes)',
        equation: 'η = Mechanical Output Power / Electrical Input Power',
        variables: [
          { symbol: 'η', name: 'Efficiency, expressed as a fraction (e.g. 0.879)', unit: '—' },
        ],
        meaning:
          'A motor never converts 100% of the electricity it draws into useful mechanical work — some is lost as heat in the windings (resistive losses), some in the iron core, some as friction and windage. Efficiency is what fraction actually makes it to the shaft as usable mechanical output.',
        assumptions: 'This app looks up efficiency from a real IEC 60034-30-1 IE2/IE3 table (interpolated by motor kW rating) rather than assuming one flat number — a 1kW motor and a 100kW motor of the same IE class do not have the same efficiency, and treating them as if they did would meaningfully skew FLC for small motors.',
        workedExample: 'A 4.38 HP (3.27 kW) IE3 motor looks up to 87.9% efficiency on this app\'s table — noticeably lower than the ~95%+ you\'d see on a large industrial motor of the same IE class, because efficiency genuinely drops off at small kW ratings.',
        industrialNote: 'This is precisely the bug fixed in an earlier engineering pass on this app: efficiency must be applied exactly once, when converting mechanical output requirement into electrical input current — never when calculating the mechanical output requirement itself, which is pure physics (force × velocity) and has nothing to do with how efficiently a motor converts electricity.',
        commonMistakes: ['Applying an efficiency correction twice — once to inflate required HP, again to inflate FLC — which silently oversizes every downstream component.', 'Assuming efficiency is roughly constant across motor sizes within the same IE class — it is not, especially below a few kW.'],
        relatedCalculator: { label: 'Load Calculator', path: '/calculator' },
        interviewTip: 'If asked why efficiency doesn\'t belong in the mechanical HP formula: mechanical power required to lift a known mass at a known speed is fixed by physics regardless of what motor you put on the job — efficiency only describes how much electricity that specific motor needs to deliver it.',
      },
    ],
  },
  {
    id: 'motor-selection',
    title: 'Motor Selection',
    topics: [
      {
        id: 'motor-hp',
        title: 'Required Motor HP (from Load & Speed)',
        equation: 'HP = (m × g × v) / 746',
        variables: [
          { symbol: 'm', name: 'Mass being moved (load × load factor)', unit: 'kg' },
          { symbol: 'g', name: 'Gravitational acceleration', unit: '9.81 m/s²' },
          { symbol: 'v', name: 'Speed', unit: 'm/s (converted from m/min)' },
          { symbol: '746', name: 'Watts per mechanical horsepower', unit: 'W/HP' },
        ],
        meaning:
          'This is force × velocity = power, converted from watts to horsepower. It\'s the mechanical power a motor must be rated to deliver to move a given mass at a given speed — pure physics, with no motor-specific assumptions in it at all.',
        assumptions: 'The "load factor" isn\'t the same for every motion — see the Load Factor entry below. Hoist uses the full rated load (factor = 1.0); Long Travel and Cross Travel use only a fraction of it (rolling resistance, not the full weight).',
        workedExample: 'A 5-tonne hoist load moving at 4 m/min: m = 5000 kg, v = 4/60 = 0.0667 m/s → HP = (5000 × 9.81 × 0.0667) / 746 ≈ 4.38 HP.',
        industrialNote: 'Real crane hoist motor selection in practice also accounts for mechanism efficiency (gearbox/rope losses) beyond this formula, typically as an additional derating factor — this app models motor electrical efficiency (IE class) explicitly but does not currently model a separate mechanical (gearbox) efficiency factor; treat the HP result as the required motor output at the shaft, before mechanism losses.',
        commonMistakes: ['Using load speed in m/min directly in a formula expecting m/s — a very easy unit-consistency mistake that silently inflates the result by 60x.', 'Applying motor efficiency here — it does not belong in this formula at all, see the Motor Efficiency entry.'],
        relatedCalculator: { label: 'Load Calculator', path: '/calculator' },
        interviewTip: 'This formula alone won\'t give you nameplate HP — real motors come in standard frame sizes, so the calculated 4.38 HP would round up to the nearest standard motor rating (5 HP) in an actual purchase order, not stay at the exact calculated figure.',
      },
      {
        id: 'load-factor',
        title: 'Load Factor (Hoist vs. Long Travel vs. Cross Travel)',
        equation: 'Effective mass = Rated load × Load factor',
        variables: [
          { symbol: 'Hoist', name: 'Load factor', value: '1.0 (full rated load)', unit: '' },
          { symbol: 'Long Travel', name: 'Load factor (default)', value: '0.1', unit: '' },
          { symbol: 'Cross Travel', name: 'Load factor (default)', value: '0.05', unit: '' },
        ],
        meaning:
          'The Hoist motor has to lift the full rated load directly against gravity — factor 1.0 is not a design choice, it\'s the actual physics. Long Travel and Cross Travel motors don\'t lift anything; they roll the crane bridge/trolley (plus whatever load is hooked on) along a rail, so the force they fight is rolling resistance and the crane\'s own structural mass share, which is a small fraction of the full hook load — hence the much smaller default factors.',
        assumptions: 'These default fractions (0.1 and 0.05) are reasonable planning-stage estimates for rolling resistance, not a substitute for the actual crane structure\'s self-weight and rail friction coefficient, which varies by crane design and wheel/rail condition — this app exposes them as overridable inputs precisely because a real design should use manufacturer or site-specific figures where available.',
        workedExample: 'Same 5-tonne rated load: Hoist mass = 5000 kg; Long Travel mass = 5000 × 0.1 = 500 kg; Cross Travel mass = 5000 × 0.05 = 250 kg — very different required HP for what sounds like "the same load."',
        industrialNote: 'This is a genuinely common beginner confusion — assuming all three motors on a crane need roughly the same HP because they\'re all "handling the same load." They don\'t; the physics of lifting versus rolling are completely different.',
        commonMistakes: ['Sizing Long Travel or Cross Travel motors as if they had to lift the full rated load — massively oversizes both.'],
        relatedCalculator: { label: 'Load Calculator', path: '/calculator' },
        interviewTip: 'A good interview answer here demonstrates you understand WHY the factors differ, not just that they do — it\'s the difference between lifting against gravity and overcoming rolling friction.',
      },
      {
        id: 'full-load-current',
        title: 'Full Load Current (FLC)',
        equation: 'FLC = (kW × 1000) / (√3 × V × PF × η)',
        variables: [
          { symbol: 'kW', name: 'Motor rated output power', unit: 'kW' },
          { symbol: 'V', name: 'Line voltage', unit: 'V (415 default)' },
          { symbol: 'PF', name: 'Power factor', unit: '— (0.85 default)' },
          { symbol: 'η', name: 'Motor efficiency (from IE class lookup)', unit: '— (fraction)' },
        ],
        meaning:
          'FLC is the steady-state current a motor draws from the supply at its rated output — it\'s the single number every downstream protection device (contactor, MPCB, overload relay, cable) gets sized from, which is why getting it right matters more than any other number in this app.',
        assumptions: 'Efficiency enters here — and only here, not in the mechanical HP formula above — because it describes electrical input required for a given mechanical output, which is exactly what this formula is converting.',
        workedExample: 'The 4.38 HP (3.27 kW) hoist motor at 87.9% IE3 efficiency: FLC = (3.27 × 1000) / (√3 × 415 × 0.85 × 0.879) ≈ 6.09 A.',
        industrialNote: 'Every "why this contactor / why this MPCB / why this cable" explanation elsewhere in this app ultimately traces back to this one number — it is the single most consequential calculation in the whole tool.',
        commonMistakes: ['Double-counting efficiency (applying it here AND in the HP calculation) — a real bug found and fixed in an earlier engineering pass on this app, documented in the README\'s audit log.'],
        relatedCalculator: { label: 'Load Calculator', path: '/calculator' },
        interviewTip: 'If asked to defend a specific FLC figure, the strongest answer traces every input back to its source (rated HP → IE-class efficiency lookup → this formula) rather than quoting the number alone.',
      },
      {
        id: 'starting-current',
        title: 'Starting (Inrush) Current — DOL vs. Star-Delta',
        equation: 'I(DOL start) ≈ 6 × FLC     I(Star start) = I(DOL start) / 3',
        variables: [
          { symbol: '6×', name: 'Typical DOL starting current multiplier for a cage induction motor', unit: '' },
          { symbol: '1/3', name: 'Star-delta starting current reduction versus DOL', unit: '' },
        ],
        meaning:
          'When a squirrel-cage induction motor is switched directly onto full voltage, it briefly draws several times its running current — the rotor hasn\'t built up back-EMF yet, so almost nothing is limiting the current except winding resistance. A star-delta starter reduces this by connecting the motor windings in star (√3 lower voltage per winding) for the first few seconds, then switching to delta for normal running.',
        assumptions: '6x is a commonly used planning-stage estimate for a standard cage motor\'s DOL starting current, not this specific motor\'s tested locked-rotor current (which a real datasheet would give as a "code letter" or explicit LRA figure) — treat it as a reasonable design-stage assumption, not a guaranteed value for any individual motor.',
        workedExample: 'A 17.53 HP motor (FLC = 23.33 A): DOL inrush ≈ 6 × 23.33 = 139.98 A. Star-connected inrush = 139.98 / 3 = 46.66 A — less than a third of the DOL figure.',
        industrialNote: 'The 1/3 reduction isn\'t arbitrary — connecting windings in star instead of delta reduces the voltage across each winding by a factor of √3, and starting current scales roughly linearly with voltage, so (1/√3)² ≈ 1/3 for current specifically (torque, which scales with voltage squared as well, also drops to roughly 1/3 — which is exactly why star-delta starting isn\'t free: you trade lower inrush current for lower starting torque).',
        commonMistakes: ['Assuming star-delta reduces starting current to 1/√3 instead of 1/3 — the 1/√3 factor applies to voltage per winding, not current, which is the square of that ratio.', 'Forgetting that star-delta also cuts starting torque to roughly 1/3 — inappropriate for high-inertia or high-breakaway-torque loads that need full torque to start moving at all.'],
        relatedCalculator: { label: 'Star-Delta Starter', path: '/star-delta' },
        interviewTip: 'A strong answer connects BOTH consequences of star-delta starting (lower inrush current AND lower starting torque) — mentioning only the current reduction misses half the trade-off.',
      },
      {
        id: 'star-delta-threshold',
        title: 'When Is Star-Delta Required?',
        equation: 'Star-Delta required if HP > 5 HP (this app\'s threshold)',
        variables: [
          { symbol: '5 HP', name: 'This app\'s DOL/Star-Delta decision threshold', unit: 'HP' },
        ],
        meaning:
          'Below a certain motor size, DOL starting inrush is small enough in absolute terms (and brief enough) that it doesn\'t meaningfully disturb the supply or stress the contactor — above it, the inrush current and the mechanical shock of full-voltage starting become worth avoiding.',
        assumptions: 'This app uses a single flat 5 HP threshold as a simplification for a planning-stage tool. Real practice is more nuanced — the actual deciding factor is usually the supply authority\'s permitted starting current or voltage dip limit for a given installation, which depends on transformer capacity and what else is on the same supply, not a universal HP number. Treat this threshold as a reasonable rule of thumb for a crane-scale panel, not a citation-backed universal rule.',
        workedExample: 'A 4.38 HP hoist motor: star-delta NOT required (4.38 < 5). A 17.53 HP motor: star-delta IS required (17.53 > 5).',
        industrialNote: 'On an actual project, the real constraint is usually stated by the electricity supply authority as a maximum permitted starting current or voltage-dip percentage, not a flat motor HP figure — this app\'s threshold is a reasonable stand-in for a student/portfolio tool, not something to cite as an industry-wide rule.',
        commonMistakes: ['Treating a flat HP threshold as universally correct — always check the actual supply authority\'s starting current limit for a real installation.'],
        relatedCalculator: { label: 'Star-Delta Starter', path: '/star-delta' },
        interviewTip: 'If pushed on "why 5 HP specifically," the honest answer is that it\'s this app\'s simplification for a planning-stage tool — the real answer in practice is "whatever your supply authority\'s starting current limit requires," which is worth saying explicitly rather than defending 5 HP as if it were a standard.',
      },
    ],
  },
  {
    id: 'crane-specific',
    title: 'Crane-Specific Calculations',
    topics: [
      {
        id: 'duty-class',
        title: 'Duty Classification (M3–M8)',
        equation: 'No single formula — a classification, not a calculation',
        variables: [
          { symbol: 'M3–M8', name: 'ISO 4301-1 / FEM 9.511 mechanism duty classes, light to extremely severe', unit: '' },
        ],
        meaning:
          'Duty class describes how hard a crane\'s mechanisms actually work over their life — how many lifting cycles per hour, how close to full rated load on average, and how many operating hours per year. It drives both mechanical design (structural fatigue life) and electrical design (motor cyclic duty rating, contactor electrical-life category).',
        assumptions: 'This app labels duty classes descriptively (M3 = light/infrequent through M8 = 24hr continuous) rather than computing a class from usage statistics — a real duty class assignment in practice comes from a load spectrum and cycle-count analysis specific to the installation, which is outside this tool\'s scope.',
        workedExample: 'Two cranes with identical 4.38 HP hoist motors: one M3 (workshop, infrequent lifts) and one M6 (continuous production) have the same FLC-based current calculation, but the M6 crane needs an AC-4-rated contactor built for far more electrical operations, not just a contactor rated for the same amperage.',
        industrialNote: 'This is why duty class is selected FIRST in this app\'s workflow (Crane Selector, before the Load Calculator) — it is upstream context that should inform electrical component selection, not an afterthought.',
        commonMistakes: ['Treating duty class as a purely structural/mechanical concern — it has real, distinct electrical component consequences (see the Crane Selector page for the full explanation).'],
        relatedCalculator: { label: 'Crane Selector', path: '/cranes' },
        interviewTip: 'A candidate who can explain BOTH the mechanical (fatigue life) and electrical (contactor AC-3/AC-4 category) consequences of duty class stands out from one who only mentions structural design.',
      },
    ],
  },
  {
    id: 'protection',
    title: 'Protection & Component Selection',
    topics: [
      {
        id: 'contactor-sizing',
        title: 'Contactor Sizing',
        equation: 'Ie(contactor) ≥ 2.0 × FLC',
        variables: [
          { symbol: 'Ie', name: 'Contactor rated operational current', unit: 'A' },
          { symbol: '2.0×', name: 'Sizing multiplier for severe-duty (AC-4) reversing/jogging service', unit: '' },
        ],
        meaning:
          'A crane hoist/travel contactor doesn\'t just switch a motor on and off occasionally — it\'s reversed and jogged repeatedly, and briefly sees 6-8x FLC every time it starts. A contactor sized at exactly 1x FLC (fine for a light general-duty load) would wear out or weld its contacts under that duty.',
        assumptions: '2.0x is this app\'s figure for the most severe duty category (rapid reversing/jogging/plugging), which is what a crane hoist/travel contactor genuinely does. This was corrected from an earlier, uncited 3.0x figure — see the README audit log for the full story of that correction.',
        workedExample: 'Hoist motor FLC = 6.09 A → required ≥ 2.0 × 6.09 = 12.17 A → next standard contactor size = 16 A.',
        industrialNote: 'Duty class matters here too, not just current — see the Duty Classification entry. A contactor adequately rated for current can still be the wrong choice if it isn\'t rated for the expected number of electrical operations.',
        commonMistakes: ['Sizing a contactor purely by current multiplier and ignoring duty class / expected operations per hour.', 'Using a light-duty (AC-3-only) contactor for a genuinely reversing/jogging application.'],
        relatedCalculator: { label: 'Load Calculator', path: '/calculator' },
        interviewTip: 'Know the difference between AC-3 (standard motor starting/stopping) and AC-4 (rapid reversing/jogging/plugging) utilization categories per IEC 60947-4-1 — this is a near-guaranteed interview question for any crane-controls role.',
      },
      {
        id: 'overload-relay',
        title: 'Overload Relay Setting',
        equation: 'Setting = 1.05 × FLC',
        variables: [
          { symbol: '1.05×', name: 'Margin above FLC before the thermal element trips', unit: '' },
        ],
        meaning:
          'The overload relay\'s job is to trip on a genuine sustained overload (mechanical jam, single-phasing, excessive load) while staying closed through normal running current — setting it too close to FLC causes nuisance tripping, too far above it fails to protect the motor.',
        assumptions: 'This is a thermal (bimetallic or electronic) overload relay setting, not the same thing as the MPCB\'s magnetic instantaneous trip — the two protect against different failure speeds (overload relay: sustained, minutes; MPCB magnetic element: instantaneous, short-circuit-level fault).',
        workedExample: 'Hoist FLC = 6.09 A → overload setting = 1.05 × 6.09 = 6.39 A.',
        industrialNote: 'This relay is deliberately NOT self-resetting in this app\'s control circuit model — see the Control Circuits section for why (an intermittent fault could otherwise cycle the motor repeatedly, overheating it further each time).',
        commonMistakes: ['Confusing the overload relay setting with the MPCB rating — they serve different protective roles and are set differently.'],
        relatedCalculator: { label: 'Load Calculator', path: '/calculator' },
        interviewTip: 'If asked why the margin is only 5% (not 25% like the cable, or 100% like the contactor) — the overload relay\'s entire job is to trip close to FLC; a wide margin would defeat its purpose.',
      },
      {
        id: 'mpcb-sizing',
        title: 'MPCB (Motor Protection Circuit Breaker) Sizing',
        equation: 'MPCB rating ≥ FLC',
        variables: [
          { symbol: 'MPCB', name: 'Combined magnetic (short-circuit) + adjustable thermal (overload) breaker, one per motor branch', unit: 'A' },
        ],
        meaning:
          'Unlike the contactor (which switches) or a plain MCB (sized for cable protection), an MPCB\'s job is to protect one specific motor branch — it must trip on a genuine short circuit or sustained overload but stay closed through normal starting inrush, so it\'s set at (or just above) FLC rather than multiplied up like the contactor.',
        assumptions: 'This app selects the next standard MPCB rating at or above FLC from a fixed ratings table (0.63A–100A) — a real MPCB\'s adjustable thermal range would then be fine-tuned on-site to the actual measured FLC, not left at the breaker\'s maximum.',
        workedExample: 'Hoist FLC = 6.09 A → next standard MPCB rating = 6.3 A.',
        industrialNote: 'A plain MCB sized for cable protection would nuisance-trip on every motor start, since it has no adjustable thermal curve matched to a motor\'s starting characteristic — this is exactly why crane panels use one MPCB per motion instead of relying on the main incomer\'s breaker for everything downstream (see the Power Circuit page).',
        commonMistakes: ['Using a plain MCB instead of an MPCB for a motor branch — trips on every start due to inrush current.', 'Sizing the MPCB with a multiplier like the contactor — it shouldn\'t have one; its job is different.'],
        relatedCalculator: { label: 'Load Calculator', path: '/calculator' },
        interviewTip: 'Know the three-way distinction between MCB (general circuit protection), MPCB (motor-specific, combined magnetic+adjustable thermal), and MCCB (moulded-case, typically for the main incomer) — mixing these up is a common and noticeable interview mistake.',
      },
      {
        id: 'cable-sizing',
        title: 'Cable Sizing & Voltage Drop',
        equation: 'Cable capacity ≥ 1.25 × FLC       Vdrop = √3 × I × R × L',
        variables: [
          { symbol: '1.25×', name: 'Continuous industrial duty margin (ambient temperature, grouping derating)', unit: '' },
          { symbol: 'R', name: 'Cable resistance per unit length', unit: 'Ω/km' },
          { symbol: 'L', name: 'Cable run length', unit: 'km (converted from m)' },
        ],
        meaning:
          'Two separate checks, both necessary: the cable must be rated to carry the current safely in service (not just in free air — grouping with other cables in the same duct and ambient temperature both reduce a cable\'s real carrying capacity below its datasheet figure), AND it must not drop so much voltage over its length that the motor sees meaningfully less than 415V at its terminals.',
        assumptions: 'This app\'s voltage-drop formula accounts for cable resistance only, not reactance — a standard simplification for smaller cross-sections where reactance is small relative to resistance, though it becomes a slightly less complete picture for the largest cable sizes in the table (120mm²+), where reactance starts to matter more.',
        workedExample: 'Hoist FLC = 6.09 A → required capacity ≥ 1.25 × 6.09 = 7.61 A → selected 1.5mm² (rated 15A). Over a 20m run: voltage drop = 2.55V = 0.61% of 415V — comfortably under the 5% limit.',
        industrialNote: 'A cable can pass the ampacity check and still fail the voltage-drop check on a long run — these are genuinely two different constraints, and the larger of the two required sizes should govern the final selection (this app calculates both against the same selected size and flags separately if either is exceeded).',
        commonMistakes: ['Checking only ampacity (thermal capacity) and skipping voltage drop for long cable runs — a cable can be thermally fine and still cause the motor to be under-voltaged.', 'Using a cable\'s free-air rating without applying a grouping/ambient derating factor for real installation conditions.'],
        relatedCalculator: { label: 'Cable & Busbar Designer', path: '/cable-busbar' },
        interviewTip: 'A strong answer distinguishes these as two independent checks with two independent formulas, not one combined "cable sizing" calculation.',
      },
      {
        id: 'busbar-vs-stretch',
        title: 'Busbar vs. Stretch Wire (Runway Power Collection)',
        equation: 'Busbar preferred if travel span > 15m       Stretch wire length = 1.5 × span',
        variables: [
          { symbol: '15m', name: 'This app\'s busbar/stretch-wire threshold span', unit: 'm' },
          { symbol: '1.5×', name: 'Stretch wire length allowance for sag/slack over the travel span', unit: '' },
        ],
        meaning:
          'This is about how a moving crane bridge/trolley receives power at all, separate from the motor cable sizing above. Below a certain travel span, a simple trailing stretch cable is cost-effective and low-complexity; beyond it, cable weight and sag from its own length become a mechanical liability, and a rigid busbar with spring-loaded collector shoes becomes the better trade-off despite higher install cost.',
        assumptions: '15m is this app\'s planning-stage threshold, not a universal figure from a specific standard — treat it as a reasonable rule of thumb, with the real decision in practice also weighing installation budget, maintenance access, and expected duty cycle.',
        workedExample: 'A 20m travel span: stretch wire would need to be 20 × 1.5 = 30m of trailing cable (busbar recommended instead, since 20 > 15). A 10m span: stretch wire = 10 × 1.5 = 15m (stretch wire recommended, since 10 ≤ 15).',
        industrialNote: 'This is a completely separate electrical system from the motor supply cables sized above it on the same page — one feeds power to the whole moving crane structure, the other wires an individual motor once power has already arrived.',
        commonMistakes: ['Confusing this travel-span power-collection decision with motor cable sizing — they use different length inputs and answer different questions.'],
        relatedCalculator: { label: 'Cable & Busbar Designer', path: '/cable-busbar' },
        interviewTip: 'If asked why busbar isn\'t just always used — it has real trade-offs (higher install cost, more complex bracket/alignment work) that only pay off once span (and therefore stretch-cable sag) gets large enough.',
      },
    ],
  },
  {
    id: 'circuits',
    title: 'Control & Power Circuits',
    topics: [
      {
        id: 'dol-starting',
        title: 'Direct-On-Line (DOL) Starting',
        equation: 'Motor connected straight to full line voltage via a single contactor',
        variables: [],
        meaning:
          'The simplest starting method — one contactor connects the motor directly to full 3-phase supply. Simple, cheap, and fine for smaller motors, but produces the full inrush current discussed in the Starting Current entry above.',
        assumptions: 'This app treats DOL as the default for any motor below its 5 HP star-delta threshold.',
        workedExample: 'A 4.38 HP hoist motor at FLC 6.09 A starts DOL — inrush ≈ 6 × 6.09 = 36.5 A, brief and small enough in absolute terms not to warrant a reduced-voltage starter.',
        industrialNote: 'DOL starting is still the most common starting method for small-to-medium motors in practice — reduced-voltage starting (star-delta or soft-start) is a deliberate additional cost taken on only when the inrush current or mechanical shock is actually a problem for that specific installation.',
        commonMistakes: ['Assuming DOL is "wrong" or outdated — for small motors on an adequately sized supply, it\'s the standard, correct choice, not a shortcut.'],
        relatedCalculator: { label: 'Control Circuit Simulator', path: '/control-circuit' },
        interviewTip: 'Know when DOL is appropriate (small motor, adequate supply capacity) versus when it isn\'t (large motor, supply authority starting-current limits, or a load sensitive to starting torque shock).',
      },
      {
        id: 'star-delta-starting',
        title: 'Star-Delta Starting',
        equation: 'Star connection for ~timer duration, then switch to Delta for run',
        variables: [
          { symbol: 'Timer', name: 'Star-to-delta transition delay, typically a few seconds', unit: 's' },
        ],
        meaning:
          'Three contactors (main, star, delta) and a timer connect the motor windings in star for a brief period at start (reducing per-winding voltage and therefore starting current — see the Starting Current entry), then switch to delta for normal full-voltage running.',
        assumptions: 'The timer duration needs to be long enough for the motor to reach close to running speed in star before switching to delta — switching too early defeats the purpose (the motor is still drawing high current when the switch happens) and can itself cause a current transient.',
        workedExample: 'A 17.53 HP motor (FLC 23.33 A) star-delta starting: star inrush ≈ 46.66 A versus 139.98 A DOL — a real reduction, but not zero, and starting torque drops proportionally too.',
        industrialNote: 'Star-delta contactors need their own electrical interlocking too — star and delta must never be energized simultaneously (that would short the windings in a different, equally dangerous way to the forward/reverse interlock failure covered elsewhere in this app).',
        commonMistakes: ['Setting the timer too short — motor hasn\'t reached near-running speed before the switch to delta, causing a second current spike nearly as bad as DOL.', 'Forgetting star/delta contactors need mutual interlocking, same principle as forward/reverse.'],
        relatedCalculator: { label: 'Star-Delta Starter', path: '/star-delta' },
        interviewTip: 'A good interview answer notes star-delta interlocking uses the exact same NC-contact principle as forward/reverse interlocking on this app\'s Control Circuit page — it\'s the same underlying idea applied to a different pair of contactors.',
      },
      {
        id: 'forward-reverse-interlock',
        title: 'Forward/Reverse Electrical Interlocking',
        equation: 'Relay(dir) energizes only if: PB(dir) held AND Relay(opposite) NOT energized',
        variables: [],
        meaning:
          'Swapping any two of a motor\'s three phase connections reverses its rotation direction. If the Forward and Reverse contactors for one motor were ever closed at the same instant, those two swapped phase lines would be shorted directly together through both contactors — a bolted phase-to-phase fault, not just a wiring inconvenience. The interlock exists specifically to make that combination physically impossible, not merely discouraged.',
        assumptions: 'This app\'s control circuit is deliberately hold-to-run (no seal-in/latching relay) — a genuine, common design choice for crane pendant controls specifically because releasing any button always stops motion, which matters for safety. See the Control Circuit page\'s Expert-tier explanation for the fuller discussion of this design choice versus a seal-in starter circuit.',
        workedExample: 'See the interactive Control Circuit page for a live, testable version of this logic — including what happens on E-Stop, overload trip and reset, and simulated supply failure.',
        industrialNote: 'This interlock only applies WITHIN one motion (Forward vs. Reverse of the same motor) — it does NOT prevent Hoist, Long Travel and Cross Travel from all running simultaneously, which is completely normal crane operation. See the Panel Simulator page for why.',
        commonMistakes: ['Wiring the interlock NC contact as NO by mistake — this is one of the fault scenarios covered on the Fault Diagnosis page, and it\'s one of the more dangerous wiring errors possible on a crane panel.', 'Assuming interlocking should prevent ALL simultaneous motion, not just opposing directions on the same motor.'],
        relatedCalculator: { label: 'Control Circuit Simulator', path: '/control-circuit' },
        interviewTip: 'This is close to a guaranteed question in any crane-controls interview — know it cold, including what physically happens if the interlock fails (see Fault Diagnosis).',
      },
      {
        id: 'no-nc-contacts',
        title: 'NO and NC Contacts',
        equation: 'NO: open when de-energized, closes when actuated. NC: closed when de-energized, opens when actuated.',
        variables: [],
        meaning:
          'Every relay, contactor, pushbutton and limit switch has contacts described this way, referring to their REST (de-energized/unactuated) state. A Normally Open (NO) contact needs the device actuated to conduct; a Normally Closed (NC) contact conducts by default and stops conducting when actuated.',
        assumptions: 'The choice of NO vs. NC for a given safety function is deliberate, not arbitrary — E-Stop, overload relays and limit switches on this app\'s Control Circuit page all use NC contacts specifically so that a broken wire or lost connection FAILS SAFE (looks like the protective device tripped) rather than failing invisibly.',
        workedExample: 'The main power feed on the Control Circuit page runs through E-Stop\'s NC contact and the overload relay\'s NC contact in series — either one opening (deliberately, or from a wiring fault) cuts power the same way.',
        industrialNote: 'This is why safety-critical devices are wired NC almost universally: a cut wire on an NC safety contact still stops the machine (fails safe); a cut wire on an NO safety contact would fail invisibly, with the device silently unable to ever trip.',
        commonMistakes: ['Wiring a safety device (E-Stop, limit switch, overload) as NO instead of NC — defeats the fail-safe property entirely.'],
        relatedCalculator: { label: 'Control Circuit Simulator', path: '/control-circuit' },
        interviewTip: 'The fail-safe reasoning (a broken wire on an NC safety contact still stops the machine) is the answer interviewers are actually listening for — not just the NO/NC definitions themselves.',
      },
      {
        id: 'seal-in-circuits',
        title: 'Seal-In (Latching) Circuits',
        equation: 'Once started, an auxiliary NO contact (in parallel with the start button) holds the coil energized after the start button is released',
        variables: [],
        meaning:
          'A standard industrial motor starter typically uses a momentary Start pushbutton — press once, and an auxiliary contact on the contactor itself "seals in" (holds the circuit closed) so the motor keeps running after you let go of the button. A separate Stop button (normally closed) breaks the seal-in path to stop it.',
        assumptions: 'This app\'s crane control circuits (Control Circuit and Panel Simulator pages) deliberately do NOT use a seal-in circuit — they\'re hold-to-run instead, meaning the motor only runs while the direction button is physically held. This is a genuine, common design choice for crane pendant/cab controls specifically, not an oversight: releasing any control always stops motion immediately, which matters when a human is actively controlling a suspended load.',
        workedExample: 'A general-purpose conveyor or pump motor starter: seal-in circuit is completely standard. A crane hoist pendant control: hold-to-run is standard instead, for the safety reason above.',
        industrialNote: 'Understanding when EACH pattern is the right choice — not assuming one is always correct — is itself a useful piece of engineering judgment worth having straight for an interview.',
        commonMistakes: ['Assuming every motor starter uses seal-in — crane pendant/hold-to-run controls are a deliberate, common exception, not a lesser version of a "proper" starter.'],
        relatedCalculator: { label: 'Control Circuit Simulator', path: '/control-circuit' },
        interviewTip: 'If asked "why doesn\'t this crane panel use seal-in like a standard motor starter" — the honest answer is a safety design choice specific to crane pendant/cab controls, and a good candidate should be able to articulate why (continuous operator engagement = motion stops the instant they let go).',
      },
    ],
  },
]

export const PROTECTION_GLOSSARY = [
  { term: 'MCB', full: 'Miniature Circuit Breaker', def: 'General-purpose overcurrent protection, typically for the main incoming supply or lighting/small-load circuits — not motor-specific.' },
  { term: 'MCCB', full: 'Moulded Case Circuit Breaker', def: 'A larger, typically adjustable circuit breaker, commonly used as the main incomer for a panel handling more current than an MCB range covers.' },
  { term: 'MPCB', full: 'Motor Protection Circuit Breaker', def: 'Combines a magnetic (instantaneous short-circuit) trip with an adjustable thermal (overload) trip, sized specifically to one motor\'s FLC — see the Cable & Busbar / Load Calculator worked examples above.' },
  { term: 'SPP', full: 'Single Phase Preventer', def: 'Monitors phase balance on the incoming 3-phase supply and trips on phase loss or reversal — catches a failure mode a plain thermal overload relay often can\'t catch fast enough (see Fault Diagnosis).' },
  { term: 'Overload Relay', full: '—', def: 'Thermal (or electronic) protection against sustained excess current — set close to FLC (this app: 1.05× FLC), deliberately non-self-resetting.' },
  { term: 'E-Stop', full: 'Emergency Stop', def: 'A manually latching NC pushbutton that cuts control power to all motions instantly — requires deliberate twist-and-release before anything can restart.' },
  { term: 'DOL', full: 'Direct-On-Line', def: 'The simplest motor starting method — full voltage applied directly via a single contactor. See the Control & Power Circuits section.' },
  { term: 'FLC', full: 'Full Load Current', def: 'The steady-state current a motor draws at its rated output — the single number every protection device in this app is sized from.' },
  { term: 'EOT Crane', full: 'Electric Overhead Traveling Crane', def: 'The crane type this entire app is built around — bridge travels on runway rails, trolley/hoist travels across the bridge.' },
  { term: 'LT', full: 'Long Travel', def: 'Motion of the crane bridge along the runway (the long axis of the building/bay).' },
  { term: 'CT', full: 'Cross Travel', def: 'Motion of the trolley across the bridge (the short axis) — sometimes also called "trolley travel."' },
]

export const IEC_SYMBOLS = [
  { id: 'no-contact', label: 'NO Contact', desc: 'Two short parallel strokes with a gap, one offset — open (non-conducting) at rest.' },
  { id: 'nc-contact', label: 'NC Contact', desc: 'Same as NO, with a diagonal stroke across the gap — closed (conducting) at rest, the stroke represents the bridging contact.' },
  { id: 'coil', label: 'Relay / Contactor Coil', desc: 'A rectangle, usually labeled with the device reference (e.g. K1, R1) — energizing it actuates every contact that shares its reference.' },
  { id: 'breaker', label: 'Circuit Breaker', desc: 'A switch symbol with a small square or X marking the interrupting mechanism — MCB/MCCB/MPCB share this base symbol, distinguished by rating and trip-curve notation alongside it.' },
  { id: 'motor', label: 'Motor', desc: 'A circle with "M" inside — sometimes with the phase count and pole count noted alongside (e.g. "M / 3~").' },
]
