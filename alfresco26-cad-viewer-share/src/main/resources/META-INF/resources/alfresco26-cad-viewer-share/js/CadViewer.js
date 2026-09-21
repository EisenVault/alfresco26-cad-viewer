/**
 * WebPreviewer plugin that iframes viewer-host for DWG/DXF.
 * Content is loaded through Share's same-origin proxy so the session cookie is sent.
 *
 * @param wp {Alfresco.WebPreview}
 * @param attributes {Object} from the plugin-conditions <plugin> element
 */
Alfresco.WebPreview.prototype.Plugins.CadViewer = function(wp, attributes)
{
   this.wp = wp;
   this.attributes = YAHOO.lang.merge(Alfresco.util.deepCopy(this.attributes), attributes);
   return this;
};

Alfresco.WebPreview.prototype.Plugins.CadViewer.prototype =
{
   attributes:
   {
      /**
       * Base URL of viewer-host (directory containing index.html).
       * Empty means the copy packed into this Share module.
       */
      viewerBase: "",

      /**
       * viewer-host open mode: read, review, or write.
       */
      mode: "read",

      /**
       * Passed as chrome=0|1 to viewer-host. 0 hides the open-file bar.
       */
      chrome: "0",

      /**
       * Iframe height in pixels.
       */
      height: "720"
   },

   report: function CadViewer_report()
   {
      if (typeof document.createElement("iframe").src === "undefined")
      {
         return this.wp.msg("label.browserReport", "&lt;iframe&gt;");
      }
   },

   display: function CadViewer_display()
   {
      var $html = Alfresco.util.encodeHTML;
      var base = this.attributes.viewerBase;
      if (!base)
      {
         base = Alfresco.constants.URL_RESCONTEXT + "alfresco26-cad-viewer-share/viewer/";
      }
      if (base.charAt(base.length - 1) !== "/")
      {
         base += "/";
      }

      var contentUrl = this.wp.getContentUrl(false);
      var src = base + "index.html?url=" + encodeURIComponent(contentUrl)
         + "&mode=" + encodeURIComponent(this.attributes.mode || "read")
         + "&chrome=" + encodeURIComponent(this.attributes.chrome || "0");

      var height = this.attributes.height || "720";
      var title = this.wp.msg("CadViewer.iframeTitle", this.wp.options.name);

      return '<iframe class="preview-cadviewer" src="' + $html(src) + '" title="' + $html(title)
         + '" style="width:100%;height:' + $html(height) + 'px;border:0;" allowfullscreen="true"></iframe>';
   }
};
