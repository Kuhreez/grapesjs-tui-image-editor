export default (editor, options = {}) => {
  const remoteIcons = 'https://raw.githubusercontent.com/nhnent/tui.image-editor/production/dist/svg/';
  const opts = { ...{
    // TOAST UI's configurations
    // http://nhnent.github.io/tui.image-editor/latest/ImageEditor.html
    config: {},

    // Pass the editor constructor. By default, the `tui.ImageEditor` will be called
    constructor: '',

    // Label for the image editor (used in the modal)
    labelImageEditor: 'Image Editor',

    // Default editor height
    height: '650px',

    // Default editor width
    width: '100%',

    // Hide the default editor header
    hideHeader: true,

    // The TOAST UI editor isn't compiled with icons, so generally, you should download them and indicate
    // the local path in the `includeUI.theme` configurations.
    // Use this option to change them or set it to `false` to keep what is come in `includeUI.theme`
    // By default, the plugin will try to use the editor's remote icons (which involves a cross-origin async
    // request, indicated as unsafe by most of the browsers)
    icons: {
      'menu.normalIcon.path': `${remoteIcons}icon-d.svg`,
      'menu.activeIcon.path': `${remoteIcons}icon-b.svg`,
      'menu.disabledIcon.path': `${remoteIcons}icon-a.svg`,
      'menu.hoverIcon.path': `${remoteIcons}icon-c.svg`,
      'submenu.normalIcon.path': `${remoteIcons}icon-d.svg`,
      'submenu.activeIcon.path': `${remoteIcons}icon-c.svg`,
    },

    // Script to load dynamically in case no TOAST UI editor instance was found
    script: [
        'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/1.6.7/fabric.js',
        'https://uicdn.toast.com/tui.code-snippet/v1.5.0/tui-code-snippet.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js',
        'https://uicdn.toast.com/tui-color-picker/v2.2.0/tui-color-picker.js',
        'https://uicdn.toast.com/tui-image-editor/latest/tui-image-editor.js'
      ],

    // In case the script is loaded this style will be loaded too
    style: [
      'https://uicdn.toast.com/tui-color-picker/v2.2.0/tui-color-picker.css',
      'https://uicdn.toast.com/tui-image-editor/latest/tui-image-editor.css'
    ],
  },  ...options };

  const { script, style, height, width, hideHeader, icons } = opts;
  const getConstructor = () => opts.constructor || (window.tui && window.tui.ImageEditor);
  let constr = getConstructor();

  // Dynamic loading of the image editor scripts and styles
  if (!constr && script) {
    const { head } = document;
    const scripts = Array.isArray(script) ? [...script] : [script];
    const styles = Array.isArray(style) ? [...style] : [style];
    const appendStyle = styles => {
      if (styles.length) {
        const link = document.createElement('link');
        link.href = styles.shift();
        link.rel = 'stylesheet';
        head.appendChild(link);
        appendStyle(styles);
      }
    }
    const appendScript = scripts => {
      if (scripts.length) {
        const scr = document.createElement('script');
        scr.src = scripts.shift();
        scr.onerror = scr.onload = appendScript.bind(null, scripts);
        head.appendChild(scr);
      } else {
        constr = getConstructor();
      }
    }
    appendStyle(styles);
    appendScript(scripts);
  }


  editor.Commands.add('image-editor', {
    run(ed, sen, options = {}) {
      const sel = options.target || ed.getSelected();
      const path = sel.get('src');
      const content = document.createElement('div');
      const title = opts.labelImageEditor;
      const config = { ...opts.config };
      if (!config.includeUI) config.includeUI = {};
      config.includeUI = {
        theme: {},
        ...config.includeUI,
        loadImage: { path, name: 1 },
        uiSize: { height, width, },
      };
      if (hideHeader) config.includeUI.theme['header.display'] = 'none';
      if (icons) config.includeUI.theme = {
        ...config.includeUI.theme,
        ...icons,
      }
      this.imageEditor = new constr(content, config);
      ed.Modal.open({ title, content })
        .getModel().once('change:open', () => editor.stopCommand(this.id));
      ed.getModel().setEditing(1);
    },

    stop(ed) {
      const { imageEditor } = this;
      imageEditor && imageEditor.destroy();
      ed.getModel().setEditing(0);
    }
  });
};
