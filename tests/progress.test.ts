import assert from 'node:assert/strict'
import test from 'node:test'
import { createProgressStore } from '../src/account/progress.ts'
import { XP_PER_GAME } from '../src/lib/storage-constants.ts'

const memory = () => { const data = new Map<string, string>(); return { read: (key: string) => data.get(key) ?? null, write: (key: string, value: string) => { data.set(key, value) } } }

test('a finished game gives XP, a play and per-game tallies on the sipzone profile', () => {
  const progress = createProgressStore({ game: 'sipzone', ...memory() })
  progress.record({ key: 'local:roulette', score: XP_PER_GAME, counters: { mode: 'local', game: 'roulette', players: '4' }, tags: ['game:roulette'] })
  progress.record({ key: 'live:bus', score: XP_PER_GAME, counters: { mode: 'live', game: 'bus', players: '3' }, tags: ['game:bus'] })
  const saved = progress.get()
  assert.equal(saved.plays, 2)
  assert.equal(saved.xp, XP_PER_GAME * 2)
  assert.equal(saved.best['local:roulette'], XP_PER_GAME)
  assert.equal(saved.stats.counters['game:bus'], 1)
  assert.deepEqual(saved.stats.tags.sort(), ['game:bus', 'game:roulette'])
})
