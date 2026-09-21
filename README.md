# Alfresco 26.1 CAD Viewer

Share preview for DWG/DXF on **Alfresco Content Services 26.1**. Replaces pdf.js in the document-details pane for CAD MIME types. Preview is view-only (white canvas, pan and select).

This repository is an Alfresco SDK 4.14 All-in-One project. It produces:

- `viewer-host` — Vite app that Share will iframe (cad-simple-viewer + LibreDWG)
- `alfresco26-cad-viewer-platform` — Repository AMP (DWG/DXF MIME types on upload)
- `alfresco26-cad-viewer-share` — Share AMP (document-details CAD preview)
- Docker modules for local ACS/Share (optional)

The CAD engine is [cad-viewer](https://github.com/mlightcad/cad-viewer). DWG parse uses LibreDWG via `@mlightcad/libredwg-converter`. Share wiring follows the OnlyOffice Alfresco Share AMP preview-plugin pattern, without Document Server and without edit/lock.

## Status

Share document-details preview iframes `viewer-host` for DWG/DXF (`chrome=0`). The canvas is white; pan is the default tool. SDK sample modules are still in the AMPs.

## Requirements

- JDK 21 (`jenv local` is set to `21.0.12.1`)
- Node.js 20+
- Maven 3.3+
- Docker (only if you use `./run.sh`)

## Viewer host

```sh
cd viewer-host
npm install
npm run dev
```

Open the printed URL. Use **Open file**, paste a drawing URL, or **Sample DWG**.

Query parameters (Share iframe uses these):

| Param | Default | Meaning |
|-------|---------|---------|
| `url` | (none) | Fetch and open this DWG/DXF |
| `chrome` | `1` | `0` hides the open-file bar |

Example:

```
http://localhost:5173/?url=https://example.com/plan.dwg&chrome=0
```

Production build: `npm run build` → `viewer-host/dist/`. Share `mvn package` runs this and copies `dist` into the Share JAR at `/share/res/alfresco26-cad-viewer-share/viewer/`.

## Share CAD preview

On document-details, WebPreviewer chooses `CadViewer` for DWG/DXF MIME types (and for `.dwg`/`.dxf` filenames if the MIME was stored as something else). The plugin iframes the packed viewer with the node's Share-proxy content URL.

After you deploy the AMPs, upload a `.dwg` or `.dxf` and open it in document details. pdf.js is unchanged for PDFs.

The platform AMP is optional for preview itself (Share loads content through the existing node content API). Keep it so uploads map `.dwg`/`.dxf` to the MIME types the preview plugin matches.

## Build AMPs

```sh
mvn -DskipTests package
```

Artifacts:

- `alfresco26-cad-viewer-platform/target/alfresco26-cad-viewer-platform-1.0.0-SNAPSHOT.amp`
- `alfresco26-cad-viewer-share/target/alfresco26-cad-viewer-share-1.0.0-SNAPSHOT.amp`

Target platform: ACS Community **26.1.0**, Share **26.1.0.45**.

## License

This project is licensed under the [GNU General Public License v3.0 or later](LICENSE).

Copyright (C) 2026 EisenVault.

GPL-3.0 is the project license because DWG preview ships [LibreDWG](https://github.com/LibreDWG/libredwg) (`@mlightcad/libredwg-converter`), which is GPL-3.0. A combined viewer that includes that parser cannot be MIT-only.

MIT and Apache-2.0 dependencies listed below remain under their own licenses and are compatible with this GPL-3.0 project.

## Attributions

| Source | What we use | License | URL |
|--------|-------------|---------|-----|
| Alfresco SDK 4.14 All-in-One archetype | Project layout, AMP assembly, Docker run scripts, sample module files | Apache License 2.0 | https://github.com/Alfresco/alfresco-sdk |
| Alfresco Content Services / Share 26.1 | Compile-time APIs (`provided` scope); runtime WARs/images | Alfresco Community / product licenses | https://github.com/Alfresco/acs-community-packaging |
| cad-viewer (`@mlightcad/cad-simple-viewer`, `cad-simple-ui-plugin`, `three-renderer`) | Browser DWG/DXF view; `viewer-host` host pattern follows `cad-simple-viewer-example` | MIT | https://github.com/mlightcad/cad-viewer |
| LibreDWG / `@mlightcad/libredwg-converter` | In-browser DWG parse (WASM worker) | GPL-3.0 | https://github.com/LibreDWG/libredwg · https://www.npmjs.com/package/@mlightcad/libredwg-converter |
| ONLYOFFICE Alfresco Share AMP | Integration pattern only (WebPreviewer plugin). No OnlyOffice source is copied. Not Document Server. | GPL-3.0 | https://github.com/ONLYOFFICE/onlyoffice-alfresco |

Alfresco SDK sample Java/JS still present in the platform and Share modules originates from the archetype (Apache-2.0) and will be removed as CAD-specific code replaces it.

The Angular ACA extension [onlyoffice-alfresco-extension](https://github.com/ONLYOFFICE/onlyoffice-alfresco-extension) was reviewed and is **not** used. This project targets Share only.

## Local SDK environment (optional)

```sh
./run.sh build_start
```

See the [Alfresco SDK AIO docs](https://github.com/Alfresco/alfresco-sdk/blob/master/docs/working-with-generated-projects/working-with-aio.md) for `start`, `stop`, `purge`, `reload_share`, and `reload_acs`.
