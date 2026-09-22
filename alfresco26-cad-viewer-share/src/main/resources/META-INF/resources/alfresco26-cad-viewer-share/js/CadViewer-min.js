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
         base = Alfresco.constants.URL_CONTEXT + "alfresco26-cad-viewer-share/viewer/";
      }
      if (base.charAt(base.length - 1) !== "/")
      {
         base += "/";
      }

      var contentUrl = this.wp.getContentUrl(false);
      var allowDownload = this._hasDownloadAccess(this._getUserPermissions());
      var src = base + "index.html?url=" + encodeURIComponent(contentUrl)
         + "&mode=" + encodeURIComponent(this.attributes.mode || "read")
         + "&chrome=" + encodeURIComponent(this.attributes.chrome || "0")
         + "&download=" + (allowDownload ? "1" : "0");

      var height = this.attributes.height || "720";
      var title = this.wp.msg("CadViewer.iframeTitle", this.wp.options.name);

      return '<iframe class="preview-cadviewer" src="' + $html(src) + '" title="' + $html(title)
         + '" style="width:100%;height:' + $html(height) + 'px;border:0;" allowfullscreen="true"></iframe>';
   },

   _getUserPermissions: function CadViewer_getUserPermissions()
   {
      var perms = this.wp.options.userPermissions;
      if (perms)
      {
         return perms;
      }
      return this._findUserPermissionsFromPage();
   },

   _findUserPermissionsFromPage: function CadViewer_findUserPermissionsFromPage()
   {
      var names = ["Alfresco.DocumentActions", "Alfresco.FolderActions", "Alfresco.DocumentList"];
      var i, j, found, options, item, node, nodeRef;
      if (!Alfresco.util.ComponentManager || !Alfresco.util.ComponentManager.find)
      {
         return null;
      }
      for (i = 0; i < names.length; i++)
      {
         found = Alfresco.util.ComponentManager.find(names[i]) || [];
         for (j = 0; j < found.length; j++)
         {
            options = found[j].options || {};
            item = options.documentDetails && options.documentDetails.item ? options.documentDetails.item : null;
            node = item && item.node ? item.node : null;
            if (node && node.permissions && node.permissions.user)
            {
               nodeRef = node.nodeRef || item.nodeRef;
               if (this._sameNodeRef(nodeRef, this.wp.options.nodeRef))
               {
                  return node.permissions.user;
               }
            }
         }
      }
      return null;
   },

   _sameNodeRef: function CadViewer_sameNodeRef(left, right)
   {
      if (!left || !right)
      {
         return false;
      }
      return String(left).replace("://", "/") === String(right).replace("://", "/");
   },

   _permTrue: function CadViewer_permTrue(perms, name)
   {
      if (!perms)
      {
         return false;
      }
      var value = perms[name];
      return value === true || String(value).toLowerCase() === "true";
   },

   _hasDownloadAccess: function CadViewer_hasDownloadAccess(perms)
   {
      if (!perms)
      {
         return false;
      }
      if (typeof perms.Download !== "undefined")
      {
         return this._permTrue(perms, "Download");
      }
      if (typeof perms.DownloadContent !== "undefined")
      {
         return this._permTrue(perms, "DownloadContent");
      }
      return this._permTrue(perms, "Write") ||
         this._permTrue(perms, "CreateChildren") ||
         this._permTrue(perms, "Delete") ||
         this._permTrue(perms, "ChangePermissions");
   }
};
