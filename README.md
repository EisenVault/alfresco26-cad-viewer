# Alfresco 26.1 CAD Viewer

Share preview and DXF editing for DWG/DXF on **Alfresco Content Services 26.1**. Replaces pdf.js in the document-details pane for CAD MIME types. DWG is read-only. DXF can be locked, edited in the browser, and checked in as a new version.

This repository is an Alfresco SDK 4.14 All-in-One project. It produces:

- `alfresco26-cad-viewer-platform` — Repository AMP
- `alfresco26-cad-viewer-share` — Share AMP
- Docker modules for local ACS/Share (optional)

The CAD engine is not written here. The browser viewer will be [cad-viewer](https://github.com/mlightcad/cad-viewer). DWG parse uses LibreDWG via `@mlightcad/libredwg-converter`. Share/repo wiring follows the OnlyOffice Alfresco Share AMP pattern (preview plugin + DocLib action + repo webscripts), without Document Server.

## Status

Scaffold only. SDK sample modules are still in place. Viewer host, WebPreviewer plugin, and lock/save webscripts are not implemented yet.

## Requirements

- JDK 21 (`jenv local` is set to `21.0.12.1`)
- Maven 3.3+
- Docker (only if you use `./run.sh`)

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
| cad-viewer (`@mlightcad/cad-simple-viewer` and related packages) | Browser DWG/DXF view and DXF edit | MIT | https://github.com/mlightcad/cad-viewer |
| LibreDWG / `@mlightcad/libredwg-converter` | In-browser DWG parse (WASM worker) | GPL-3.0 | https://github.com/LibreDWG/libredwg · https://www.npmjs.com/package/@mlightcad/libredwg-converter |
| ONLYOFFICE Alfresco Share + repo AMPs | Integration pattern only (WebPreviewer plugin, DocLib action, prepare/lock/version webscripts). No OnlyOffice source is copied. Not Document Server. | GPL-3.0 | https://github.com/ONLYOFFICE/onlyoffice-alfresco |

Alfresco SDK sample Java/JS still present in the platform and Share modules originates from the archetype (Apache-2.0) and will be removed as CAD-specific code replaces it.

The Angular ACA extension [onlyoffice-alfresco-extension](https://github.com/ONLYOFFICE/onlyoffice-alfresco-extension) was reviewed and is **not** used. This project targets Share only.

## Local SDK environment (optional)

```sh
./run.sh build_start
```

See the [Alfresco SDK AIO docs](https://github.com/Alfresco/alfresco-sdk/blob/master/docs/working-with-generated-projects/working-with-aio.md) for `start`, `stop`, `purge`, `reload_share`, and `reload_acs`.
