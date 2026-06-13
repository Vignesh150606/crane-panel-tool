// ── Crane Types ────────────────────────────────────────────────
export const CRANE_TYPES = {
  EOT_SINGLE: {
    id: "EOT_SINGLE",
    name: "EOT Single Girder",
    fullName: "Electric Overhead Travelling Crane - Single Girder",
    category: "EOT",
    description: "Most common industrial crane. Single bridge girder, hoist runs on bottom flange. Suitable for light to medium duty applications.",
    capacityRange: "0.5T - 10T",
    spanRange: "5m - 20m",
    applications: ["Manufacturing", "Warehouses", "Assembly lines"],
    motions: ["Long Travel (LT)", "Cross Travel (CT)", "Hoist"],
    image: "eot_single",
    specs: {
      girders: 1,
      hoistPosition: "Bottom flange",
      maxCapacity: 10,
      typicalDutyClass: "M3-M5"
    }
  },
  EOT_DOUBLE: {
    id: "EOT_DOUBLE",
    name: "EOT Double Girder",
    fullName: "Electric Overhead Travelling Crane - Double Girder",
    category: "EOT",
    description: "Two parallel bridge girders for heavy duty lifting. Hoist runs on top rails offering greater hook height and load capacity.",
    capacityRange: "5T - 500T",
    spanRange: "10m - 40m",
    applications: ["Heavy engineering", "Steel plants", "Foundries"],
    motions: ["Long Travel (LT)", "Cross Travel (CT)", "Hoist"],
    image: "eot_double",
    specs: {
      girders: 2,
      hoistPosition: "Top mounted on rails",
      maxCapacity: 500,
      typicalDutyClass: "M5-M8"
    }
  },
  GANTRY_SINGLE: {
    id: "GANTRY_SINGLE",
    name: "Single Girder Gantry",
    fullName: "Single Girder Gantry Crane",
    category: "Gantry",
    description: "Bridge supported by two legs on ground-level rails. Cost-effective for outdoor applications.",
    capacityRange: "1T - 20T",
    spanRange: "5m - 30m",
    applications: ["Shipyards", "Railways", "Open storage yards"],
    motions: ["Long Travel (LT)", "Cross Travel (CT)", "Hoist"],
    image: "gantry_single",
    specs: {
      girders: 1,
      hoistPosition: "Bottom flange",
      maxCapacity: 20,
      typicalDutyClass: "M3-M5"
    }
  },
  GANTRY_DOUBLE: {
    id: "GANTRY_DOUBLE",
    name: "Double Girder Gantry",
    fullName: "Double Girder Gantry Crane",
    category: "Gantry",
    description: "Heavy duty outdoor crane with two girders. High stability and lifting capacity.",
    capacityRange: "10T - 300T",
    spanRange: "15m - 50m",
    applications: ["Port handling", "Heavy fabrication", "Railway workshops"],
    motions: ["Long Travel (LT)", "Cross Travel (CT)", "Hoist"],
    image: "gantry_double",
    specs: {
      girders: 2,
      hoistPosition: "Top mounted",
      maxCapacity: 300,
      typicalDutyClass: "M5-M8"
    }
  },
  JIB_WALL: {
    id: "JIB_WALL",
    name: "Wall Mounted Jib",
    fullName: "Wall Mounted Jib Crane",
    category: "Jib",
    description: "Horizontal boom fixed to wall or column. Limited arc of coverage, ideal for workstations.",
    capacityRange: "0.1T - 3T",
    spanRange: "2m - 6m",
    applications: ["Workstations", "Assembly lines", "Machine loading"],
    motions: ["Slew (rotation)", "Hoist"],
    image: "jib_wall",
    specs: {
      girders: 1,
      hoistPosition: "Boom flange",
      maxCapacity: 3,
      typicalDutyClass: "M3-M4"
    }
  },
  JIB_FLOOR: {
    id: "JIB_FLOOR",
    name: "Floor Mounted Jib",
    fullName: "Floor Mounted Jib Crane",
    category: "Jib",
    description: "Mounted on floor pillar. 360° swing capability where wall mounting is not feasible.",
    capacityRange: "0.1T - 5T",
    spanRange: "2m - 8m",
    applications: ["Workshop centres", "Maintenance areas", "Loading bays"],
    motions: ["Slew 360°", "Hoist"],
    image: "jib_floor",
    specs: {
      girders: 1,
      hoistPosition: "Boom flange",
      maxCapacity: 5,
      typicalDutyClass: "M3-M5"
    }
  },
  SEMI_GANTRY: {
    id: "SEMI_GANTRY",
    name: "Semi Gantry",
    fullName: "Semi Gantry Crane",
    category: "Gantry",
    description: "Hybrid between EOT and Gantry. One side on elevated runway beam, other on ground rail.",
    capacityRange: "1T - 30T",
    spanRange: "8m - 25m",
    applications: ["Workshops with limited columns", "Mixed floor/elevated structures"],
    motions: ["Long Travel (LT)", "Cross Travel (CT)", "Hoist"],
    image: "semi_gantry",
    specs: {
      girders: 1,
      hoistPosition: "Bottom flange",
      maxCapacity: 30,
      typicalDutyClass: "M4-M6"
    }
  },
  MONORAIL: {
    id: "MONORAIL",
    name: "Monorail",
    fullName: "Monorail Crane",
    category: "Special",
    description: "Single overhead rail with hoist trolley moving in straight line. Fixed path material handling.",
    capacityRange: "0.5T - 10T",
    spanRange: "Fixed path",
    applications: ["Assembly lines", "Loading docks", "Production facilities"],
    motions: ["Long Travel (LT)", "Hoist"],
    image: "monorail",
    specs: {
      girders: 1,
      hoistPosition: "Rail mounted",
      maxCapacity: 10,
      typicalDutyClass: "M4-M6"
    }
  }
}

// ── Engineering Calculation Constants ─────────────────────────
export const ENGINEERING_CONSTANTS = {
  HP_TO_KW: 0.746,
  KW_TO_HP: 1.341,
  CONTACTOR_RATING_MULTIPLIER: 3,   // contactor must be 3x motor FLC
  CABLE_LENGTH_FACTOR: 1.5,         // stretch wire = 1.5x travel length
  EFFICIENCY_FACTOR: 0.85,          // motor efficiency assumption
  POWER_FACTOR: 0.85,               // typical industrial motor PF
  VOLTAGE_3PHASE: 415,              // standard 3-phase voltage in India
  STAR_DELTA_THRESHOLD_HP: 5,       // motors above 5HP need star-delta
}

// ── Standard Contactor Ratings (Amps) ─────────────────────────
export const CONTACTOR_RATINGS = [9, 12, 16, 18, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400]

// ── Standard MPCB Ratings (Amps) ──────────────────────────────
export const MPCB_RATINGS = [0.63, 1, 1.6, 2.5, 4, 6.3, 10, 16, 25, 32, 40, 50, 63, 80, 100]

// ── Cable Cross Section Standards (mm²) ───────────────────────
export const CABLE_SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240]

// ── Cable Current Capacity (Amps) for 3-core copper cable ─────
export const CABLE_CAPACITY = {
  1.5: 15, 2.5: 20, 4: 27, 6: 34, 10: 46,
  16: 61, 25: 80, 35: 99, 50: 119, 70: 151,
  95: 182, 120: 210, 150: 240, 185: 273, 240: 320
}

// ── Duty Class Descriptions ────────────────────────────────────
export const DUTY_CLASSES = {
  M3: "Light duty — infrequent use, long rest periods",
  M4: "Moderate duty — regular use in general workshops",
  M5: "Heavy duty — intensive use in production facilities",
  M6: "Very heavy duty — continuous production",
  M7: "Severe duty — steel plants, foundries",
  M8: "Extremely severe — 24hr continuous operation"
}