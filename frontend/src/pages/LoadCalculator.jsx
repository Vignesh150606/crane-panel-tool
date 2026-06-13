import { useState } from 'react'
import { CONTACTOR_RATINGS, MPCB_RATINGS, CABLE_SIZES, CABLE_CAPACITY, ENGINEERING_CONSTANTS } from '../data/craneData'

function calcMotorHP(loadTons, speed, efficiency = 0.85) {
  const loadKg = loadTons * 1000
  const speedMs = speed / 60
  const powerW = (loadKg * 9.81 * speedMs) / efficiency
  return powerW / 746
}

function calcFLC(hp) {
  const kw = hp * ENGINEERING_CONSTANTS.HP_TO_KW
  return (kw * 1000) / (Math.sqrt(3) * ENGINEERING_CONSTANTS.VOLTAGE_3PHASE * ENGINEERING_CONSTANTS.POWER_FACTOR * ENGINEERING_CONSTANTS.EFFICIENCY_FACTOR)
}

function selectContactor(flc) {
  const required = flc * ENGINEERING_CONSTANTS.CONTACTOR_RATING_MULTIPLIER
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

export default function LoadCalculator() {
  const [inputs, setInputs] = useState({
    load: 5,
    hoistSpeed: 4,
    ltSpeed: 20,
    ctSpeed: 10,
    hoistHP: '',
    ltHP: '',
    ctHP: '',
    useCustomHP: false
  })
  const [results, setResults] = useState(null)

  const update = (key, val) => setInputs(p => ({ ...p, [key]: val }))

  const calculate = () => {
    const hoistHP = inputs.useCustomHP ? parseFloat(inputs.hoistHP) : calcMotorHP(inputs.load, inputs.hoistSpeed)
    const ltHP = inputs.useCustomHP ? parseFloat(inputs.ltHP) : calcMotorHP(inputs.load * 0.1, inputs.ltSpeed)
    const ctHP = inputs.useCustomHP ? parseFloat(inputs.ctHP) : calcMotorHP(inputs.load * 0.05, inputs.ctSpeed)

    const motors = { hoist: hoistHP, lt: ltHP, ct: ctHP }
    const res = {}

    for (const [name, hp] of Object.entries(motors)) {
      const flc = calcFLC(hp)
      res[name] = {
        hp: hp.toFixed(2),
        kw: (hp * ENGINEERING_CONSTANTS.HP_TO_KW).toFixed(2),
        flc: flc.toFixed(2),
        contactor: selectContactor(flc),
        mpcb: selectMPCB(flc),
        cable: selectCable(flc),
        starDelta: hp > ENGINEERING_CONSTANTS.STAR_DELTA_THRESHOLD_HP
      }
    }

    setResults(res)
  }

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>⚡ Load Calculator</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Enter crane load and speeds to calculate motor HP, contactor ratings, MPCB sizing, and cable size.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Inputs */}
        <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #2d3f50' }}>
          <h2 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '1.5rem' }}>Input Parameters</h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="checkbox" checked={inputs.useCustomHP} onChange={e => update('useCustomHP', e.target.checked)} />
              Use custom motor HP (override calculation)
            </label>
          </div>

          {!inputs.useCustomHP ? (
            <>
              <InputField label="Rated Load (Tons)" value={inputs.load} onChange={v => update('load', v)} unit="T" min={0.5} max={500} step={0.5} />
              <InputField label="Hoist Speed" value={inputs.hoistSpeed} onChange={v => update('hoistSpeed', v)} unit="m/min" min={1} max={30} />
              <InputField label="Long Travel Speed" value={inputs.ltSpeed} onChange={v => update('ltSpeed', v)} unit="m/min" min={5} max={80} />
              <InputField label="Cross Travel Speed" value={inputs.ctSpeed} onChange={v => update('ctSpeed', v)} unit="m/min" min={5} max={40} />
            </>
          ) : (
            <>
              <InputField label="Hoist Motor HP" value={inputs.hoistHP} onChange={v => update('hoistHP', v)} unit="HP" />
              <InputField label="LT Motor HP" value={inputs.ltHP} onChange={v => update('ltHP', v)} unit="HP" />
              <InputField label="CT Motor HP" value={inputs.ctHP} onChange={v => update('ctHP', v)} unit="HP" />
            </>
          )}

          <button
            onClick={calculate}
            style={{ width: '100%', backgroundColor: '#f59e0b', color: 'black', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '1rem' }}
          >
            Calculate Ratings
          </button>

          <div style={{ marginTop: '1.5rem', backgroundColor: '#0f1923', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ color: '#f59e0b', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem' }}>📐 Formulas Used</div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', lineHeight: '1.8' }}>
              <div>Power (W) = (Load × g × Speed) ÷ η</div>
              <div>HP = Power ÷ 746</div>
              <div>FLC = (kW × 1000) ÷ (√3 × V × PF × η)</div>
              <div>Contactor = 3 × FLC (IS standard)</div>
              <div>Star-Delta if HP &gt; 5 HP</div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {results ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(results).map(([motor, data]) => (
                <MotorResultCard key={motor} motor={motor} data={data} />
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '3rem', border: '1px solid #2d3f50', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
              <p style={{ color: '#64748b' }}>Enter parameters and click Calculate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, unit, min, max, step = 1 }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'block', marginBottom: '0.4rem' }}>{label}</label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ flex: 1, backgroundColor: '#0f1923', border: '1px solid #2d3f50', borderRadius: '0.375rem', padding: '0.5rem', color: 'white', fontSize: '0.875rem' }}
        />
        <span style={{ color: '#f59e0b', fontSize: '0.875rem', minWidth: '3rem' }}>{unit}</span>
      </div>
    </div>
  )
}

function MotorResultCard({ motor, data }) {
  const labels = { hoist: '🔼 Hoist Motor', lt: '↔️ Long Travel Motor', ct: '↕️ Cross Travel Motor' }
  return (
    <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #2d3f50' }}>
      <h3 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '1rem' }}>{labels[motor]}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Stat label="Motor HP" value={`${data.hp} HP`} />
        <Stat label="Motor kW" value={`${data.kw} kW`} />
        <Stat label="Full Load Current" value={`${data.flc} A`} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        <Stat label="Contactor" value={`${data.contactor} A`} highlight />
        <Stat label="MPCB" value={`${data.mpcb} A`} highlight />
        <Stat label="Cable Size" value={`${data.cable} mm²`} highlight />
      </div>
      {data.starDelta && (
        <div style={{ marginTop: '0.75rem', backgroundColor: '#0f1923', borderRadius: '0.375rem', padding: '0.5rem', border: '1px solid #f59e0b' }}>
          <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: '600' }}>⚠ Star-Delta Starting Required (HP &gt; 5)</span>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, highlight }) {
  return (
    <div style={{ backgroundColor: '#0f1923', padding: '0.6rem', borderRadius: '0.375rem', textAlign: 'center' }}>
      <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ color: highlight ? '#22c55e' : '#e2e8f0', fontWeight: '600', fontSize: '0.85rem' }}>{value}</div>
    </div>
  )
}