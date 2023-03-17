import { event, invoke } from '@tauri-apps/api'

interface ProgressPayload {
  id: number
  role: string
  detail: string
}

type ProgressHandler = (role: string, detail: string) => void
const handlers: Map<number, ProgressHandler> = new Map()
let listening = false

async function listenToEventIfNeeded(event_name: string): Promise<void> {
  if (listening)
    return await Promise.resolve()

  return await event.listen<ProgressPayload>(event_name, ({ payload }) => {
    const handler = handlers.get(payload.id)
    if (handler != null)
      handler(payload.role, payload.detail)
  })
    .then(() => {
      listening = true
    })
}

async function upload(
  url: string,
  filePath: string,
  progressHandler?: ProgressHandler,
  headers?: Map<string, string>,
): Promise<void> {
  const ids = new Uint32Array(1)
  window.crypto.getRandomValues(ids)
  const id = ids[0]

  if (progressHandler != null)
    handlers.set(id, progressHandler)

  await listenToEventIfNeeded('upload://progress')

  await invoke('plugin:upload|upload', {
    id,
    url,
    filePath,
    headers: headers ?? {},
  })
}

async function download(
  url: string,
  filePath: string,
  progressHandler?: ProgressHandler,
  headers?: Map<string, string>,
): Promise<void> {
  const ids = new Uint32Array(1)
  window.crypto.getRandomValues(ids)
  const id = ids[0]

  if (progressHandler != null)
    handlers.set(id, progressHandler)

  await listenToEventIfNeeded('download://progress')

  await invoke('plugin:upload|download', {
    id,
    url,
    filePath,
    headers: headers ?? {},
  })
}

export default upload
export { download, upload }