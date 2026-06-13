import { useState } from 'react'
import { CONTACTOR_RATINGS, MPCB_RATINGS, CABLE_SIZES, CABLE_CAPACITY, ENGINEERING_CONSTANTS } from '../data/craneData'

export default function NameplateCalculator() {
  const [inputs, setInputs] = useState({ voltage: 415, current: 10, hp: 0, kw: 0, rpm: 1440, pf: 0.85, useHP: true })
  const [results, setResults] = useState(null)

  const update = (k, v) => setInputs(p => ({ ...p, [k]: v }))

  const calculate = () => {
    let hp = inputs.useHP ? parseFloat(inputs.hp) : parseFloat(inputs.kw) / ENGINEERING_CONSTANTS.HP_TO_KW
    let kw = hp * ENGINEERING_CONSTANTS.HP_TO_KW
    const flc = parseFloat(inputs.current)
    const contRating = CONTACTOR_RATINGS.find(r => r >= flc * 3) || CONTACTOR_RATINGS[CONTACTOR_RATINGS.length - 1]
    const mpcbRating = MPCB_RATINGS.find(r => r >= flc) || MPCB_RATINGS[MPCB_RATINGS.length - 1]
    const overloadSetting = (flc * 1.05).toFixed(1)
    const cableSize = CABLE_SIZES.find(s => CABLE_CAPACITY[s] >= flc * 1.25) || CABLE_SIZES[CABLE_SIZES.length - 1]
    const starDelta = hp > 5
    const inrushCurrent = (flc * 6).toFixed(1)

    setResults({
      hp: hp.toFixed(2), kw: kw.toFixed(2), flc: flc.toFixed(2),
      contRating, mpcbRating, overloadSetting, cableSize,
      starDelta, inrushCurrent,
      starCurrentReduction: (flc * 6 / 3).toFixed(1)
    })
  }

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>🔧 Nameplate Calculator</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        Enter motor nameplate values to get contactor rating, MPCB setting, overload relay setting, and cable size.
        Based on the 3× FLC rule and IS standards.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Input */}
        <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #2d3f50' }}>
          <h2 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '1.5rem' }}>Motor Nameplate Data</h2>

          {/* Nameplate visual */}
          <div style={{ backgroundColor: '#0f1923', border: '2px solid #2d3f50', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
            <div style={{ color: '#f59e0b', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.8rem' }}>MOTOR NAMEPLATE</div>
            {[
              { label: 'Voltage', value: `${inputs.voltage} V` },
              { label: 'Current', value: `${inputs.current} A` },
              { label: 'Speed', value: `${inputs.rpm} RPM` },
              { label: 'Power Factor', value: inputs.pf },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                <span>{item.label}:</span>
                <span style={{ color: '#e2e8f0' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="checkbox" checked={inputs.useHP} onChange={e => update('useHP', e.target.checked)} />
              Enter power in HP (uncheck for kW)
            </label>
          </div>

          {[
            { label: 'Voltage (V)', key: 'voltage', min: 110, max: 690 },
            { label: 'Full Load Current (A)', key: 'current', min: 0.1, max: 500, step: 0.1 },
            { label: inputs.useHP ? 'Power (HP)' : 'Power (kW)', key: inputs.useHP ? 'hp' : 'kw', min: 0.1, max: 500, step: 0.1 },
            { label: 'Speed (RPM)', key: 'rpm', min: 500, max: 3000 },
            { label: 'Power Factor', key: 'pf', min: 0.5, max: 1.0, step: 0.01 },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: '0.75rem' }}>
              <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>{field.label}</label>
              <input
                type="number"
                value={inputs[field.key]}
                min={field.min}
                max={field.max}
                step={field.step || 1}
                onChange={e => update(field.key, e.target.value)}
                style={{ width: '100%', backgroundColor: '#0f1923', border: '1px solid #2d3f50', borderRadius: '0.375rem', padding: '0.5rem', color: 'white' }}
              />
            </div>
          ))}

          <button
            onClick={calculate}
            style={{ width: '100%', backgroundColor: '#f59e0b', color: 'black', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', fontWeight: '700', cursor: 'pointer', marginTop: '0.5rem' }}
          >
            Calculate Component Ratings
          </button>
        </div>

        {/* Results */}
        <div>
          {results ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #2d3f50' }}>
                <h3 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '1rem' }}>Component Ratings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[
                    { label: 'Motor Power', value: `${results.hp} HP / ${results.kw} kW`, color: '#94a3b8' },
                    { label: 'Full Load Current', value: `${results.flc} A`, color: '#e2e8f0' },
                    { label: 'Contactor Rating', value: `${results.contRating} A`, color: '#22c55e', note: '(3× FLC rule)' },
                    { label: 'MPCB Rating', value: `${results.mpcbRating} A`, color: '#22c55e' },
                    { label: 'Overload Setting', value: `${results.overloadSetting} A`, color: '#f59e0b' },
                    { label: 'Cable Size', value: `${results.cableSize} mm²`, color: '#3b82f6' },
                  ].map(item => (
                    <div key={item.label} style={{ backgroundColor: '#0f1923', padding: '0.75rem', borderRadius: '0.5rem' }}>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '0.25rem' }}>{item.label}</div>
                      <div style={{ color: item.color, fontWeight: '700', fontSize: '0.9rem' }}>{item.value}</div>
                      {item.note && <div style={{ color: '#64748b', fontSize: '0.65rem' }}>{item.note}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {results.starDelta && (
                <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.25rem', border: '2px solid #f59e0b' }}>
                  <h3 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '0.75rem' }}>⚡ Star-Delta Starter Required</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Motor HP {'>'} 5 HP — Direct-on-line starting would cause high inrush current.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ backgroundColor: '#0f1923', padding: '0.6rem', borderRadius: '0.375rem' }}>
                      <div style={{ color: '#64748b', fontSize: '0.7rem' }}>DOL Inrush Current</div>
                      <div style={{ color: '#ef4444', fontWeight: '700' }}>{results.inrushCurrent} A</div>
                    </div>
                    <div style={{ backgroundColor: '#0f1923', padding: '0.6rem', borderRadius: '0.375rem' }}>
                      <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Star Start Inrush</div>
                      <div style={{ color: '#22c55e', fontWeight: '700' }}>{results.starCurrentReduction} A</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.8' }}>
                    <div>STAR: U2-V2-W2 shorted → reduced voltage</div>
                    <div>DELTA: U1→W2, V1→U2, W1→V2 → full voltage</div>
                  </div>
                </div>
              )}

              <div style={{ backgroundColor: '#0f1923', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #2d3f50' }}>
                <div style={{ color: '#f59e0b', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem' }}>📐 Calculation Basis</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', lineHeight: '1.8' }}>
                  <div>Contactor = 3 × FLC = 3 × {results.flc} = {(results.flc * 3).toFixed(1)} A → {results.contRating} A (next standard)</div>
                  <div>MPCB = FLC = {results.flc} A → {results.mpcbRating} A (next standard)</div>
                  <div>Overload = 105% × FLC = {results.overloadSetting} A</div>
                  <div>Cable = 125% × FLC for derating = {(results.flc * 1.25).toFixed(1)} A → {results.cableSize} mm²</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '3rem', border: '1px solid #2d3f50', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
              <p style={{ color: '#64748b' }}>Enter nameplate values and click Calculate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}