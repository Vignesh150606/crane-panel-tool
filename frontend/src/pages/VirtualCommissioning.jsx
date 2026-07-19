import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardCheck, CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy,
  AlertTriangle, ThumbsUp, ThumbsDown, History,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import MiniControlCircuit from '../components/training/MiniControlCircuit'
import InspectionPanel from '../components/training/InspectionPanel'
import { COMMISSIONING_ITEMS, COMMISSIONING_MAX_SCORE } from '../data/commissioningChecklist'
import { useTrainingStore } from '../store/trainingStore'
import { usePublishTutorContext } from '../tutor/useTutorPageContext'

export default function VirtualCommissioning() {
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState({}) // { [id]: { assessment, correct } }
  const [finished, setFinished] = useState(false)
  const commissioningRuns = useTrainingStore((s) => s.commissioningRuns)
  const recordCommissioningRun = useTrainingStore((s) => s.recordCommissioningRun)

  const item = COMMISSIONING_ITEMS[currentIndex]
  const score = Object.values(results).filter((r) => r.correct).length * 10
  const lastRun = commissioningRuns[0]

  const handleItemComplete = (result) => {
    const newResults = { ...results, [item.id]: result }
    setResults(newResults)
    if (currentIndex === COMMISSIONING_ITEMS.length - 1) {
      const finalScore = Object.values(newResults).filter((r) => r.correct).length * 10
      recordCommissioningRun({
        score: finalScore, maxScore: COMMISSIONING_MAX_SCORE,
        itemResults: Object.fromEntries(Object.entries(newResults).map(([k, v]) => [k, v.correct ? 'pass' : 'missed'])),
      })
      setFinished(true)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  const restart = () => { setStarted(false); setCurrentIndex(0); setResults({}); setFinished(false) }

  if (!started) {
    return (
      <div>
        <PageHeader
          icon={ClipboardCheck}
          title="Virtual Commissioning"
          description="Commission a new crane panel end to end — 13 checks, in the order a real commissioning walk-through follows. Some checks include a deliberately wrong reading you have to catch, not rubber-stamp."
        />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <Card padding="lg">
            <h2 className="font-display text-amber font-semibold mb-3">Checklist Preview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMISSIONING_ITEMS.map((i) => (
                <div key={i.id} className="flex items-center gap-2 text-sm text-text-muted bg-inset rounded-md px-3 py-2">
                  <span className="w-5 h-5 rounded-full border border-steel-light text-[0.65rem] flex items-center justify-center font-mono shrink-0">{i.order}</span>
                  {i.label}
                </div>
              ))}
            </div>
            <Button className="mt-5" icon={ArrowRight} iconPosition="right" onClick={() => setStarted(true)}>Begin Commissioning</Button>
          </Card>
          <div className="flex flex-col gap-4">
            {lastRun && (
              <Card>
                <div className="flex items-center gap-1.5 text-amber font-semibold text-sm mb-2"><History size={14} /> Last Run</div>
                <div className="text-2xl font-display font-bold text-text mb-1">{lastRun.score}<span className="text-text-dim text-base font-normal">/{lastRun.maxScore}</span></div>
                <div className="text-text-dim text-xs">{new Date(lastRun.completedAt).toLocaleString()}</div>
              </Card>
            )}
            <Card variant="inset">
              <div className="text-amber text-xs font-semibold mb-2">How scoring works</div>
              <p className="text-text-dim text-xs leading-relaxed">
                10 points per correctly assessed item — whether that means confirming a PASS or correctly catching a FAIL.
                Rubber-stamping every item as "pass" will cost you on the items that aren't.
              </p>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (finished) {
    const missedTraps = COMMISSIONING_ITEMS.filter((i) => i.trap && !results[i.id]?.correct)
    return (
      <div>
        <PageHeader icon={Trophy} title="Commissioning Complete" description="Here's how the run went, item by item." />
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <Card padding="lg" className="text-center">
            <div className="text-4xl font-display font-bold text-safe mb-1">{score}</div>
            <div className="text-text-dim text-sm mb-4">out of {COMMISSIONING_MAX_SCORE}</div>
            <Button variant="outline" icon={RotateCcw} className="w-full" onClick={restart}>Run Again</Button>
          </Card>
          <div className="flex flex-col gap-2.5">
            {missedTraps.length > 0 && (
              <div className="flex items-start gap-2 bg-danger-dim border border-danger/40 rounded-lg px-4 py-3 mb-1">
                <AlertTriangle size={15} className="text-danger shrink-0 mt-0.5" />
                <p className="text-text-muted text-sm leading-relaxed">
                  {missedTraps.length} item{missedTraps.length > 1 ? 's' : ''} rubber-stamped as PASS when they should have been failed:{' '}
                  {missedTraps.map((t) => t.label).join(', ')}. In a real commissioning, these would have shipped as defects.
                </p>
              </div>
            )}
            {COMMISSIONING_ITEMS.map((i) => {
              const r = results[i.id]
              return (
                <div key={i.id} className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 ${r?.correct ? 'border-steel bg-surface' : 'border-danger/40 bg-danger-dim/20'}`}>
                  {r?.correct ? <CheckCircle2 size={15} className="text-safe shrink-0" /> : <XCircle size={15} className="text-danger shrink-0" />}
                  <span className="text-text text-sm flex-1">{i.label}</span>
                  {i.trap && <Badge tone="caution" dot={false}>trap</Badge>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        icon={ClipboardCheck}
        title={`${item.order}. ${item.label}`}
        description={item.instructions}
        actions={<Badge tone="info" dot={false}>{currentIndex + 1} / {COMMISSIONING_ITEMS.length}</Badge>}
      />
      <div className="h-1.5 bg-inset rounded-full overflow-hidden mb-6 border border-steel">
        <motion.div className="h-full bg-amber" initial={{ width: 0 }} animate={{ width: `${(currentIndex / COMMISSIONING_ITEMS.length) * 100}%` }} />
      </div>
      <CommissioningItemCard key={item.id} item={item} isLast={currentIndex === COMMISSIONING_ITEMS.length - 1} onComplete={handleItemComplete} />
    </div>
  )
}

function CommissioningItemCard({ item, isLast, onComplete }) {
  const [pbFwd, setPbFwd] = useState(false)
  const [pbRev, setPbRev] = useState(false)
  const [limitFwd, setLimitFwd] = useState(false)
  const [limitRev, setLimitRev] = useState(false)
  const [eStop, setEStop] = useState(false)
  const [overloadTripped, setOverloadTripped] = useState(false)
  const [revealedChecks, setRevealedChecks] = useState([])
  const [assessment, setAssessment] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const submit = (choice) => {
    setAssessment(choice)
    setSubmitted(true)
  }
  const correct = assessment === item.correctAssessment

  usePublishTutorContext('commissioning', [
    `Commissioning step: "${item.label}" (${item.category}).`,
    `Instructions given: ${item.instructions}`,
    `Expected assessment (for hint calibration only — don't state outright unless asked or after a wrong attempt): ${item.correctAssessment}.`,
    submitted ? `Student assessed this as "${assessment}", which was ${correct ? 'correct' : 'incorrect'}.` : 'Student has not yet submitted an assessment for this step.',
  ].join(' '), { id: item.id, title: item.label })

  return (
    <Card padding="lg">
      {item.simConfig && (
        <div className="mb-5">
          <MiniControlCircuit
            fwdLabel={item.simConfig.fwdLabel} revLabel={item.simConfig.revLabel}
            showMasterControls={item.simConfig.showMasterControls} showLimitControls={item.simConfig.showLimitControls}
            faults={item.simConfig.faults}
            pbFwd={pbFwd} pbRev={pbRev} onPbFwd={setPbFwd} onPbRev={setPbRev}
            limitFwd={limitFwd} limitRev={limitRev} onLimitFwd={setLimitFwd} onLimitRev={setLimitRev}
            eStop={eStop} onEStop={setEStop}
            overloadTripped={overloadTripped} onOverload={setOverloadTripped}
          />
        </div>
      )}

      {item.inspectionChecks && (
        <div className="mb-5">
          <InspectionPanel checks={item.inspectionChecks} revealed={revealedChecks} onReveal={(id) => setRevealedChecks((r) => [...r, id])} />
        </div>
      )}

      {item.confirmOnly && !submitted && (
        <div className="mb-5 border border-dashed border-steel rounded-lg px-4 py-6 text-center text-text-dim text-sm">
          Physical / mechanical check — no live circuit or measurement to pull up here. Confirm below once you've walked through it.
        </div>
      )}

      {!submitted ? (
        item.confirmOnly ? (
          <Button icon={CheckCircle2} onClick={() => submit('pass')}>Confirm Completed</Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" icon={ThumbsUp} onClick={() => submit('pass')}>Assess: PASS</Button>
            <Button variant="outline" icon={ThumbsDown} onClick={() => submit('fail')}>Assess: FAIL</Button>
          </div>
        )
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`flex items-start gap-2.5 rounded-lg border px-4 py-3.5 mb-4 ${correct ? 'bg-safe-dim/30 border-safe/40' : 'bg-danger-dim border-danger/40'}`}>
              {correct ? <CheckCircle2 size={17} className="text-safe shrink-0 mt-0.5" /> : <XCircle size={17} className="text-danger shrink-0 mt-0.5" />}
              <div>
                <div className={`text-sm font-semibold mb-1 ${correct ? 'text-safe' : 'text-danger'}`}>
                  {correct ? 'Correctly assessed' : `Should have been assessed ${item.correctAssessment.toUpperCase()}`}
                </div>
                <p className="text-text-muted text-sm leading-relaxed">{item.explanation}</p>
              </div>
            </div>
            <Card variant="inset" className="mb-4">
              <div className="text-amber text-xs font-semibold mb-1.5">Best Practice</div>
              <p className="text-text-muted text-sm leading-relaxed">{item.bestPractice}</p>
            </Card>
            <Button icon={ArrowRight} iconPosition="right" onClick={() => onComplete({ assessment, correct })}>
              {isLast ? 'See Results' : 'Next Item'}
            </Button>
          </motion.div>
        </AnimatePresence>
      )}
    </Card>
  )
}
