import { consentStorage, createProfileSync, createProgressStore, declareStoredKeys, getSession } from '../account'
import { XP_PER_GAME } from './storage-constants'

/**
 * SipZone's account profile: XP, plays and per-game tallies, kept on the device and mirrored to the SpillArena account.
 * Same shape and sync as the other games (see MelodyRush src/lib/storage.ts); only what counts as a finished round differs.
 */
export const STORAGE_KEYS = ['spillarena.progress.sipzone', 'spillarena.progressOwner.sipzone']
declareStoredKeys(STORAGE_KEYS)

export const progress = createProgressStore({ game: 'sipzone', read: consentStorage.get, write: consentStorage.set })

const sync = createProfileSync({
  game: 'sipzone',
  read: () => progress.get(),
  merge: (_local, remote) => progress.adoptRemote(getSession()?.username ?? '', remote),
  write: () => {},
})
export const pullProgress = sync.pull


export { XP_PER_GAME }

const recorded = new Set<string>()
/** True the first time this exact game is seen, so a remount or a re-render cannot count it twice. */
function firstTime(identity: string) {
  const key = `${getSession()?.username ?? 'guest'}:${identity}`
  if (recorded.has(key)) return false
  recorded.add(key)
  if (recorded.size > 100) recorded.delete(recorded.values().next().value!)
  return true
}

interface Finished {
  /** One id per finished game, such as the local session id or the room code with its players. */
  id: string
  /** The catalogue id of the game, such as `bus` or `roulette`. */
  game: string
  mode: 'local' | 'live'
  players: number
}

/** A finished game, local or online, counts once for XP, plays and the per-game tallies. */
export function recordGame({ id, game, mode, players }: Finished) {
  if (!firstTime(`${mode}:${game}:${id}`)) return
  progress.record({
    key: `${mode}:${game}`,
    score: XP_PER_GAME,
    counters: { mode, game, players: String(Math.min(players, 16)) },
    tags: [`game:${game}`, `mode:${mode}`],
  })
  sync.push()
}
