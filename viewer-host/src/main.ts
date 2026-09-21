import { acuiRegisterSimpleUiPlugin } from '@mlightcad/cad-simple-ui-plugin/register'
import {
  AcApDocManager,
  acapFormatOpenFileErrorMessage,
  type AcApOpenFileErrorParams,
  AcApOpenDatabaseOptions,
  acedApplyUiTheme,
  AcEdOpenMode,
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

    if (!this.query.chrome) {
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
      await acuiRegisterSimpleUiPlugin(AcApDocManager.instance.pluginManager, {
        host: this.viewerPane,
        layout: 'desktop',
        toolbar: {
          placement: 'right',
          items: 'default',
          collapsible: false
        },
        layouts: {
          pad: {
            toolbar: {
              excludeItems: []
            }
          }
        },
        dockPanel: {
          defaultOpen: false
        }
      })
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
    try {
      const success = await AcApDocManager.instance.openUrl(
        url,
        this.openOptions()
      )
      if (success) {
        this.setStatus(fileNameFromUrl(url))
        await this.afterOpen()
      }
    } catch (error) {
      this.setStatus(`Failed to open URL: ${error}`, 'error')
    }
  }

  private async afterOpen(): Promise<void> {
    this.applyWhiteCanvas()
    await AcApDocManager.instance.executeCommandString('pan')
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
