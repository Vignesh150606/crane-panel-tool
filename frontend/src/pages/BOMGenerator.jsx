import { useState } from 'react'
import { CONTACTOR_RATINGS, MPCB_RATINGS, CABLE_SIZES, CABLE_CAPACITY, ENGINEERING_CONSTANTS } from '../data/craneData'

function calcFLC(hp) {
  const kw = hp * ENGINEERING_CONSTANTS.HP_TO_KW
  return (kw * 1000) / (Math.sqrt(3) * ENGINEERING_CONSTANTS.VOLTAGE_3PHASE * ENGINEERING_CONSTANTS.POWER_FACTOR * ENGINEERING_CONSTANTS.EFFICIENCY_FACTOR)
}

function selectContactor(flc) {
  const required = flc * 3
  return CONTACTOR_RATINGS.find(r => r >= required) || CONTACTOR_RATINGS[CONTACTOR_RATINGS.length - 1]
}

function selectMPCB(flc) {
  return MPCB_RATINGS.find(r => r >= flc) || MPCB_RATINGS[MPCB_RATINGS.length - 1]
}

function selectCable(flc) {
  for (const size of CABLE_SIZES) {
    if (CABLE_CAPACITY[size] >= flc * 1.25) return size
  }
  return CABLE_SIZES[CABLE_SIZES.length - 1]
}

export default function BOMGenerator() {
  const [inputs, setInputs] = useState({ hoistHP: 5, ltHP: 2, ctHP: 1.5, travelLength: 20, voltage: 415 })
  const [bom, setBom] = useState(null)

  const update = (k, v) => setInputs(p => ({ ...p, [k]: v }))

  const generateBOM = () => {
    const motors = { Hoist: inputs.hoistHP, 'Long Travel': inputs.ltHP, 'Cross Travel': inputs.ctHP }
    const items = []
    let slNo = 1

    // Main MCB
    const totalFLC = Object.values(motors).reduce((sum, hp) => sum + calcFLC(hp), 0)
    const mainMCB = CONTACTOR_RATINGS.find(r => r >= totalFLC * 1.25) || 100
    items.push({ slNo: slNo++, component: 'Main MCB', spec: `${mainMCB}A, 3-pole, 415V`, qty: 1, unit: 'No', purpose: 'Main incoming protection' })

    // SPP
    items.push({ slNo: slNo++, component: 'Single Phase Preventer (SPP)', spec: '415V, 3-phase, with phase sequence protection', qty: 1, unit: 'No', purpose: 'Phase loss / reversal protection' })

    // Control transformer
    items.push({ slNo: slNo++, component: 'Control Transformer', spec: '415V / 110V, suitable VA rating', qty: 1, unit: 'No', purpose: 'Contactor coil supply (110V AC)' })

    // Per motor components
    for (const [motorName, hp] of Object.entries(motors)) {
      const flc = calcFLC(hp)
      const contRating = selectContactor(flc)
      const mpcbRating = selectMPCB(flc)
      const cableSize = selectCable(flc)
      const starDelta = hp > 5
      const kw = (hp * 0.746).toFixed(1)

      items.push({ slNo: slNo++, component: `MPCB — ${motorName}`, spec: `${mpcbRating}A, adjustable, 415V`, qty: 1, unit: 'No', purpose: `Overload & SC protection for ${motorName} motor` })
      items.push({ slNo: slNo++, component: `Contactor — ${motorName} (pair)`, spec: `${contRating}A, 415V coil 110V AC`, qty: 2, unit: 'No', purpose: `Direction control (Fwd/Rev) with interlock` })
      items.push({ slNo: slNo++, component: `Overload Relay — ${motorName}`, spec: `Adjustable, set at ${flc.toFixed(1)}A FLC`, qty: 1, unit: 'No', purpose: `Thermal protection for ${motorName} motor` })
      items.push({ slNo: slNo++, component: `Power Cable — ${motorName}`, spec: `${cableSize} mm² 4-core copper armoured`, qty: 1, unit: 'Lot', purpose: `Supply to ${motorName} motor (${kw} kW / ${hp} HP)` })

      if (starDelta) {
        items.push({ slNo: slNo++, component: `Star-Delta Starter — ${motorName}`, spec: `Auto star-delta, 415V, timer-based`, qty: 1, unit: 'No', purpose: `Reduced voltage starting for ${hp} HP motor` })
      }
    }

    // Relay section
    items.push({ slNo: slNo++, component: '8-pin Relay with socket', spec: '24V DC coil, 10A contacts', qty: 6, unit: 'No', purpose: 'Interlock logic — 2 per motion (LT/CT/Hoist)' })
    items.push({ slNo: slNo++, component: '14-pin Relay with socket', spec: '24V DC coil, 10A contacts', qty: 3, unit: 'No', purpose: 'Auxiliary control and indicator logic' })

    // Panel hardware
    items.push({ slNo: slNo++, component: 'DIN Rail', spec: '35mm standard, 1m length', qty: 3, unit: 'Pcs', purpose: 'Component mounting' })
    items.push({ slNo: slNo++, component: 'Cable Duct', spec: '40×40mm PVC with cover', qty: 5, unit: 'Mtr', purpose: 'Wire routing and management' })
    items.push({ slNo: slNo++, component: 'Terminal Block (10A)', spec: 'Screw type, 4mm²', qty: 50, unit: 'No', purpose: 'Wire termination points' })
    items.push({ slNo: slNo++, component: 'Cable Gland', spec: 'M20, IP55', qty: 8, unit: 'No', purpose: 'Panel entry points for cables' })
    items.push({ slNo: slNo++, component: 'Push Button (NO)', spec: '22mm, green, 415V', qty: 6, unit: 'No', purpose: 'Start/direction control — LT/CT/Hoist' })
    items.push({ slNo: slNo++, component: 'Push Button (NC)', spec: '22mm, red, Emergency Stop', qty: 2, unit: 'No', purpose: 'E-Stop and Stop control' })
    items.push({ slNo: slNo++, component: 'Limit Switch', spec: '15A, IP55, with roller', qty: 6, unit: 'No', purpose: 'Travel limit protection — 2 per motion' })
    items.push({ slNo: slNo++, component: 'Pendant Control Station', spec: '6-button + E-Stop, 10m cable', qty: 1, unit: 'No', purpose: 'Operator control pendant' })

    // Supply wiring
    const wireLength = Math.ceil(inputs.travelLength * 1.5)
    items.push({ slNo: slNo++, component: 'Supply Cable (stretch/busbar)', spec: `${wireLength}m for ${inputs.travelLength}m travel span`, qty: wireLength, unit: 'Mtr', purpose: 'Power supply to moving crane (1.5× travel length)' })

    setBom(items)
  }

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>📋 BOM Generator</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Auto-generate complete bill of materials based on motor ratings and crane parameters.</p>

      {/* Inputs */}
      <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #2d3f50', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '1rem' }}>Motor Ratings</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Hoist Motor HP', key: 'hoistHP' },
            { label: 'Long Travel HP', key: 'ltHP' },
            { label: 'Cross Travel HP', key: 'ctHP' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>{f.label}</label>
              <input
                type="number"
                value={inputs[f.key]}
                min={0.5}
                step={0.5}
                onChange={e => update(f.key, parseFloat(e.target.value))}
                style={{ width: '100%', backgroundColor: '#0f1923', border: '1px solid #2d3f50', borderRadius: '0.375rem', padding: '0.5rem', color: 'white' }}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>Travel Length (m)</label>
            <input
              type="number"
              value={inputs.travelLength}
              onChange={e => update('travelLength', parseFloat(e.target.value))}
              style={{ width: '100%', backgroundColor: '#0f1923', border: '1px solid #2d3f50', borderRadius: '0.375rem', padding: '0.5rem', color: 'white' }}
            />
          </div>
          <button
            onClick={generateBOM}
            style={{ padding: '0.6rem 2rem', backgroundColor: '#f59e0b', color: 'black', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Generate BOM
          </button>
        </div>
      </div>

      {/* BOM Table */}
      {bom && (
        <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', border: '1px solid #2d3f50', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #2d3f50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: '#f59e0b', fontWeight: '600' }}>Bill of Materials ({bom.length} items)</h2>
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Based on IS/IEC standards</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f1923' }}>
                  {['Sl.No', 'Component', 'Specification', 'Qty', 'Unit', 'Purpose'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', color: '#94a3b8', borderBottom: '1px solid #2d3f50', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bom.map((item, i) => (
                  <tr key={item.slNo} style={{ backgroundColor: i % 2 === 0 ? '#1a2632' : '#0f1923' }}>
                    <td style={{ padding: '0.6rem 1rem', color: '#64748b', borderBottom: '1px solid #2d3f5044' }}>{item.slNo}</td>
                    <td style={{ padding: '0.6rem 1rem', color: '#e2e8f0', fontWeight: '500', borderBottom: '1px solid #2d3f5044' }}>{item.component}</td>
                    <td style={{ padding: '0.6rem 1rem', color: '#f59e0b', borderBottom: '1px solid #2d3f5044' }}>{item.spec}</td>
                    <td style={{ padding: '0.6rem 1rem', color: '#22c55e', fontWeight: '600', textAlign: 'center', borderBottom: '1px solid #2d3f5044' }}>{item.qty}</td>
                    <td style={{ padding: '0.6rem 1rem', color: '#94a3b8', borderBottom: '1px solid #2d3f5044' }}>{item.unit}</td>
                    <td style={{ padding: '0.6rem 1rem', color: '#64748b', borderBottom: '1px solid #2d3f5044' }}>{item.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}