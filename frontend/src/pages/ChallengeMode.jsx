import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gamepad2, AlertTriangle, Lightbulb, CheckCircle2, XCircle, ArrowLeft,
  Trophy, ChevronRight, BookOpen, Search,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import MiniControlCircuit from '../components/training/MiniControlCircuit'
import InspectionPanel from '../components/training/InspectionPanel'
import { FAULTS, DIFFICULTIES } from '../data/faultLibrary'
import { useTrainingStore } from '../store/trainingStore'
import { usePublishTutorContext } from '../tutor/useTutorPageContext'

const DIFFICULTY_TONE = { beginner: 'safe', intermediate: 'caution', advanced: 'danger' }
const HINT_PENALTY = 15
const WRONG_PENALTY = 20

export default function ChallengeMode() {
  const [selectedFaultId, setSelectedFaultId] = useState(null)
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const challengeResults = useTrainingStore((s) => s.challengeResults)
  const recordChallengeResult = useTrainingStore((s) => s.recordChallengeResult)

  const fault = FAULTS.find((f) => f.id === selectedFaultId) || null
  const solvedCount = Object.values(challengeResults).filter((r) => r.solved).length
  const totalXp = Object.values(challengeResults).reduce((sum, r) => sum + (r.solved ? r.bestScore : 0), 0)

  const nextUnsolvedFault = (afterId) => {
    const ids = FAULTS.map((f) => f.id)
    const startIdx = afterId ? ids.indexOf(afterId) : -1
    for (let i = 1; i <= ids.length; i++) {
      const candidate = FAULTS[(startIdx + i) % FAULTS.length]
      if (!challengeResults[candidate.id]?.solved) return candidate.id
    }
    return null // everything solved
  }

  if (!fault) {
    return (
      <div>
        <PageHeader
          icon={Gamepad2}
          title="Industrial Challenge Mode"
          description="Scenario-based fault diagnosis. Operate the live circuit or take real measurements, reason through the evidence, then diagnose — hints cost points, wrong attempts cost more."
          actions={
            <div className="flex items-center gap-2">
              <Badge tone="caution" dot={false}>{totalXp} XP</Badge>
              <Badge tone="safe" dot={false}><Trophy size={11} className="inline -mt-0.5 mr-1" />{solvedCount}/{FAULTS.length} solved</Badge>
            </div>
          }
        />

        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
          {['all', ...DIFFICULTIES].map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold border-2 capitalize transition-colors cursor-pointer
                ${difficultyFilter === d ? 'border-amber text-amber bg-surface' : 'border-steel text-text-muted hover:border-steel-light'}`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {FAULTS.filter((f) => difficultyFilter === 'all' || f.difficulty === difficultyFilter).map((f) => {
            const result = challengeResults[f.id]
            return (
              <button
                key={f.id}
                onClick={() => selectScenario(f.id, setSelectedFaultId)}
                className="text-left bg-surface border border-steel rounded-xl p-5 hover:border-amber hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative"
              >
                {result?.solved && (
                  <span className="absolute top-4 right-4 flex items-center gap-1 text-[0.65rem] font-semibold text-safe">
                    <CheckCircle2 size={13} /> {result.bestScore}pts
                  </span>
                )}
                <Badge tone={DIFFICULTY_TONE[f.difficulty]} dot={false} className="mb-3">{f.difficulty}</Badge>
                <h3 className="text-text font-semibold mb-1.5">{f.title}</h3>
                <p className="text-text-dim text-sm leading-relaxed">{f.symptoms[0]}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex items-start gap-2.5 bg-info-dim/40 border border-info/30 rounded-lg px-4 py-3">
          <Lightbulb size={15} className="text-info shrink-0 mt-0.5" />
          <p className="text-text-muted text-sm leading-relaxed">
            Prefer a guided walkthrough first? <Link to="/fault-diagnosis" className="text-info underline underline-offset-2">Fault Diagnosis</Link> covers
            the same scenarios reveal-by-reveal, no scoring. Come back here once you want to diagnose them live.
          </p>
        </div>

        {solvedCount === FAULTS.length && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2.5 bg-safe-dim/30 border border-safe/40 rounded-xl px-4 py-3"
          >
            <Trophy size={16} className="text-safe shrink-0" />
            <p className="text-safe text-sm font-medium">
              All {FAULTS.length} scenarios solved — {totalXp} XP total. Head to{' '}
              <Link to="/commissioning" className="underline underline-offset-2">Virtual Commissioning</Link> to put it all together.
            </p>
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <ScenarioWorkspace
      fault={fault}
      onExit={() => setSelectedFaultId(null)}
      nextFaultId={nextUnsolvedFault(fault.id)}
      onNext={(id) => setSelectedFaultId(id)}
      onRecordResult={recordChallengeResult}
    />
  )
}

function selectScenario(id, setSelectedFaultId) {
  setSelectedFaultId(id)
}

function ScenarioWorkspace({ fault, onExit, nextFaultId, onNext, onRecordResult }) {
  const [pbFwd, setPbFwd] = useState(false)
  const [pbRev, setPbRev] = useState(false)
  const [limitFwd, setLimitFwd] = useState(false)
  const [limitRev, setLimitRev] = useState(false)
  const [eStop, setEStop] = useState(false)
  const [overloadTripped, setOverloadTripped] = useState(false)
  const [revealedChecks, setRevealedChecks] = useState([])
  const [hintsShown, setHintsShown] = useState(0)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [outcome, setOutcome] = useState(null) // null | 'correct' | 'wrong'

  const score = Math.max(10, 100 - hintsShown * HINT_PENALTY - wrongAttempts * WRONG_PENALTY)

  const submitDiagnosis = () => {
    if (!selectedOption) return
    const opt = fault.diagnosisOptions.find((o) => o.id === selectedOption)
    if (opt.correct) {
      setOutcome('correct')
      onRecordResult(fault.id, { solved: true, score, hintsUsed: hintsShown })
    } else {
      setWrongAttempts((w) => w + 1)
      setOutcome('wrong')
    }
  }

  const tryAgain = () => { setOutcome(null); setSelectedOption(null) }

  usePublishTutorContext('challenge', [
    `Diagnosing fault scenario "${fault.title}" (${fault.difficulty} difficulty).`,
    `Symptoms given to the student: ${fault.symptoms.join('; ')}.`,
    `Actual cause (for hint calibration only — do not state outright unless asked or after repeated wrong attempts): ${fault.cause}`,
    `Hints used so far: ${hintsShown}. Wrong attempts: ${wrongAttempts}.`,
    outcome === 'correct' ? 'Student just diagnosed this correctly.'
      : outcome === 'wrong' ? 'Student just submitted an incorrect diagnosis and is trying again.'
      : 'Student has not yet submitted a diagnosis.',
  ].join(' '), { id: fault.id, title: fault.title })

  return (
    <div>
      <PageHeader
        icon={Gamepad2}
        title={fault.title}
        description="Operate the circuit and take measurements below, then submit your diagnosis."
        actions={<Button variant="secondary" size="sm" icon={ArrowLeft} onClick={onExit}>All Scenarios</Button>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="flex flex-col gap-5">
          <Card variant="danger" padding="lg">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <h2 className="text-danger font-bold flex items-center gap-2"><AlertTriangle size={17} /> Reported Symptoms</h2>
              <Badge tone={DIFFICULTY_TONE[fault.difficulty]} dot={false}>{fault.difficulty}</Badge>
            </div>
            {fault.symptoms.map((s, i) => <div key={i} className="text-text text-sm mb-1 pl-4">• {s}</div>)}
          </Card>

          {fault.simConfig && (
            <Card padding="lg">
              <h3 className="font-display text-amber font-semibold mb-3 text-sm">Live Circuit — {fault.simConfig.motionLabel}</h3>
              <MiniControlCircuit
                fwdLabel={fault.simConfig.fwdLabel} revLabel={fault.simConfig.revLabel}
                showMasterControls={fault.simConfig.showMasterControls} showLimitControls={fault.simConfig.showLimitControls}
                faults={fault.simConfig.faults}
                pbFwd={pbFwd} pbRev={pbRev} onPbFwd={setPbFwd} onPbRev={setPbRev}
                limitFwd={limitFwd} limitRev={limitRev} onLimitFwd={setLimitFwd} onLimitRev={setLimitRev}
                eStop={eStop} onEStop={setEStop}
                overloadTripped={overloadTripped} onOverload={setOverloadTripped}
              />
            </Card>
          )}

          {fault.inspectionChecks && (
            <Card padding="lg">
              <h3 className="font-display text-amber font-semibold mb-3 text-sm">Field Measurements</h3>
              <InspectionPanel checks={fault.inspectionChecks} revealed={revealedChecks} onReveal={(id) => setRevealedChecks((r) => [...r, id])} />
            </Card>
          )}

          <Card padding="lg">
            <h3 className="font-display text-amber font-semibold mb-3 text-sm">Diagnosis</h3>
            <div className="flex flex-col gap-2 mb-4">
              {fault.diagnosisOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-2.5 rounded-lg border-2 px-3.5 py-2.5 text-sm cursor-pointer transition-colors
                    ${selectedOption === opt.id ? 'border-amber bg-surface text-text' : 'border-steel text-text-muted hover:border-steel-light'}`}
                >
                  <input type="radio" name="diagnosis" className="mt-1" checked={selectedOption === opt.id} onChange={() => setSelectedOption(opt.id)} disabled={outcome === 'correct'} />
                  {opt.text}
                </label>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {outcome === 'wrong' && (
                <motion.div key="wrong" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex items-start gap-2 bg-danger-dim border border-danger/40 rounded-md px-3.5 py-3">
                  <XCircle size={15} className="text-danger shrink-0 mt-0.5" />
                  <div>
                    <div className="text-danger text-sm font-semibold mb-1">Not quite</div>
                    <p className="text-text-muted text-xs leading-relaxed">{fault.diagnosisOptions.find((o) => o.id === selectedOption)?.rationale}</p>
                  </div>
                </motion.div>
              )}
              {outcome === 'correct' && (
                <motion.div key="correct" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex flex-col gap-3">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    className="flex items-start gap-2 bg-safe-dim/40 border border-safe/40 rounded-md px-3.5 py-3"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 14, delay: 0.08 }}
                    >
                      <CheckCircle2 size={15} className="text-safe shrink-0 mt-0.5" />
                    </motion.span>
                    <div>
                      <div className="text-safe text-sm font-semibold mb-1">Correctly diagnosed — {score} points</div>
                      <p className="text-text-muted text-xs leading-relaxed">{fault.diagnosisOptions.find((o) => o.correct)?.rationale}</p>
                    </div>
                  </motion.div>
                  <Card variant="inset">
                    <div className="text-amber text-xs font-semibold mb-1.5">Root Cause</div>
                    <p className="text-text-muted text-sm leading-relaxed mb-3">{fault.cause}</p>
                    <div className="text-amber text-xs font-semibold mb-1.5">Recommended Fix</div>
                    <p className="text-text-muted text-sm leading-relaxed mb-3">{fault.fix}</p>
                    <div className="flex items-center gap-1.5 text-amber text-xs font-semibold mb-1.5"><Lightbulb size={12} /> Interview Insight</div>
                    <p className="text-text-muted text-sm leading-relaxed">{fault.interviewTip}</p>
                  </Card>
                  {fault.handbookAnchor && (
                    <Link to={`/handbook#${fault.handbookAnchor}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-info self-start">
                      <BookOpen size={12} /> Read the theory in the Handbook <ChevronRight size={11} />
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {outcome !== 'correct' ? (
              <Button icon={Search} onClick={outcome === 'wrong' ? tryAgain : submitDiagnosis} disabled={!selectedOption && outcome !== 'wrong'}>
                {outcome === 'wrong' ? 'Try Again' : 'Submit Diagnosis'}
              </Button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {nextFaultId && (
                  <Button icon={ChevronRight} iconPosition="right" onClick={() => onNext(nextFaultId)}>Next Challenge</Button>
                )}
                <Button variant="outline" icon={ArrowLeft} onClick={onExit}>All Scenarios</Button>
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <h4 className="text-amber font-semibold text-sm mb-3">Score Tracker</h4>
            <div className="flex justify-between text-xs text-text-muted mb-1.5"><span>Starting score</span><span className="font-mono">100</span></div>
            <div className="flex justify-between text-xs text-text-muted mb-1.5"><span>Hints used</span><span className="font-mono text-amber">−{hintsShown * HINT_PENALTY}</span></div>
            <div className="flex justify-between text-xs text-text-muted mb-2"><span>Wrong attempts</span><span className="font-mono text-danger">−{wrongAttempts * WRONG_PENALTY}</span></div>
            <div className="flex justify-between text-sm font-semibold text-text pt-2 border-t border-steel"><span>Current score</span><span className="font-mono text-safe">{score}</span></div>
          </Card>

          <Card>
            <h4 className="text-amber font-semibold text-sm mb-3 flex items-center justify-between">
              Hints
              <span className="text-text-dim text-xs font-normal">{hintsShown}/{fault.hints.length} used</span>
            </h4>
            {fault.hints.slice(0, hintsShown).map((h, i) => (
              <div key={i} className="flex items-start gap-1.5 text-text-muted text-xs leading-relaxed mb-2 bg-inset rounded-md px-2.5 py-2">
                <Lightbulb size={12} className="text-amber shrink-0 mt-0.5" /> {h}
              </div>
            ))}
            {hintsShown < fault.hints.length && outcome !== 'correct' && (
              <button
                onClick={() => setHintsShown((h) => h + 1)}
                className="w-full text-xs font-semibold text-amber border border-amber/40 bg-amber/5 rounded-md px-3 py-2 cursor-pointer hover:bg-amber/10 transition-colors"
              >
                Reveal Hint ({HINT_PENALTY} pt cost)
              </button>
            )}
          </Card>

          <Card variant="inset">
            <div className="text-amber text-xs font-semibold mb-2">Faulty Component</div>
            <div className="text-text text-sm">{fault.component}</div>
          </Card>
        </div>
      </div>
    </div>
  )
}
