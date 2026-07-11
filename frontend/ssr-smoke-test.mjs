import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

const PAGES = [
  ['Home', '/src/pages/Home.jsx'],
  ['CraneSelector', '/src/pages/CraneSelector.jsx'],
  ['LoadCalculator', '/src/pages/LoadCalculator.jsx'],
  ['CableBusbar', '/src/pages/CableBusbar.jsx'],
  ['StarDelta', '/src/pages/StarDelta.jsx'],
  ['ControlCircuit', '/src/pages/ControlCircuit.jsx'],
  ['PowerCircuit', '/src/pages/PowerCircuit.jsx'],
  ['PanelLayout', '/src/pages/PanelLayout.jsx'],
  ['PanelSimulator', '/src/pages/PanelSimulator.jsx'],
  ['BOMGenerator', '/src/pages/BOMGenerator.jsx'],
  ['NameplateCalculator', '/src/pages/NameplateCalculator.jsx'],
  ['FaultDiagnosis', '/src/pages/FaultDiagnosis.jsx'],
  ['ProjectReport', '/src/pages/ProjectReport.jsx'],
]

async function main() {
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true },
    appType: 'custom',
  })

  const { ToastProvider } = await server.ssrLoadModule('/src/components/ui/Toast.jsx')

  let failures = 0
  for (const [name, path] of PAGES) {
    try {
      const mod = await server.ssrLoadModule(path)
      const Component = mod.default
      const el = React.createElement(
        MemoryRouter, { initialEntries: ['/'] },
        React.createElement(ToastProvider, null, React.createElement(Component))
      )
      const html = renderToString(el)
      console.log(`PASS  ${name}  (${html.length} chars)`)
    } catch (err) {
      failures++
      console.log(`FAIL  ${name}`)
      console.log('  ' + (err.stack || err.message).split('\n').slice(0, 6).join('\n  '))
    }
  }

  await server.close()
  console.log(`\n${PAGES.length - failures}/${PAGES.length} passed`)
  process.exit(failures > 0 ? 1 : 0)
}

main()
