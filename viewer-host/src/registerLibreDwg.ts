/**
 * Opt into GPL LibreDWG DWG parsing.
 * @mlightcad/cad-simple-viewer does not register a DWG converter by default.
 */
import {
  AcDbDatabaseConverterManager,
  AcDbFileType
} from '@mlightcad/data-model'
import { AcDbLibreDwgConverter } from '@mlightcad/libredwg-converter'

const PARSER_WORKER_TIMEOUT_MS = 300000

export function registerLibreDwgConverter(parserWorkerUrl: string): void {
  const wasmUrl = new URL(
    'libredwg-web.wasm',
    new URL(parserWorkerUrl, window.location.href)
  )
  void fetch(wasmUrl)

  const converter = new AcDbLibreDwgConverter({
    convertByEntityType: false,
    useWorker: true,
    parserWorkerUrl,
    timeout: PARSER_WORKER_TIMEOUT_MS
  })
  AcDbDatabaseConverterManager.instance.register(AcDbFileType.DWG, converter)
}
