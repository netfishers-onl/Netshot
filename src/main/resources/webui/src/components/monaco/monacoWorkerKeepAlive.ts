import { Uri, editor } from "monaco-editor"

const KEEP_ALIVE_URI = Uri.parse("inmemory://netshot-monaco/worker-keep-alive")

/**
 * Monaco's shared EditorWorkerService worker (editor.worker.js — diffing,
 * link detection, word-based completion) is torn down the instant the last
 * text model in the whole page is disposed (WorkerManager#_checkStopEmptyWorker
 * in editorWorkerService.js), and a brand new Worker — a real script fetch —
 * is spun up the next time one is needed.
 *
 * Every Netshot editor correctly disposes its own model when it unmounts
 * (see MonacoEditor.tsx / MonacoDiffEditor.tsx), so without something else
 * keeping the count above zero, navigating away from the only open editor
 * on screen tears the shared worker down, and the next screen with an
 * editor pays for a fresh fetch.
 *
 * This permanent, invisible, never-disposed model exists purely to keep
 * that count above zero for the lifetime of the page. Side-effect import
 * this module from anywhere an editor may be the only one mounted.
 */
if (!editor.getModel(KEEP_ALIVE_URI)) {
  editor.createModel("", "plaintext", KEEP_ALIVE_URI)
}
