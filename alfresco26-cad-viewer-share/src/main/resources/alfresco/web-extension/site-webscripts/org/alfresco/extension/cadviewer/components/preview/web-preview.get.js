(function cadViewerPluginConditions()
{
   if (!model.widgets || !model.widgets.length)
   {
      return;
   }

   var widget = model.widgets[0];
   if (!widget || !widget.options)
   {
      return;
   }

   var mimeTypes = [
      "image/vnd.dwg",
      "image/x-dwg",
      "application/acad",
      "application/x-acad",
      "application/dwg",
      "application/x-dwg",
      "application/autocad_dwg",
      "drawing/x-dwg",
      "image/vnd.dxf",
      "image/x-dxf",
      "application/dxf",
      "application/x-dxf"
   ];

   function cadPlugin()
   {
      return {
         name: "CadViewer",
         attributes: {
            mode: "read",
            chrome: "0"
         }
      };
   }

   var cad = [];
   for (var i = 0; i < mimeTypes.length; i++)
   {
      cad.push({
         attributes: { mimeType: mimeTypes[i] },
         plugins: [cadPlugin()]
      });
   }

   var name = (widget.options.name || "").toLowerCase();
   var cadByName = name.length > 4 && (name.substring(name.length - 4) === ".dwg" || name.substring(name.length - 4) === ".dxf");
   if (cadByName && widget.options.mimeType)
   {
      cad.unshift({
         attributes: { mimeType: widget.options.mimeType },
         plugins: [cadPlugin()]
      });
   }

   var existing = [];
   if (widget.options.pluginConditions)
   {
      existing = JSON.parse(widget.options.pluginConditions) || [];
   }
   widget.options.pluginConditions = jsonUtils.toJSONString(cad.concat(existing));
})();
