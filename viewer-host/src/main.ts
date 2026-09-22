import { acuiRegisterSimpleUiPlugin } from '@mlightcad/cad-simple-ui-plugin/register'
import {
  AcApDocManager,
  acapFormatOpenFileErrorMessage,
  type AcApOpenFileErrorParams,
  AcApOpenDatabaseOptions,
  acedApplyUiTheme,
  AcEdOpenMode,
  AcEdViewMode,
  eventBus,
  layoutBackgroundColorFromRgb,
  LIBREDWG_PARSER_WORKER_FILE,
  MTEXT_RENDERER_WORKER_FILE
} from '@mlightcad/cad-simple-viewer'
import { AcDbSysVarManager } from '@mlightcad/data-model'

import { parseQuery } from './query'
import { registerLibreDwgConverter } from './registerLibreDwg'

const SAMPLE_DWG =
  'https://cdn.jsdelivr.net/gh/mlightcad/cad-data@main/data/canteen.dwg'

const FONT_BASE_URL = 'https://cdn.jsdelivr.net/gh/mlightcad/cad-data@main/'

/** Export/download commands blocked when Share passes download=0 (SiteViewer). */
const BLOCKED_EXPORT_COMMANDS = new Set([
  'chtml',
  '-chtml',
  'cpdf',
  'csvg',
  'measurementexport',
  'markupexport'
])

class ViewerHost {
  private readonly container: HTMLDivElement
  private readonly viewerPane: HTMLElement
  private readonly chrome: HTMLElement
  private readonly fileInput: HTMLInputElement
  private readonly urlInput: HTMLInputElement
  private readonly status: HTMLElement
  private readonly query = parseQuery()
  private initialized = false

  constructor() {
    this.container = document.getElementById('cad-container') as HTMLDivElement
    this.viewerPane = document.getElementById('viewer-pane') as HTMLElement
    this.chrome = document.getElementById('chrome') as HTMLElement
    this.fileInput = document.getElementById('file-input') as HTMLInputElement
    this.urlInput = document.getElementById('url-input') as HTMLInputElement
    this.status = document.getElementById('status') as HTMLElement

    if (this.query.chrome) {
      this.chrome.hidden = false
      if (!this.query.url) {
        this.setStatus('Open a DWG or DXF')
      }
    } else {
      this.chrome.hidden = true
    }

    document.getElementById('open-file')?.addEventListener('click', () => {
      this.fileInput.click()
    })
    this.fileInput.addEventListener('change', () => {
      const file = this.fileInput.files?.[0]
      this.fileInput.value = ''
      if (file) {
        void this.openLocalFile(file)
      }
    })
    document.getElementById('open-url')?.addEventListener('click', () => {
      void this.openRemote(this.urlInput.value.trim())
    })
    document.getElementById('open-sample')?.addEventListener('click', () => {
      this.urlInput.value = SAMPLE_DWG
      void this.openRemote(SAMPLE_DWG)
    })
    this.urlInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        void this.openRemote(this.urlInput.value.trim())
      }
    })

    if (this.query.url) {
      this.urlInput.value = this.query.url
      void this.openRemote(this.query.url)
    }
  }

  private openOptions(): AcApOpenDatabaseOptions {
    const white = layoutBackgroundColorFromRgb(0xffffff)
    return {
      minimumChunkSize: 1000,
      mode: AcEdOpenMode.Read,
      progressiveRendering: true,
      sysVars: {
        modelbkcolor: white,
        paperbkcolor: white
      }
    }
  }

  private async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true
    }

    try {
      acedApplyUiTheme('light', this.viewerPane)
      const dwgParserUrl = `./workers/${LIBREDWG_PARSER_WORKER_FILE}`
      registerLibreDwgConverter(dwgParserUrl)
      AcApDocManager.createInstance({
        container: this.container,
        busyIndicatorHost: this.viewerPane,
        autoResize: true,
        baseUrl: FONT_BASE_URL,
        useMainThreadDraw: true,
        openDocumentDefaults: () => this.openOptions(),
        webworkerFileUrls: {
          mtextRender: `./workers/${MTEXT_RENDERER_WORKER_FILE}`,
          dwgParser: dwgParserUrl
        }
      })
      eventBus.on('failed-to-open-file', (params: AcApOpenFileErrorParams) => {
        this.setStatus(acapFormatOpenFileErrorMessage(params), 'error')
      })
      const excludeExport = this.query.download ? [] : ['export']
      await acuiRegisterSimpleUiPlugin(AcApDocManager.instance.pluginManager, {
        host: this.viewerPane,
        layout: 'desktop',
        toolbar: {
          placement: 'right',
          items: 'default',
          collapsible: false,
          excludeItems: excludeExport
        },
        layouts: {
          pad: {
            toolbar: {
              excludeItems: excludeExport
            }
          }
        },
        dockPanel: {
          defaultOpen: false
        }
      })
      if (!this.query.download) {
        this.blockExportCommands()
      }
      this.initialized = true
      return true
    } catch (error) {
      this.setStatus(`Failed to initialize viewer: ${error}`, 'error')
      return false
    }
  }

  private async openLocalFile(file: File): Promise<void> {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.dxf') && !name.endsWith('.dwg')) {
      this.setStatus('Choose a .dwg or .dxf file', 'error')
      return
    }
    if (!(await this.initialize())) {
      return
    }
    this.setStatus(`Opening ${file.name}…`)
    try {
      const buffer = await file.arrayBuffer()
      const success = await AcApDocManager.instance.openDocument(
        file.name,
        buffer,
        this.openOptions()
      )
      if (success) {
        this.setStatus(file.name)
        await this.afterOpen()
      }
    } catch (error) {
      this.setStatus(`Failed to open ${file.name}: ${error}`, 'error')
    }
  }

  private async openRemote(url: string): Promise<void> {
    if (!url) {
      this.setStatus('Enter a DWG or DXF URL', 'error')
      return
    }
    if (!(await this.initialize())) {
      return
    }
    this.setStatus(`Opening ${url}…`)
    let success = false
    try {
      success = await AcApDocManager.instance.openUrl(url, this.openOptions())
    } catch (error) {
      success = !!AcApDocManager.instance.curDocument
      if (!success) {
        this.setStatus(`Failed to open URL: ${error}`, 'error')
        return
      }
    }
    if (success) {
      this.setStatus(fileNameFromUrl(url))
      await this.afterOpen()
    }
  }

  private async afterOpen(): Promise<void> {
    this.applyWhiteCanvas()
    const view = AcApDocManager.instance.curView
    if (!view) {
      return
    }
    const applyPan = () => {
      try {
        view.mode = AcEdViewMode.PAN
      } catch {
        // Layout view is created after converted entities land.
      }
    }
    applyPan()
    if (typeof view.waitUntilIdle === 'function') {
      void view.waitUntilIdle(60000).then(applyPan)
    }
  }

  private applyWhiteCanvas(): void {
    const doc = AcApDocManager.instance.curDocument
    const view = AcApDocManager.instance.curView
    if (!doc || !view) {
      return
    }
    const white = layoutBackgroundColorFromRgb(0xffffff)
    const sys = AcDbSysVarManager.instance()
    sys.setVar('modelbkcolor', white, doc.database)
    sys.setVar('paperbkcolor', white, doc.database)
    view.backgroundColor = 0xffffff
  }

  private blockExportCommands(): void {
    const docManager = AcApDocManager.instance
    const original = docManager.executeCommandString.bind(docManager)
    docManager.executeCommandString = async (cmdStr: string) => {
      const name = cmdStr.trim().split(/[\s\n]+/)[0]?.toLowerCase() ?? ''
      if (BLOCKED_EXPORT_COMMANDS.has(name)) {
        this.setStatus(
          'Export is not available for your access level',
          'error'
        )
        return
      }
      return original(cmdStr)
    }
  }

  private setStatus(message: string, kind: 'info' | 'error' = 'info'): void {
    this.status.textContent = message
    this.status.dataset.kind = kind
  }
}

function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url, window.location.href).pathname
    const name = path.split('/').filter(Boolean).pop()
    return name ? decodeURIComponent(name) : url
  } catch {
    return url
  }
}

new ViewerHost()
