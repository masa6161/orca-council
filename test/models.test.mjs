import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { WIN, chairSpec, engineModels, memberSpec } from '../runner/engines.mjs'

test('model file supports distinct members and chair, with environment overrides and legacy fallback', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'council-models-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  const env = { HOME: dir, APPDATA: dir, PATH: dir }
  const configDir = path.join(dir, WIN ? 'orca-council' : '.council')
  const config = path.join(configDir, 'models.json')
  fs.mkdirSync(configDir)
  fs.writeFileSync(path.join(dir, WIN ? 'claude.exe' : 'claude'), '')

  assert.equal(engineModels(env).chair, 'opus')
  assert.equal(engineModels({ ...env, COUNCIL_CLAUDE_MODEL: 'legacy' }).chair, 'legacy')
  fs.writeFileSync(config, JSON.stringify({ claude: 'participant', chair: 'judge', codex: 'codex-file' }))
  assert.equal(engineModels(env).codex, 'codex-file')
  const models = engineModels({ ...env, COUNCIL_CODEX_MODEL: 'codex-env' })
  assert.equal(models.codex, 'codex-env')
  assert.equal(engineModels({ ...env, COUNCIL_CHAIR_MODEL: 'override' }).chair, 'override')

  const options = { env, models, logDir: dir, prompt: 'test' }
  const member = memberSpec({ ...options, engine: 'claude' }).args
  const chair = chairSpec(options).args
  assert.equal(member[member.indexOf('--model') + 1], 'participant')
  assert.equal(chair[chair.indexOf('--model') + 1], 'judge')

  fs.writeFileSync(config, '{"chair":false}')
  assert.throws(() => engineModels(env), /Invalid model configuration.*models\.json/)
})
