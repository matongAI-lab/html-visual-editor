;(function () {
  'use strict'

  var PREFIX = '__ve'
  var Z = 999990
  var EASE = 'cubic-bezier(.4,0,.2,1)'
  var EASE_OUT = 'cubic-bezier(0,.7,.3,1)'

  var state = { active: false, selected: null, hovered: null, textEditing: null, textFlow: false, dragMode: false, history: [], future: [], pages: [], pageMode: 'scroll', currentPage: 0, restoring: false, layoutOpen: false, dragging: null, dragCandidate: null, dropTarget: null, dropBefore: false, toolbarPos: null, toolbarDragging: false, panelSide: 'right' }
  var dom = {}

  function each(list, fn) { Array.prototype.forEach.call(list, fn) }
  function removeNode(node) { if (node && node.parentNode) node.parentNode.removeChild(node) }
  function hasPrefix(value, prefix) { return String(value).slice(0, prefix.length) === prefix }
  function hexByte(value) {
    var hex = (+value).toString(16)
    return hex.length < 2 ? '0' + hex : hex
  }

  var ICON_EDIT = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
  var ICON_X = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  // 14px action icons, single-color, fits the dark toolbar.
  var ICON_UNDO = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>'
  var ICON_REDO = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/></svg>'
  var ICON_RELOAD = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>'
  var ICON_GRIP = '<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor"><circle cx="3" cy="3" r="1.3"/><circle cx="7" cy="3" r="1.3"/><circle cx="3" cy="8" r="1.3"/><circle cx="7" cy="8" r="1.3"/><circle cx="3" cy="13" r="1.3"/><circle cx="7" cy="13" r="1.3"/></svg>'

  // ========== i18n ==========
  var LANG = /^zh\b/i.test((typeof navigator !== 'undefined' ? navigator.language : 'en') || 'en') ? 'zh' : 'en'
  var EN = {
    '文字': 'Text', '背景': 'Background', '间距': 'Spacing', '尺寸': 'Size',
    '定位': 'Position', '边框': 'Border', '排版': 'Typography', '布局': 'Layout',
    '阴影': 'Shadow', '效果': 'Effects', '变换': 'Transform',
    '字号': 'Font Size', '行高': 'Line Height', '字间距': 'Letter Spacing',
    '字重': 'Weight', '对齐': 'Align', '文字颜色': 'Color',
    '100 极细': '100 Thin', '300 细体': '300 Light', '400 常规': '400 Regular',
    '500 中等': '500 Medium', '600 半粗': '600 Semi Bold', '700 粗体': '700 Bold',
    '900 极粗': '900 Black',
    '左': 'Left', '中': 'Center', '右': 'Right', '两端': 'Justify',
    '背景颜色': 'Background', '不透明度': 'Opacity',
    '内边距': 'Padding', '外边距': 'Margin',
    '宽度': 'Width', '高度': 'Height', '最大宽度': 'Max Width', '最小高度': 'Min Height',
    '圆角': 'Radius',
    '定位方式': 'Mode', '上偏移': 'Top', '右偏移': 'Right', '下偏移': 'Bottom',
    '左偏移': 'Left', '层级': 'Z-Index',
    'static 默认': 'static', 'relative 相对': 'relative', 'absolute 绝对': 'absolute',
    'fixed 固定': 'fixed', 'sticky 粘性': 'sticky',
    '粗细': 'Width', '样式': 'Style', '颜色': 'Color',
    'none 无': 'none', 'solid 实线': 'solid', 'dashed 虚线': 'dashed',
    'dotted 点线': 'dotted', 'double 双线': 'double',
    '字体': 'Font Family', '斜体': 'Italic', '装饰': 'Decoration',
    '首行缩进': 'Indent', '换行方式': 'Wrapping', '词间距': 'Word Spacing',
    '正常': 'Normal', '无': 'None', '下划线': 'Underline', '删除线': 'Strikethrough',
    'normal 自动': 'normal', 'nowrap 不换': 'nowrap',
    'pre-wrap 保留换行': 'pre-wrap', 'pre-line 合并空白': 'pre-line',
    '显示': 'Display', 'Flex 方向': 'Direction', '主轴对齐': 'Justify',
    '交叉轴对齐': 'Align Items', 'Flex 换行': 'Wrap', '子项间距': 'Gap', '溢出': 'Overflow',
    'none 隐藏': 'none', '横': 'Row', '竖': 'Col', '横反': 'Row ↩', '竖反': 'Col ↩',
    '不换': 'No', '换行': 'Wrap',
    'visible 显示': 'visible', 'hidden 隐藏': 'hidden', 'scroll 滚动': 'scroll', 'auto 自动': 'auto',
    '盒阴影': 'Box Shadow', '文字阴影': 'Text Shadow', '糊': 'Bl', '展': 'Sp',
    '模糊': 'Blur', '亮度': 'Brightness', '对比度': 'Contrast', '饱和度': 'Saturation',
    '灰度': 'Grayscale', '背景模糊': 'Backdrop Blur',
    '旋转': 'Rotate', '缩放': 'Scale', '水平位移': 'Move X', '垂直位移': 'Move Y',
    '链接': 'Link', '跳转地址': 'URL', '打开方式': 'Target',
    '页面结构': 'Structure', '结构位置': 'Position', '区块 / 标题 / 文本 / 链接 / 图片': 'Blocks / Headings / Text / Links / Images',
    '上一项': 'Prev', '当前': 'Current', '下一项': 'Next',
    '点击页面元素后显示结构位置': 'Click an element to show its position',
    '没有上一项': 'No previous item', '没有下一项': 'No next item',
    '当前区块：': 'Block: ', '当前区块：未识别': 'Block: None',
    '选中区块': 'Select', '复制区块': 'Copy', '上移区块': 'Move Up', '下移区块': 'Move Down', '删除区块': 'Delete',
    '内容属性：': 'Content: ', '文字内容': 'Text Content', '直接编辑文字': 'Edit Text Directly', '链接文字': 'Link Text', '按钮文字': 'Button Text', '图片地址 src': 'Image URL', '图片 alt': 'Image Alt',
    '替换图片': 'Replace Image', '图片裁切': 'Image Fit', '图片位置': 'Image Position',
    'cover 填满裁切': 'cover', 'contain 完整显示': 'contain', 'fill 拉伸填充': 'fill', 'none 原始大小': 'none', 'scale-down 自动缩小': 'scale-down',
    '图片已替换': 'Image replaced',
    '元素已移动': 'Element moved', '按住拖动到新位置': 'Hold and drag to reorder',
    '不能放到自己里面': 'Cannot drop into itself',
    '拖拽移动': 'Drag Move', '按住元素拖动可改顺序 (Alt+D)': 'Hold and drag elements to reorder (Alt+D)',
    '拖拽模式已开启': 'Drag mode on', '拖拽模式已关闭': 'Drag mode off',
    '当前窗口打开': 'Same Tab', '新窗口打开': 'New Tab',
    '样式面板': 'Style Panel', '未选择': 'None',
    '进入编辑模式后，点击页面里的标题、段落、卡片或按钮开始调整。': 'Enter edit mode, then click any element to start.',
    '编辑版式': 'Edit Layout', '编辑文字': 'Edit Text', '撤销': 'Undo', '复原': 'Redo',
    '🎨 版式': '🎨 Layout', '✏️ 文字': '✏️ Text', '👆 拖拽': '👆 Drag',
    '上一页': 'Prev', '下一页': 'Next', '重新载入': 'Reload',
    '复制 HTML': 'Copy HTML', '保存 HTML': 'Save HTML',
    '切换编辑模式 (Alt+E)': 'Toggle edit mode (Alt+E)',
    '退出编辑模式 (Alt+E)': 'Exit edit mode (Alt+E)',
    '退出编辑': 'Exit', '打开/关闭版式编辑': 'Toggle layout editor',
    '点击页面文字直接编辑 (Alt+T)': 'Click text to edit (Alt+T)',
    '撤销上一步 (Alt+Z)': 'Undo (Alt+Z)', '复原刚刚撤销的操作 (Alt+Y)': 'Redo (Alt+Y)',
    '切换到上一页 (Alt+←)': 'Previous page (Alt+←)', '切换到下一页 (Alt+→)': 'Next page (Alt+→)',
    '重新载入当前文件/入口页': 'Reload current file',
    '点击选中元素 · 双击文字直接编辑 · Ctrl 点击触发原页面': 'Click to select · double-click text to edit · Ctrl+click for page behavior',
    '没有可撤销的操作': 'Nothing to undo', '没有可复原的操作': 'Nothing to redo',
    '已复制到剪贴板': 'Copied to clipboard',
    '复制失败，请手动选择导出的 HTML': 'Copy failed',
    'HTML 已保存': 'HTML saved',
    '当前浏览器不支持直接保存，请先复制 HTML': 'Download not supported, please copy HTML',
    '这个元素不适合直接编辑文字': 'This element cannot be text-edited',
    '正在编辑文字 · 完成后点页面空白处或按 Esc': 'Editing text · Click outside or press Esc when done',
    '文字已更新': 'Text updated',
    '属性已更新': 'Attribute updated', '打开方式已更新': 'Target updated',
    '已复制区块 HTML': 'Block HTML copied', '已选中整个区块': 'Block selected',
    '区块已上移': 'Block moved up', '区块已下移': 'Block moved down',
    '删除当前区块？可用撤销恢复。': 'Delete this block? Undo can restore it.',
    '区块已删除': 'Block deleted',
    '文字编辑已开启': 'Text edit mode on', '文字编辑已关闭': 'Text edit mode off',
    '重新载入会放弃未复制/保存的修改，确定继续吗？': 'Reload will discard unsaved changes. Continue?',
    '拖动移动工具栏 · 双击复位': 'Drag to move the toolbar · double-click to reset',
    '工具栏位置已复位': 'Toolbar position reset',
    '拖动停靠到左侧或右侧 · 双击复位': 'Drag to dock left or right · double-click to reset',
    '面板已停靠左侧': 'Panel docked left', '面板已停靠右侧': 'Panel docked right',
    '面板位置已复位': 'Panel position reset'
  }
  function t(s) { return LANG === 'zh' ? s : (EN[s] || s) }

  // ========== Compound Property Helpers ==========

  function parseCSSFn(str, fn) {
    if (!str || str === 'none') return null
    var m = str.match(new RegExp(fn + '\\(([^)]+)\\)'))
    return m ? m[1] : null
  }

  function setCSSFn(str, fn, val) {
    if (!str || str === 'none') str = ''
    var re = new RegExp(fn + '\\([^)]*\\)')
    if (re.test(str)) return str.replace(re, fn + '(' + val + ')')
    return (str.trim() + ' ' + fn + '(' + val + ')').trim()
  }

  function parseShadow(val) {
    if (!val || val === 'none') return { x: 0, y: 0, blur: 0, spread: 0, color: '#000000' }
    var cm = val.match(/rgba?\([^)]+\)/)
    var color = cm ? rgbToHex(cm[0]) : '#000000'
    var noColor = val.replace(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/g, '').replace(/inset/g, '').trim()
    var nums = noColor.split(/\s+/).map(parseFloat).filter(function (n) { return !isNaN(n) })
    return { x: nums[0] || 0, y: nums[1] || 0, blur: nums[2] || 0, spread: nums[3] || 0, color: color }
  }

  function composeShadow(s, hasSpread) {
    var p = [s.x + 'px', s.y + 'px', s.blur + 'px']
    if (hasSpread) p.push(s.spread + 'px')
    p.push(s.color)
    return p.join(' ')
  }

  // ========== Plugin Definitions ==========

  var GROUPS = [
    {
      group: t('文字'), collapsed: false,
      controls: [
        { prop: 'fontSize', label: t('字号'), type: 'slider', min: 12, max: 96, step: 1, unit: 'px',
          parse: function (v) { return parseFloat(v) } },
        { prop: 'lineHeight', label: t('行高'), type: 'slider', min: 0.8, max: 3.0, step: 0.05, unit: '',
          parse: function (v, el) { if (v === 'normal') return 1.4; return Math.round(parseFloat(v) / parseFloat(getComputedStyle(el).fontSize) * 100) / 100 },
          format: function (v) { return String(v) } },
        { prop: 'letterSpacing', label: t('字间距'), type: 'slider', min: -2, max: 10, step: 0.5, unit: 'px',
          parse: function (v) { return v === 'normal' ? 0 : parseFloat(v) } },
        { prop: 'fontWeight', label: t('字重'), type: 'select',
          options: [
            { value: '100', label: t('100 极细') }, { value: '300', label: t('300 细体') },
            { value: '400', label: t('400 常规') }, { value: '500', label: t('500 中等') },
            { value: '600', label: t('600 半粗') }, { value: '700', label: t('700 粗体') },
            { value: '900', label: t('900 极粗') }
          ],
          parse: function (v) { return String(Math.round(parseFloat(v))) } },
        { prop: 'textAlign', label: t('对齐'), type: 'buttonGroup',
          options: [{ value: 'left', label: t('左') }, { value: 'center', label: t('中') }, { value: 'right', label: t('右') }, { value: 'justify', label: t('两端') }] },
        { prop: 'color', label: t('文字颜色'), type: 'color' }
      ]
    },
    {
      group: t('背景'), collapsed: false,
      controls: [
        { prop: 'backgroundColor', label: t('背景颜色'), type: 'color' },
        { prop: 'opacity', label: t('不透明度'), type: 'slider', min: 0, max: 1, step: 0.05, unit: '',
          parse: function (v) { return parseFloat(v) },
          format: function (v) { return String(v) } }
      ]
    },
    {
      group: t('间距'), collapsed: false,
      controls: [
        { prop: 'padding', label: t('内边距'), type: 'spacing' },
        { prop: 'margin', label: t('外边距'), type: 'spacing' }
      ]
    },
    {
      group: t('尺寸'), collapsed: false,
      controls: [
        { prop: 'width', label: t('宽度'), type: 'dimension' },
        { prop: 'height', label: t('高度'), type: 'dimension' },
        { prop: 'maxWidth', label: t('最大宽度'), type: 'dimension' },
        { prop: 'minHeight', label: t('最小高度'), type: 'dimension' },
        { prop: 'borderRadius', label: t('圆角'), type: 'slider', min: 0, max: 100, step: 1, unit: 'px',
          parse: function (v) { return parseFloat(v) || 0 } }
      ]
    },
    {
      group: t('定位'), collapsed: true,
      controls: [
        { prop: 'position', label: t('定位方式'), type: 'select',
          options: [
            { value: 'static', label: t('static 默认') }, { value: 'relative', label: t('relative 相对') },
            { value: 'absolute', label: t('absolute 绝对') }, { value: 'fixed', label: t('fixed 固定') },
            { value: 'sticky', label: t('sticky 粘性') }
          ] },
        { prop: 'top', label: t('上偏移'), type: 'dimension' },
        { prop: 'right', label: t('右偏移'), type: 'dimension' },
        { prop: 'bottom', label: t('下偏移'), type: 'dimension' },
        { prop: 'left', label: t('左偏移'), type: 'dimension' },
        { prop: 'zIndex', label: t('层级'), type: 'slider', min: -10, max: 100, step: 1, unit: '',
          parse: function (v) { return v === 'auto' ? 0 : parseInt(v) || 0 },
          format: function (v) { return String(Math.round(v)) } }
      ]
    },
    {
      group: t('边框'), collapsed: true,
      controls: [
        { prop: 'borderWidth', label: t('粗细'), type: 'slider', min: 0, max: 20, step: 1, unit: 'px',
          parse: function (v) { return parseFloat(v) || 0 } },
        { prop: 'borderStyle', label: t('样式'), type: 'select',
          options: [
            { value: 'none', label: t('none 无') }, { value: 'solid', label: t('solid 实线') },
            { value: 'dashed', label: t('dashed 虚线') }, { value: 'dotted', label: t('dotted 点线') },
            { value: 'double', label: t('double 双线') }
          ] },
        { prop: 'borderColor', label: t('颜色'), type: 'color' }
      ]
    },
    {
      group: t('排版'), collapsed: true,
      controls: [
        { prop: 'fontFamily', label: t('字体'), type: 'dimension' },
        { prop: 'fontStyle', label: t('斜体'), type: 'buttonGroup',
          options: [{ value: 'normal', label: t('正常') }, { value: 'italic', label: t('斜体') }] },
        { prop: 'textDecorationLine', label: t('装饰'), type: 'buttonGroup',
          options: [{ value: 'none', label: t('无') }, { value: 'underline', label: t('下划线') }, { value: 'line-through', label: t('删除线') }] },
        { prop: 'textIndent', label: t('首行缩进'), type: 'slider', min: 0, max: 80, step: 1, unit: 'px',
          parse: function (v) { return parseFloat(v) || 0 } },
        { prop: 'whiteSpace', label: t('换行方式'), type: 'select',
          options: [
            { value: 'normal', label: t('normal 自动') }, { value: 'nowrap', label: t('nowrap 不换') },
            { value: 'pre-wrap', label: t('pre-wrap 保留换行') }, { value: 'pre-line', label: t('pre-line 合并空白') }
          ] },
        { prop: 'wordSpacing', label: t('词间距'), type: 'slider', min: -5, max: 20, step: 0.5, unit: 'px',
          parse: function (v) { return v === 'normal' ? 0 : parseFloat(v) } }
      ]
    },
    {
      group: t('布局'), collapsed: true,
      controls: [
        { prop: 'display', label: t('显示'), type: 'select',
          options: [
            { value: 'block', label: t('block') }, { value: 'inline', label: t('inline') },
            { value: 'inline-block', label: t('inline-block') }, { value: 'flex', label: t('flex') },
            { value: 'inline-flex', label: t('inline-flex') }, { value: 'grid', label: t('grid') },
            { value: 'none', label: t('none 隐藏') }
          ] },
        { prop: 'flexDirection', label: t('Flex 方向'), type: 'buttonGroup',
          options: [{ value: 'row', label: t('横') }, { value: 'column', label: t('竖') }, { value: 'row-reverse', label: t('横反') }, { value: 'column-reverse', label: t('竖反') }] },
        { prop: 'justifyContent', label: t('主轴对齐'), type: 'select',
          options: [
            { value: 'flex-start', label: t('start') }, { value: 'center', label: t('center') },
            { value: 'flex-end', label: t('end') }, { value: 'space-between', label: t('between') },
            { value: 'space-around', label: t('around') }, { value: 'space-evenly', label: t('evenly') }
          ] },
        { prop: 'alignItems', label: t('交叉轴对齐'), type: 'select',
          options: [
            { value: 'stretch', label: t('stretch') }, { value: 'flex-start', label: t('start') },
            { value: 'center', label: t('center') }, { value: 'flex-end', label: t('end') },
            { value: 'baseline', label: t('baseline') }
          ] },
        { prop: 'flexWrap', label: t('Flex 换行'), type: 'buttonGroup',
          options: [{ value: 'nowrap', label: t('不换') }, { value: 'wrap', label: t('换行') }] },
        { prop: 'gap', label: t('子项间距'), type: 'slider', min: 0, max: 60, step: 1, unit: 'px',
          parse: function (v) { return parseFloat(v) || 0 } },
        { prop: 'overflow', label: t('溢出'), type: 'select',
          options: [
            { value: 'visible', label: t('visible 显示') }, { value: 'hidden', label: t('hidden 隐藏') },
            { value: 'scroll', label: t('scroll 滚动') }, { value: 'auto', label: t('auto 自动') }
          ] }
      ]
    },
    {
      group: t('阴影'), collapsed: true,
      controls: [
        { prop: 'boxShadow', label: t('盒阴影'), type: 'shadow', hasSpread: true },
        { prop: 'textShadow', label: t('文字阴影'), type: 'shadow', hasSpread: false }
      ]
    },
    {
      group: t('效果'), collapsed: true,
      controls: [
        { prop: 'filter', subFn: 'blur', label: t('模糊'), type: 'compoundSlider', min: 0, max: 20, step: 0.5, unit: 'px', defaultVal: 0 },
        { prop: 'filter', subFn: 'brightness', label: t('亮度'), type: 'compoundSlider', min: 0, max: 3, step: 0.05, unit: '', defaultVal: 1 },
        { prop: 'filter', subFn: 'contrast', label: t('对比度'), type: 'compoundSlider', min: 0, max: 3, step: 0.05, unit: '', defaultVal: 1 },
        { prop: 'filter', subFn: 'saturate', label: t('饱和度'), type: 'compoundSlider', min: 0, max: 3, step: 0.05, unit: '', defaultVal: 1 },
        { prop: 'filter', subFn: 'grayscale', label: t('灰度'), type: 'compoundSlider', min: 0, max: 1, step: 0.05, unit: '', defaultVal: 0 },
        { prop: 'backdropFilter', subFn: 'blur', label: t('背景模糊'), type: 'compoundSlider', min: 0, max: 30, step: 1, unit: 'px', defaultVal: 0 }
      ]
    },
    {
      group: t('变换'), collapsed: true,
      controls: [
        { prop: 'transform', subFn: 'rotate', label: t('旋转'), type: 'compoundSlider', min: -180, max: 180, step: 1, unit: 'deg', defaultVal: 0 },
        { prop: 'transform', subFn: 'scale', label: t('缩放'), type: 'compoundSlider', min: 0.1, max: 3, step: 0.05, unit: '', defaultVal: 1 },
        { prop: 'transform', subFn: 'translateX', label: t('水平位移'), type: 'compoundSlider', min: -200, max: 200, step: 1, unit: 'px', defaultVal: 0 },
        { prop: 'transform', subFn: 'translateY', label: t('垂直位移'), type: 'compoundSlider', min: -200, max: 200, step: 1, unit: 'px', defaultVal: 0 }
      ]
    }
  ]

  // ========== CSS ==========
  var P = '.' + PREFIX + '-'
  var CSS = '\
#' + PREFIX + '-root{all:initial;position:fixed;top:0;left:0;right:0;bottom:0;z-index:' + Z + ';pointer-events:none;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;color:#d8dee9;line-height:1.4}\
#' + PREFIX + '-root *,#' + PREFIX + '-root *::before,#' + PREFIX + '-root *::after{box-sizing:border-box}\
' + P + 'toggle{position:fixed;bottom:24px;right:24px;width:48px;height:48px;border-radius:14px;background:#2563eb;color:#fff;border:1px solid rgba(255,255,255,.16);cursor:pointer;display:flex;align-items:center;justify-content:center;pointer-events:auto;box-shadow:0 12px 30px rgba(15,23,42,.35);transition:transform .25s ' + EASE_OUT + ',background .3s ' + EASE + ',box-shadow .3s ' + EASE + ';z-index:' + (Z + 9) + '}\
' + P + 'toggle:hover{transform:translateY(-2px);background:#1d4ed8;box-shadow:0 16px 36px rgba(37,99,235,.3)}\
' + P + 'toggle:active{transform:scale(0.92);transition-duration:.1s}\
' + P + 'toggle.active{display:none}\
' + P + 'toolbar{position:fixed;top:12px;left:16px;width:max-content;max-width:calc(100vw - 16px);min-height:46px;background:rgba(15,23,42,.94);border:1px solid rgba(148,163,184,.22);border-radius:10px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;padding:7px;gap:8px;pointer-events:auto;visibility:hidden;opacity:0;transform:translateY(-16px);transition:opacity .3s ' + EASE + ',transform .35s ' + EASE_OUT + ';z-index:' + (Z + 5) + ';box-shadow:0 18px 45px rgba(2,6,23,.28);-webkit-backdrop-filter:blur(16px) saturate(1.15);backdrop-filter:blur(16px) saturate(1.15)}\
' + P + 'toolbar.visible{visibility:visible;opacity:1;transform:translateY(0)}\
' + P + 'tb-handle{display:inline-flex;align-items:center;justify-content:center;width:18px;align-self:stretch;min-height:32px;cursor:grab;color:#64748b;border-radius:7px;touch-action:none;user-select:none;-webkit-user-select:none;transition:color .15s ' + EASE + ',background .15s ' + EASE + '}\
' + P + 'tb-handle:hover{color:#e2e8f0;background:rgba(255,255,255,.07)}\
' + P + 'tb-handle:active{cursor:grabbing}\
' + P + 'tb-group{display:flex;align-items:center;gap:6px;min-width:0}\
' + P + 'tb-group.main{flex:1;justify-content:center;flex-wrap:wrap}\
' + P + 'tb-group.export{padding:4px;border-radius:8px;background:rgba(37,99,235,.08);border:1px solid rgba(96,165,250,.14)}\
' + P + 'tb-btn{height:32px;padding:0 12px;border-radius:7px;border:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.045);color:#cbd5e1;cursor:pointer;font-size:12px;white-space:nowrap;font-family:inherit;line-height:30px;transition:background .15s ' + EASE + ',border-color .15s ' + EASE + ',color .15s ' + EASE + ',transform .15s ' + EASE + ',box-shadow .15s ' + EASE + ',opacity .15s ' + EASE + '}\
' + P + 'tb-btn:hover{background:rgba(255,255,255,.09);border-color:rgba(148,163,184,.3);color:#f8fafc}\
' + P + 'tb-btn:active{transform:scale(0.95);transition-duration:.08s}\
' + P + 'tb-btn.primary{background:#2563eb;border-color:#3b82f6;color:#fff}\
' + P + 'tb-btn.primary:hover{background:#1d4ed8;box-shadow:0 8px 18px rgba(37,99,235,.28)}\
' + P + 'tb-btn.primary:active{background:#1e40af}\
' + P + 'tb-btn:disabled{opacity:.32;cursor:default;transform:none!important;box-shadow:none!important}\
' + P + 'tb-btn.icon{width:32px;padding:0;display:inline-flex;align-items:center;justify-content:center}\
' + P + 'tb-btn.icon svg{display:block}\
' + P + 'tb-btn.exit{background:transparent;border:none;color:#94a3b8;padding:0 8px;font-size:16px;transition:color .15s ' + EASE + ',transform .15s ' + EASE + '}\
' + P + 'tb-btn.exit:hover{color:#fff;transform:scale(1.15)}\
' + P + 'tb-btn.exit:active{transform:scale(0.9);transition-duration:.08s}\
' + P + 'pager{display:flex;align-items:center;gap:4px;padding:0 6px;margin:0 2px;border-left:1px solid rgba(148,163,184,.16);border-right:1px solid rgba(148,163,184,.16)}\
' + P + 'pager.hidden{display:none}\
' + P + 'page-label{min-width:44px;text-align:center;color:#93c5fd;font-size:12px;font-family:"SF Mono",Monaco,Consolas,monospace}\
' + P + 'breadcrumb{display:none;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#888;font-size:12px;font-family:"SF Mono",Monaco,Consolas,monospace}\
' + P + 'panel{position:fixed;top:70px;right:16px;width:min(348px,calc(100vw - 32px));bottom:16px;background:rgba(11,18,32,.97);border:1px solid rgba(148,163,184,.2);border-radius:12px;overflow-x:hidden;overflow-y:auto;pointer-events:auto;visibility:hidden;opacity:0;transform:translateX(24px);transition:opacity .3s ' + EASE + ',transform .4s ' + EASE_OUT + ';z-index:' + (Z + 4) + ';box-shadow:0 24px 70px rgba(2,6,23,.36);-webkit-backdrop-filter:blur(18px) saturate(1.1);backdrop-filter:blur(18px) saturate(1.1)}\
' + P + 'panel.visible{visibility:visible;opacity:1;transform:translateX(0)}\
' + P + 'panel-drag-label{display:inline-flex;align-items:center;gap:8px}\
' + P + 'panel-grip{display:none;align-items:center;color:#64748b}\
@media (min-width:721px){\
' + P + 'panel-grip{display:inline-flex}\
' + P + 'panel-title{cursor:grab;touch-action:none}\
' + P + 'panel-title:active{cursor:grabbing}\
' + P + 'panel.dock-left{left:16px;right:auto}\
' + P + 'panel.dock-left:not(.visible){transform:translateX(-24px)}\
}\
' + P + 'tb-btn.active{background:#334155;border-color:#60a5fa;color:#fff}\
' + P + 'panel-title{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 14px;border-bottom:1px solid rgba(148,163,184,.14);background:rgba(11,18,32,.98);color:#f8fafc;font-size:13px;font-weight:700}\
' + P + 'panel-subtitle{font-size:11px;font-weight:500;color:#64748b}\
' + P + 'panel-empty{padding:40px 22px;text-align:center;color:#64748b;font-size:13px;line-height:1.7}\
' + P + 'panel::-webkit-scrollbar{width:6px}\
' + P + 'panel::-webkit-scrollbar-track{background:transparent}\
' + P + 'panel::-webkit-scrollbar-thumb{background:rgba(148,163,184,.3);border-radius:999px}\
' + P + 'panel-inner{transition:opacity .15s ' + EASE + '}\
' + P + 'panel-inner.fade{opacity:0}\
' + P + 'group{border-bottom:1px solid rgba(148,163,184,.09)}\
' + P + 'group-hd{padding:13px 14px 7px;font-size:12px;font-weight:700;color:#e2e8f0;letter-spacing:0;cursor:pointer;user-select:none;display:flex;align-items:center;transition:color .15s,background .15s}\
' + P + 'group-hd:hover{color:#fff;background:rgba(255,255,255,.025)}\
' + P + 'group-hd::before{content:"▾";display:inline-block;margin-right:6px;font-size:9px;transition:transform .25s ' + EASE_OUT + '}\
' + P + 'group.collapsed ' + P + 'group-hd::before{transform:rotate(-90deg)}\
' + P + 'group-bd{overflow:hidden;max-height:800px;opacity:1;padding:4px 14px 14px;transition:max-height .3s ' + EASE + ',opacity .2s ' + EASE + ',padding .25s ' + EASE + '}\
' + P + 'group.collapsed ' + P + 'group-bd{max-height:0;opacity:0;padding-top:0;padding-bottom:0}\
' + P + 'ctrl{margin-bottom:12px}\
' + P + 'ctrl-label{font-size:11px;color:#94a3b8;margin-bottom:7px}\
' + P + 'ctrl-row{display:flex;align-items:center;gap:10px}\
' + P + 'slider{flex:1;-webkit-appearance:none;appearance:none;height:4px;background:#334155;border-radius:999px;outline:none;cursor:pointer;transition:background .15s ' + EASE + '}\
' + P + 'slider:hover{background:#475569}\
' + P + 'slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#60a5fa;cursor:pointer;border:2px solid #dbeafe;box-shadow:0 2px 8px rgba(2,6,23,.35);transition:transform .15s ' + EASE_OUT + ',box-shadow .15s ' + EASE + '}\
' + P + 'slider:hover::-webkit-slider-thumb{transform:scale(1.18);box-shadow:0 4px 12px rgba(96,165,250,.35)}\
' + P + 'slider:active::-webkit-slider-thumb{transform:scale(1.08);background:#3b82f6}\
' + P + 'slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#60a5fa;cursor:pointer;border:2px solid #dbeafe;box-shadow:0 2px 8px rgba(2,6,23,.35)}\
' + P + 'num{width:58px;height:28px;padding:0 6px;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.18);border-radius:7px;color:#e2e8f0;font-size:12px;text-align:center;font-family:"SF Mono",Monaco,Consolas,monospace;outline:none;transition:border-color .15s ' + EASE + ',box-shadow .15s ' + EASE + '}\
' + P + 'num:focus{border-color:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.18)}\
' + P + 'color-row{display:flex;align-items:center;gap:10px}\
' + P + 'color-input{width:34px;height:28px;border:1px solid rgba(148,163,184,.2);border-radius:7px;padding:2px;cursor:pointer;background:rgba(15,23,42,.72);outline:none;transition:border-color .15s ' + EASE + ',transform .15s ' + EASE_OUT + '}\
' + P + 'color-input:hover{border-color:#60a5fa;transform:translateY(-1px)}\
' + P + 'color-input::-webkit-color-swatch-wrapper{padding:0}\
' + P + 'color-input::-webkit-color-swatch{border:none;border-radius:5px}\
' + P + 'color-hex{width:92px;height:28px;padding:0 8px;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.18);border-radius:7px;color:#e2e8f0;font-size:12px;font-family:"SF Mono",Monaco,Consolas,monospace;outline:none;transition:border-color .15s ' + EASE + ',box-shadow .15s ' + EASE + '}\
' + P + 'color-hex:focus{border-color:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.18)}\
' + P + 'select{width:100%;height:30px;padding:0 9px;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.18);border-radius:7px;color:#e2e8f0;font-size:12px;outline:none;font-family:inherit;transition:border-color .15s ' + EASE + ',box-shadow .15s ' + EASE + '}\
' + P + 'select:focus{border-color:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.18)}\
' + P + 'btn-group{display:flex}\
' + P + 'bg-item{flex:1;height:30px;padding:0 8px;background:rgba(255,255,255,.045);border:1px solid rgba(148,163,184,.14);color:#94a3b8;cursor:pointer;font-size:12px;text-align:center;font-family:inherit;transition:background .2s ' + EASE + ',border-color .2s ' + EASE + ',color .2s ' + EASE + '}\
' + P + 'bg-item:first-child{border-radius:7px 0 0 7px}\
' + P + 'bg-item:last-child{border-radius:0 7px 7px 0}\
' + P + 'bg-item+' + P + 'bg-item{border-left:none}\
' + P + 'bg-item:hover{background:rgba(255,255,255,.08);color:#e2e8f0}\
' + P + 'bg-item:active{transform:scaleY(0.93);transition-duration:.08s}\
' + P + 'bg-item.active{background:#2563eb;border-color:#3b82f6;color:#fff;box-shadow:0 6px 14px rgba(37,99,235,.22)}\
' + P + 'sp-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px}\
' + P + 'sp-label{font-size:10px;color:#64748b;text-align:center;margin-bottom:3px}\
' + P + 'sp-input{width:100%;height:28px;padding:0 3px;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.18);border-radius:7px;color:#e2e8f0;font-size:11px;text-align:center;font-family:"SF Mono",Monaco,Consolas,monospace;outline:none;transition:border-color .15s ' + EASE + ',box-shadow .15s ' + EASE + '}\
' + P + 'sp-input:focus{border-color:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.18)}\
' + P + 'dim-input{width:100%;height:30px;padding:0 9px;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.18);border-radius:7px;color:#e2e8f0;font-size:12px;font-family:"SF Mono",Monaco,Consolas,monospace;outline:none;transition:border-color .15s ' + EASE + ',box-shadow .15s ' + EASE + '}\
' + P + 'dim-input:focus{border-color:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.18)}\
' + P + 'shadow-label{width:28px;font-size:11px;color:#94a3b8;flex-shrink:0}\
' + P + 'hover-ov{position:fixed;pointer-events:none;border:1px dashed rgba(96,165,250,.75);background:rgba(96,165,250,.08);transition:top .1s ' + EASE + ',left .1s ' + EASE + ',width .1s ' + EASE + ',height .1s ' + EASE + ';z-index:' + (Z + 1) + ';display:none}\
' + P + 'sel-ov{position:fixed;pointer-events:none;border:1px solid #60a5fa;background:rgba(96,165,250,.07);box-shadow:0 0 0 1px rgba(15,23,42,.7),0 0 0 4px rgba(96,165,250,.12);z-index:' + (Z + 2) + ';display:none;animation:' + PREFIX + '-pop .2s ' + EASE_OUT + '}\
@keyframes ' + PREFIX + '-pop{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}\
' + P + 'ov-tag{position:absolute;top:-22px;left:-1px;background:#2563eb;color:#fff;font-size:10px;padding:3px 7px;border-radius:6px 6px 0 0;font-family:"SF Mono",Monaco,Consolas,monospace;white-space:nowrap}\
' + P + 'toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(8px);background:rgba(15,23,42,.92);border:1px solid rgba(148,163,184,.18);color:#f8fafc;padding:9px 18px;border-radius:999px;font-size:13px;z-index:' + (Z + 9) + ';pointer-events:none;opacity:0;box-shadow:0 16px 35px rgba(2,6,23,.32);transition:opacity .25s ' + EASE + ',transform .25s ' + EASE_OUT + '}\
' + P + 'toast.show{opacity:1;transform:translateX(-50%) translateY(0)}\
' + P + 'el-info{padding:12px 14px;border-bottom:1px solid rgba(148,163,184,.12);display:flex;align-items:baseline;gap:7px;background:rgba(255,255,255,.025)}\
' + P + 'el-tag{font-size:13px;font-weight:650;color:#93c5fd;font-family:"SF Mono",Monaco,Consolas,monospace}\
' + P + 'el-dim{font-size:11px;color:#64748b;font-family:"SF Mono",Monaco,Consolas,monospace}\
' + P + 'block-box{padding:12px 14px;border-bottom:1px solid rgba(148,163,184,.12);background:rgba(37,99,235,.055)}\
' + P + 'block-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px}\
' + P + 'block-title{font-size:12px;font-weight:700;color:#e2e8f0}\
' + P + 'block-path{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:#64748b;font-family:"SF Mono",Monaco,Consolas,monospace}\
' + P + 'block-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}\
' + P + 'block-btn{height:30px;padding:0 8px;border-radius:7px;border:1px solid rgba(148,163,184,.16);background:rgba(255,255,255,.045);color:#cbd5e1;cursor:pointer;font-size:12px;font-family:inherit;line-height:28px;transition:background .15s ' + EASE + ',border-color .15s ' + EASE + ',color .15s ' + EASE + ',transform .15s ' + EASE + ',box-shadow .15s ' + EASE + ',opacity .15s ' + EASE + '}\
' + P + 'block-btn:hover{background:rgba(255,255,255,.09);border-color:rgba(148,163,184,.3);color:#fff}\
' + P + 'block-btn:disabled{opacity:.4;cursor:default;transform:none!important}\
' + P + 'content-box{padding:12px 14px;border-bottom:1px solid rgba(148,163,184,.12);background:rgba(15,23,42,.18)}\
' + P + 'content-grid{display:grid;gap:10px}\
' + P + 'content-label{font-size:11px;color:#94a3b8;margin-bottom:6px}\
' + P + 'content-input{width:100%;height:30px;padding:0 9px;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.18);border-radius:7px;color:#e2e8f0;font-size:12px;font-family:"SF Mono",Monaco,Consolas,monospace;outline:none}\
' + P + 'content-input:focus{border-color:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.18)}\
' + P + 'tree-box{padding:12px 14px;border-bottom:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.025)}\
' + P + 'tree-list{display:grid;gap:5px}\
' + P + 'tree-item{height:28px;display:flex;align-items:center;gap:7px;padding:0 8px;border-radius:7px;border:1px solid transparent;background:transparent;color:#cbd5e1;cursor:pointer;font-size:12px;font-family:inherit;text-align:left}\
' + P + 'tree-item:hover{background:rgba(255,255,255,.07);border-color:rgba(148,163,184,.18);color:#fff}\
' + P + 'tree-item.active{background:rgba(37,99,235,.22);border-color:rgba(96,165,250,.4);color:#fff}\
' + P + 'tree-item.muted{cursor:default;color:#64748b}\
' + P + 'tree-item.muted:hover{background:transparent;border-color:transparent;color:#64748b}\
' + P + 'tree-role{width:42px;flex:0 0 auto;color:#64748b;font-size:11px}\
' + P + 'tree-tag{font-family:"SF Mono",Monaco,Consolas,monospace;color:#93c5fd}\
' + P + 'tree-item.muted ' + P + 'tree-tag{color:#64748b}\
' + P + 'tree-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#94a3b8}\
' + P + 'pos-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;width:90px}\
' + P + 'pos-cell{width:26px;height:26px;border-radius:5px;border:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.045);cursor:pointer;transition:background .15s ' + EASE + ',border-color .15s ' + EASE + ',box-shadow .15s ' + EASE + ';padding:0}\
' + P + 'pos-cell:hover{background:rgba(255,255,255,.09);border-color:rgba(148,163,184,.3)}\
' + P + 'pos-cell.active{background:#2563eb;border-color:#3b82f6}\
' + P + 'file-input{display:none}\
' + P + 'drop-ind{position:fixed;background:#60a5fa;border-radius:2px;box-shadow:0 0 8px rgba(96,165,250,.6);pointer-events:none;z-index:' + (Z + 6) + ';display:none;transition:none}\
' + P + 'drop-ind.h{height:3px}\
' + P + 'drop-ind.v{width:3px}\
[data-ve-dragging]{opacity:.4!important;cursor:grabbing!important}\
body[data-ve-drag-mode]{cursor:grab!important}\
body[data-ve-drag-mode] *:not(#' + PREFIX + '-root):not(#' + PREFIX + '-root *){cursor:grab!important}\
body[data-ve-drag-active]{cursor:grabbing!important;user-select:none!important}\
body[data-ve-drag-active] *{cursor:grabbing!important}\
@media (max-width:720px){\
' + P + 'toggle{right:16px;bottom:16px;width:46px;height:46px}\
' + P + 'toolbar{justify-content:flex-start;max-height:144px;overflow:auto;max-width:calc(100vw - 16px)}\
' + P + 'tb-group.main{order:3;flex-basis:100%;justify-content:flex-start}\
' + P + 'tb-group.export{order:2;flex:1;justify-content:flex-end}\
' + P + 'tb-btn{height:32px;line-height:30px;padding:0 10px}\
' + P + 'pager{margin-left:0;padding-left:4px;padding-right:4px;border-left:none}\
' + P + 'panel{top:auto;left:8px;right:8px;width:auto;height:42vh;max-height:360px;bottom:8px;border-radius:12px}\
' + P + 'panel-empty{padding:32px 16px}\
' + P + 'sp-grid{gap:5px}\
' + P + 'toast{bottom:24px;max-width:calc(100vw - 24px);text-align:center}\
}\
'

  // ========== Utilities ==========

  function isVE(el) {
    if (!el) return true
    if (!el.closest) { el = el.parentElement; if (!el || !el.closest) return true }
    return el.id === PREFIX + '-root' || !!el.closest('#' + PREFIX + '-root') ||
           !!el.closest('.' + PREFIX + '-toggle') ||
           el.hasAttribute('data-ve-ui') || !!el.closest('[data-ve-ui]')
  }

  function cleanClassList(el, limit) {
    if (!el || !el.className || typeof el.className !== 'string') return []
    return el.className.split(/\s+/).filter(function (c) { return c && !hasPrefix(c, PREFIX) }).slice(0, limit || 2)
  }

  function shortElLabel(el) {
    if (!el || !el.tagName) return ''
    var label = el.tagName.toLowerCase()
    if (el.id && !hasPrefix(el.id, PREFIX)) label += '#' + el.id
    else {
      var cls = cleanClassList(el, 1)
      if (cls.length) label += '.' + cls[0]
    }
    return label
  }

  function blockName(el) {
    if (!el || !el.tagName) return '区块'
    var tag = el.tagName.toLowerCase()
    var names = { header: 'Header', nav: 'Nav', main: 'Main', aside: 'Aside', footer: 'Footer', section: 'Section', article: 'Article' }
    if (names[tag]) return names[tag]
    var text = ((el.id || '') + ' ' + cleanClassList(el, 6).join(' ')).toLowerCase()
    if (/header|topbar|navbar/.test(text)) return 'Header'
    if (/\bnav\b|menu|sidebar|sider|left/.test(text)) return 'Nav'
    if (/footer|copyright/.test(text)) return 'Footer'
    if (/main|content|body|container|wrapper/.test(text)) return 'Main'
    if (/hero|section|panel|card|module|block/.test(text)) return 'Section'
    return tag === 'div' ? 'Block' : tag
  }

  function findBlock(target) {
    var cur = target
    while (cur && cur !== document.body && cur !== document.documentElement) {
      if (isSemanticBlock(cur)) return cur
      cur = cur.parentElement
    }
    return null
  }

  function isSemanticBlock(el) {
    if (!el || !el.tagName || isVE(el)) return false
    var tag = el.tagName.toLowerCase()
    if (['header', 'nav', 'main', 'aside', 'footer', 'section', 'article'].indexOf(tag) !== -1) return true
    var text = ((el.id || '') + ' ' + cleanClassList(el, 8).join(' ')).toLowerCase()
    return tag === 'div' && /\b(header|topbar|navbar|nav|menu|sidebar|sider|left|main|content|body|container|wrapper|footer|copyright|hero|section|panel|card|module|block)\b/.test(text)
  }

  function movableSibling(node, dir) {
    var cur = dir < 0 ? node.previousElementSibling : node.nextElementSibling
    while (cur && isVE(cur)) cur = dir < 0 ? cur.previousElementSibling : cur.nextElementSibling
    return cur
  }

  function elPath(el) {
    var parts = []
    var cur = el
    while (cur && cur !== document.body && cur !== document.documentElement) {
      var tag = cur.tagName.toLowerCase()
      if (cur.id && !hasPrefix(cur.id, PREFIX)) tag += '#' + cur.id
      else if (cur.className && typeof cur.className === 'string') {
        var cls = cur.className.split(/\s+/).filter(function (c) { return c && !hasPrefix(c, PREFIX) }).slice(0, 2)
        if (cls.length) tag += '.' + cls.join('.')
      }
      parts.unshift(tag)
      cur = cur.parentElement
    }
    return parts.join(' › ')
  }

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return 'transparent'
    var m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (!m) return hasPrefix(rgb, '#') ? rgb : '#000000'
    return '#' + [m[1], m[2], m[3]].map(hexByte).join('')
  }

  function cs(el, prop) { return getComputedStyle(el)[prop] }
  function round(v) { return Math.round(v * 100) / 100 }
  function normalizePos(v) {
    var map = { left: '0%', center: '50%', right: '100%', top: '0%', bottom: '100%' }
    var parts = (v || '50% 50%').trim().split(/\s+/)
    return parts.map(function (p) { return map[p] || p }).join(' ')
  }

  function showToast(msg, ms) {
    dom.toast.textContent = msg
    dom.toast.classList.add('show')
    clearTimeout(dom.toast._t)
    dom.toast._t = setTimeout(function () { dom.toast.classList.remove('show') }, ms || 2000)
  }

  function el(tag, cls, attrs) {
    var e = document.createElement(tag)
    if (cls) e.className = cls
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k]
      else if (k === 'html') e.innerHTML = attrs[k]
      else e.setAttribute(k, attrs[k])
    })
    return e
  }

  function bindPress(btn, fn) {
    var pointerHandled = false
    var pointerTimer = null
    function run(e) {
      if (btn.disabled) return
      e.preventDefault()
      e.stopPropagation()
      pointerHandled = true
      clearTimeout(pointerTimer)
      fn()
      pointerTimer = setTimeout(function () { pointerHandled = false }, 700)
    }
    btn.addEventListener('pointerdown', run)
    btn.addEventListener('mousedown', function (e) {
      if (!window.PointerEvent) run(e)
    })
    btn.addEventListener('click', function (e) {
      e.preventDefault()
      e.stopPropagation()
      if (pointerHandled) {
        pointerHandled = false
        clearTimeout(pointerTimer)
        return
      }
      if (!btn.disabled) fn()
    })
  }

  // ========== CSS Injection ==========

  function injectCSS() {
    var s = document.createElement('style')
    s.setAttribute('data-ve', '1')
    s.textContent = CSS
    document.head.appendChild(s)
  }

  // ========== UI Creation ==========

  function createUI() {
    dom.root = el('div', null)
    dom.root.id = PREFIX + '-root'

    dom.toggle = el('button', PREFIX + '-toggle', { title: t('切换编辑模式 (Alt+E)'), html: ICON_EDIT })
    dom.toggle.addEventListener('click', toggleEdit)

    dom.toolbar = el('div', PREFIX + '-toolbar')
    dom.tbHandle = el('div', PREFIX + '-tb-handle', { html: ICON_GRIP, title: t('拖动移动工具栏 · 双击复位') })
    initToolbarDrag(dom.tbHandle)
    var exitBtn = el('button', PREFIX + '-tb-btn exit', { html: ICON_X, title: t('退出编辑'), 'data-ve-action': 'exit' })
    exitBtn.addEventListener('click', exitEdit)
    dom.breadcrumb = el('span', PREFIX + '-breadcrumb')
    var copyBtn = el('button', PREFIX + '-tb-btn', { text: t('复制 HTML'), 'data-ve-action': 'copy-html' })
    copyBtn.addEventListener('click', copyHTML)
    var dlBtn = el('button', PREFIX + '-tb-btn primary', { text: t('保存 HTML'), title: t('保存 HTML'), 'data-ve-action': 'download-html' })
    dlBtn.addEventListener('click', downloadHTML)
    dom.layoutBtn = el('button', PREFIX + '-tb-btn', { text: t('🎨 版式'), title: t('打开/关闭版式编辑'), 'data-ve-action': 'toggle-layout' })
    dom.layoutBtn.addEventListener('click', toggleLayoutPanel)
    dom.textBtn = el('button', PREFIX + '-tb-btn', { text: t('✏️ 文字'), title: t('点击页面文字直接编辑 (Alt+T)'), 'data-ve-action': 'edit-text' })
    dom.textBtn.addEventListener('click', toggleTextEdit)
    dom.dragBtn = el('button', PREFIX + '-tb-btn', { text: t('👆 拖拽'), title: t('按住元素拖动可改顺序 (Alt+D)'), 'data-ve-action': 'drag-move' })
    dom.dragBtn.addEventListener('click', toggleDragMode)
    dom.undoBtn = el('button', PREFIX + '-tb-btn icon', { html: ICON_UNDO, title: t('撤销上一步 (Alt+Z)'), 'data-ve-action': 'undo' })
    dom.undoBtn.addEventListener('click', undo)
    dom.redoBtn = el('button', PREFIX + '-tb-btn icon', { html: ICON_REDO, title: t('复原刚刚撤销的操作 (Alt+Y)'), 'data-ve-action': 'redo' })
    dom.redoBtn.addEventListener('click', redo)
    dom.pager = el('div', PREFIX + '-pager')
    dom.prevPageBtn = el('button', PREFIX + '-tb-btn', { text: t('上一页'), title: t('切换到上一页 (Alt+←)'), 'data-ve-action': 'prev-page' })
    bindPress(dom.prevPageBtn, function () { goPage(-1) })
    dom.pageLabel = el('span', PREFIX + '-page-label', { text: '1/1' })
    dom.nextPageBtn = el('button', PREFIX + '-tb-btn', { text: t('下一页'), title: t('切换到下一页 (Alt+→)'), 'data-ve-action': 'next-page' })
    bindPress(dom.nextPageBtn, function () { goPage(1) })
    dom.pager.appendChild(dom.prevPageBtn)
    dom.pager.appendChild(dom.pageLabel)
    dom.pager.appendChild(dom.nextPageBtn)
    var reloadBtn = el('button', PREFIX + '-tb-btn icon', { html: ICON_RELOAD, title: t('重新载入当前文件/入口页'), 'data-ve-action': 'reload' })
    reloadBtn.addEventListener('click', reloadPage)
    var leftGroup = el('div', PREFIX + '-tb-group')
    var mainGroup = el('div', PREFIX + '-tb-group main')
    var exportGroup = el('div', PREFIX + '-tb-group export')
    leftGroup.appendChild(exitBtn)
    leftGroup.appendChild(dom.breadcrumb)
    mainGroup.appendChild(dom.layoutBtn)
    mainGroup.appendChild(dom.textBtn)
    mainGroup.appendChild(dom.dragBtn)
    mainGroup.appendChild(dom.undoBtn)
    mainGroup.appendChild(dom.redoBtn)
    mainGroup.appendChild(dom.pager)
    mainGroup.appendChild(reloadBtn)
    exportGroup.appendChild(copyBtn)
    exportGroup.appendChild(dlBtn)
    dom.toolbar.appendChild(dom.tbHandle)
    dom.toolbar.appendChild(leftGroup)
    dom.toolbar.appendChild(mainGroup)
    dom.toolbar.appendChild(exportGroup)
    updateToolbarState()

    dom.panel = el('div', PREFIX + '-panel')
    dom.panelInner = el('div', PREFIX + '-panel-inner')
    dom.panel.appendChild(dom.panelInner)
    initPanelDrag()

    dom.hoverOv = el('div', PREFIX + '-hover-ov')
    dom.hoverOv.appendChild(el('span', PREFIX + '-ov-tag'))
    dom.selOv = el('div', PREFIX + '-sel-ov')
    dom.selOv.appendChild(el('span', PREFIX + '-ov-tag'))

    dom.toast = el('div', PREFIX + '-toast')
    dom.fileInput = el('input', PREFIX + '-file-input')
    dom.fileInput.type = 'file'
    dom.fileInput.accept = 'image/*'
    dom.fileInput.setAttribute('data-ve-ui', '1')
    dom.dropInd = el('div', PREFIX + '-drop-ind h')

    dom.root.appendChild(dom.toolbar)
    dom.root.appendChild(dom.panel)
    dom.root.appendChild(dom.hoverOv)
    dom.root.appendChild(dom.selOv)
    dom.root.appendChild(dom.toast)
    dom.root.appendChild(dom.fileInput)
    dom.root.appendChild(dom.dropInd)
    document.body.appendChild(dom.root)
    document.body.appendChild(dom.toggle)
  }

  // ========== Control Renderers ==========

  var _renderTimer = null
  function renderPanel() {
    if (!state.layoutOpen) return
    clearTimeout(_renderTimer)
    dom.panelInner.classList.add('fade')
    _renderTimer = setTimeout(function () {
      dom.panelInner.innerHTML = ''
      var title = el('div', PREFIX + '-panel-title', { title: t('拖动停靠到左侧或右侧 · 双击复位') })
      var titleLabel = el('span', PREFIX + '-panel-drag-label')
      titleLabel.appendChild(el('span', PREFIX + '-panel-grip', { html: ICON_GRIP }))
      titleLabel.appendChild(el('span', null, { text: t('样式面板') }))
      title.appendChild(titleLabel)
      if (!state.selected) {
        title.appendChild(el('span', PREFIX + '-panel-subtitle', { text: t('未选择') }))
        dom.panelInner.appendChild(title)
        dom.panelInner.appendChild(renderStructureTree())
        dom.panelInner.classList.remove('fade')
        return
      }
      var target = state.selected
      title.appendChild(el('span', PREFIX + '-panel-subtitle', { text: target.tagName.toLowerCase() }))
      dom.panelInner.appendChild(title)
      var info = el('div', PREFIX + '-el-info')
      info.appendChild(el('span', PREFIX + '-el-tag', { text: target.tagName.toLowerCase() }))
      var rect = target.getBoundingClientRect()
      info.appendChild(el('span', PREFIX + '-el-dim', { text: Math.round(rect.width) + ' × ' + Math.round(rect.height) }))
      dom.panelInner.appendChild(info)
      dom.panelInner.appendChild(renderStructureTree())
      dom.panelInner.appendChild(renderBlockTools(target))
      var link = closestAnchor(target)
      if (link) dom.panelInner.appendChild(renderLinkSection(link))
      var contentTools = renderContentTools(target)
      if (contentTools) dom.panelInner.appendChild(contentTools)

      GROUPS.forEach(function (g) {
        var section = el('div', PREFIX + '-group' + (g.collapsed ? ' collapsed' : ''))
        var header = el('div', PREFIX + '-group-hd', { text: g.group })
        header.addEventListener('click', function () { section.classList.toggle('collapsed') })
        section.appendChild(header)
        var body = el('div', PREFIX + '-group-bd')
        g.controls.forEach(function (ctrl) { body.appendChild(renderControl(ctrl)) })
        section.appendChild(body)
        dom.panelInner.appendChild(section)
      })
      dom.panelInner.classList.remove('fade')
    }, 80)
  }

  function closestAnchor(target) {
    if (!target || !target.closest) return null
    var link = target.closest('a')
    return link && !isVE(link) ? link : null
  }

  function renderLinkSection(link) {
    var section = el('div', PREFIX + '-group')
    var header = el('div', PREFIX + '-group-hd', { text: t('链接') })
    header.addEventListener('click', function () { section.classList.toggle('collapsed') })
    section.appendChild(header)
    var body = el('div', PREFIX + '-group-bd')
    body.appendChild(renderAttributeInput(link, 'href', t('跳转地址'), 'https://example.com 或 #section'))
    body.appendChild(renderTargetSelect(link))
    body.appendChild(renderContentInput(t('链接文字'), link.textContent || '', function (value) { applyTextContent(link, value) }))
    section.appendChild(body)
    return section
  }

  function renderAttributeInput(target, attr, label, placeholder) {
    var wrap = el('div', PREFIX + '-ctrl')
    wrap.appendChild(el('div', PREFIX + '-ctrl-label', { text: label }))
    var input = el('input', PREFIX + '-dim-input')
    input.type = 'text'
    input.value = target.getAttribute(attr) || ''
    input.placeholder = placeholder || ''
    input.addEventListener('change', function () {
      applyAttribute(target, attr, input.value.trim())
    })
    wrap.appendChild(input)
    return wrap
  }

  function renderStructureTree() {
    var box = el('div', PREFIX + '-tree-box')
    var head = el('div', PREFIX + '-block-head')
    head.appendChild(el('div', PREFIX + '-block-title', { text: t('页面结构') }))
    head.appendChild(el('div', PREFIX + '-block-path', { text: t('结构位置') }))
    box.appendChild(head)
    var list = el('div', PREFIX + '-tree-list')
    var nodes = collectStructureNodes()
    var focus = findStructureFocus(nodes)
    if (!focus) {
      list.appendChild(renderStructurePlaceholder(t('当前'), t('点击页面元素后显示结构位置')))
      box.appendChild(list)
      return box
    }
    var prev = focus.index > 0 ? nodes[focus.index - 1] : null
    var next = focus.index < nodes.length ? nodes[focus.index + (focus.inList ? 1 : 0)] : null
    list.appendChild(prev ? renderStructureItem(prev, t('上一项'), false) : renderStructurePlaceholder(t('上一项'), t('没有上一项')))
    list.appendChild(renderStructureItem(focus.node, t('当前'), true))
    list.appendChild(next ? renderStructureItem(next, t('下一项'), false) : renderStructurePlaceholder(t('下一项'), t('没有下一项')))
    box.appendChild(list)
    return box
  }

  function renderStructureItem(node, role, active) {
    var item = el('button', PREFIX + '-tree-item' + (active ? ' active' : ''), { type: 'button' })
    item.appendChild(el('span', PREFIX + '-tree-role', { text: role }))
    item.appendChild(el('span', PREFIX + '-tree-tag', { text: shortElLabel(node) }))
    item.appendChild(el('span', PREFIX + '-tree-text', { text: structureNodeText(node) }))
    item.addEventListener('click', function () {
      selectElement(node)
      showToast(t('已从结构树选中 ') + shortElLabel(node))
    })
    return item
  }

  function renderStructurePlaceholder(role, text) {
    var item = el('div', PREFIX + '-tree-item muted')
    item.appendChild(el('span', PREFIX + '-tree-role', { text: role }))
    item.appendChild(el('span', PREFIX + '-tree-tag', { text: '-' }))
    item.appendChild(el('span', PREFIX + '-tree-text', { text: text }))
    return item
  }

  function collectStructureNodes() {
    var selector = [
      'header', 'nav', 'main', 'section', 'article', 'aside', 'footer',
      'a', 'button', 'img',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'li', 'blockquote', 'figcaption', 'label',
      'div', 'span'
    ].join(',')
    return Array.prototype.filter.call(document.querySelectorAll(selector), function (node) {
      return shouldShowStructureNode(node)
    }).slice(0, 240)
  }

  function findStructureFocus(nodes) {
    var target = state.selected
    if (!target || !target.tagName || isVE(target)) return null
    var index = nodes.indexOf(target)
    if (index !== -1) return { node: target, index: index, inList: true }
    var cur = target.parentElement
    while (cur && cur !== document.body && cur !== document.documentElement) {
      index = nodes.indexOf(cur)
      if (index !== -1) return { node: cur, index: index, inList: true }
      cur = cur.parentElement
    }
    if (!isElementVisibleEnough(target)) return null
    return { node: target, index: structureInsertionIndex(nodes, target), inList: false }
  }

  function structureInsertionIndex(nodes, target) {
    for (var i = 0; i < nodes.length; i++) {
      if (target.compareDocumentPosition(nodes[i]) & Node.DOCUMENT_POSITION_FOLLOWING) return i
    }
    return nodes.length
  }

  function shouldShowStructureNode(node) {
    if (!node || !node.tagName || isVE(node) || node === document.body) return false
    if (!isElementVisibleEnough(node)) return false
    var tag = node.tagName.toLowerCase()
    if (/^(header|nav|main|section|article|aside|footer|a|button|img)$/.test(tag)) return true
    if (/^(h1|h2|h3|h4|h5|h6|p|li|blockquote|figcaption|label)$/.test(tag)) return hasStructureText(node)
    if (/^(div|span)$/.test(tag)) return isLeafTextStructureNode(node)
    return false
  }

  function isElementVisibleEnough(node) {
    var style = getComputedStyle(node)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    var rect = node.getBoundingClientRect()
    if (node.tagName && node.tagName.toLowerCase() === 'img') return rect.width > 0 && rect.height > 0
    return rect.width > 0 && rect.height > 0 && ((node.textContent || '').trim() || node.children.length)
  }

  function hasStructureText(node) {
    return !!((node.textContent || '').replace(/\s+/g, ' ').trim())
  }

  function isLeafTextStructureNode(node) {
    if (!hasStructureText(node)) return false
    if (node.children && node.children.length) return false
    return true
  }

  function structureDepth(node) {
    var depth = 0
    var cur = node.parentElement
    while (cur && cur !== document.body && cur !== document.documentElement) {
      if (shouldShowStructureNode(cur)) depth++
      cur = cur.parentElement
    }
    return depth
  }

  function structureNodeText(node) {
    if (!node || !node.tagName) return ''
    var tag = node.tagName.toLowerCase()
    if (tag === 'img') return node.getAttribute('alt') || node.getAttribute('src') || ''
    if (/^(a|button)$/.test(tag) || !node.children || !node.children.length) return normalizeStructureText(node.textContent)
    var direct = ''
    for (var i = 0; i < node.childNodes.length; i++) {
      var child = node.childNodes[i]
      if (child.nodeType === 3) direct += child.nodeValue || ''
    }
    direct = normalizeStructureText(direct)
    if (direct) return direct
    for (var j = 0; j < node.children.length; j++) {
      if (!isVE(node.children[j]) && hasStructureText(node.children[j])) return normalizeStructureText(node.children[j].textContent)
    }
    return ''
  }

  function normalizeStructureText(text) {
    return ((text || '').replace(/\s+/g, ' ').trim()).slice(0, 42)
  }

  function renderBlockTools(target) {
    var block = findBlock(target)
    var box = el('div', PREFIX + '-block-box')
    var head = el('div', PREFIX + '-block-head')
    head.appendChild(el('div', PREFIX + '-block-title', { text: block ? t('当前区块：') + blockName(block) : t('当前区块：未识别') }))
    head.appendChild(el('div', PREFIX + '-block-path', { text: block ? shortElLabel(block) : 'header/nav/main/section/footer' }))
    box.appendChild(head)
    var actions = el('div', PREFIX + '-block-actions')
    var selectBtn = el('button', PREFIX + '-block-btn', { text: t('选中区块'), type: 'button' })
    var copyBtn = el('button', PREFIX + '-block-btn', { text: t('复制区块'), type: 'button' })
    var upBtn = el('button', PREFIX + '-block-btn', { text: t('上移区块'), type: 'button' })
    var downBtn = el('button', PREFIX + '-block-btn', { text: t('下移区块'), type: 'button' })
    var delBtn = el('button', PREFIX + '-block-btn', { text: t('删除区块'), type: 'button' })
    selectBtn.disabled = copyBtn.disabled = upBtn.disabled = downBtn.disabled = delBtn.disabled = !block
    if (block) {
      upBtn.disabled = !movableSibling(block, -1)
      downBtn.disabled = !movableSibling(block, 1)
      selectBtn.addEventListener('click', function () { selectElement(block); showToast(t('已选中整个区块')) })
      copyBtn.addEventListener('click', function () { copyBlockHTML(block) })
      upBtn.addEventListener('click', function () { moveBlock(block, -1) })
      downBtn.addEventListener('click', function () { moveBlock(block, 1) })
      delBtn.addEventListener('click', function () { deleteBlock(block) })
    }
    actions.appendChild(selectBtn); actions.appendChild(copyBtn); actions.appendChild(upBtn); actions.appendChild(downBtn); actions.appendChild(delBtn)
    box.appendChild(actions)
    return box
  }

  function renderContentTools(target) {
    var editable = findContentTarget(target)
    if (!editable) return null
    var tag = editable.tagName.toLowerCase()
    var box = el('div', PREFIX + '-content-box')
    var head = el('div', PREFIX + '-block-head')
    head.appendChild(el('div', PREFIX + '-block-title', { text: t('内容属性：') + tag }))
    head.appendChild(el('div', PREFIX + '-block-path', { text: shortElLabel(editable) }))
    box.appendChild(head)
    var grid = el('div', PREFIX + '-content-grid')
    if (tag === 'button') {
      grid.appendChild(renderContentInput(t('按钮文字'), editable.textContent || '', function (value) { applyTextContent(editable, value) }))
    } else if (tag === 'img') {
      grid.appendChild(renderContentInput(t('图片地址 src'), editable.getAttribute('src') || '', function (value) { applyAttribute(editable, 'src', value); updateSelOverlay() }))
      grid.appendChild(renderContentInput(t('图片 alt'), editable.getAttribute('alt') || '', function (value) { applyAttribute(editable, 'alt', value) }))
      // Replace image from local file
      grid.appendChild(renderContentAction(t('替换图片'), function () {
        dom.fileInput.value = ''
        dom.fileInput.onchange = function () {
          var file = dom.fileInput.files && dom.fileInput.files[0]
          if (!file || file.type.indexOf('image/') !== 0) return
          var reader = new FileReader()
          reader.onload = function () {
            applyAttribute(editable, 'src', reader.result)
            updateSelOverlay()
            showToast(t('图片已替换'))
            renderPanel()
          }
          reader.readAsDataURL(file)
        }
        dom.fileInput.click()
      }))
      // object-fit selector
      var fitWrap = el('div', null)
      fitWrap.appendChild(el('div', PREFIX + '-content-label', { text: t('图片裁切') }))
      var fitSel = el('select', PREFIX + '-select')
      var currentFit = editable.style.objectFit || cs(editable, 'objectFit') || 'fill'
      ;[
        { value: 'cover', label: t('cover 填满裁切') },
        { value: 'contain', label: t('contain 完整显示') },
        { value: 'fill', label: t('fill 拉伸填充') },
        { value: 'none', label: t('none 原始大小') },
        { value: 'scale-down', label: t('scale-down 自动缩小') }
      ].forEach(function (opt) {
        var o = el('option', null, { text: opt.label })
        o.value = opt.value
        if (opt.value === currentFit) o.selected = true
        fitSel.appendChild(o)
      })
      fitSel.addEventListener('change', function () { applyStyle('objectFit', fitSel.value) })
      fitWrap.appendChild(fitSel)
      grid.appendChild(fitWrap)
      // object-position 3x3 grid
      var posWrap = el('div', null)
      posWrap.appendChild(el('div', PREFIX + '-content-label', { text: t('图片位置') }))
      var posGrid = el('div', PREFIX + '-pos-grid')
      var currentPos = normalizePos(editable.style.objectPosition || cs(editable, 'objectPosition'))
      var positions = [
        'left top', 'center top', 'right top',
        'left center', 'center center', 'right center',
        'left bottom', 'center bottom', 'right bottom'
      ]
      positions.forEach(function (pos) {
        var cell = el('button', PREFIX + '-pos-cell', { type: 'button' })
        if (normalizePos(pos) === currentPos) cell.classList.add('active')
        cell.addEventListener('click', function () {
          each(posGrid.querySelectorAll('.' + PREFIX + '-pos-cell'), function (c) { c.classList.remove('active') })
          cell.classList.add('active')
          applyStyle('objectPosition', pos)
        })
        posGrid.appendChild(cell)
      })
      posWrap.appendChild(posGrid)
      grid.appendChild(posWrap)
    } else if (isPlainTextTarget(editable)) {
      grid.appendChild(renderContentInput(t('文字内容'), editable.textContent || '', function (value) { applyTextContent(editable, value) }))
    } else {
      grid.appendChild(renderContentAction(t('直接编辑文字'), function () { startTextEdit(editable) }))
    }
    box.appendChild(grid)
    return box
  }

  function findContentTarget(target) {
    if (!target || isVE(target)) return null
    if (target.tagName && /^(button|img)$/i.test(target.tagName)) return target
    if (isTextContentTarget(target)) return target
    if (isPlainTextTarget(target)) return target
    if (target.closest) {
      var nested = target.closest('button,img')
      if (nested) return nested
    }
    return null
  }

  function isPlainTextTarget(target) {
    if (!target || !target.tagName || !isTextEditable(target)) return false
    var tag = target.tagName.toLowerCase()
    if (/^(a|button|img|input|textarea|select|option)$/.test(tag)) return false
    if (target.children && target.children.length) return false
    return !!((target.textContent || '').trim())
  }

  function isTextContentTarget(target) {
    if (!target || !target.tagName || !isTextEditable(target)) return false
    var tag = target.tagName.toLowerCase()
    if (!/^(h1|h2|h3|h4|h5|h6|p|li|blockquote|figcaption|label|span|strong|em|small|div)$/.test(tag)) return false
    return !!((target.textContent || '').replace(/\s+/g, ' ').trim())
  }

  function renderContentInput(label, value, onChange) {
    var wrap = el('div', null)
    wrap.appendChild(el('div', PREFIX + '-content-label', { text: label }))
    var input = el('input', PREFIX + '-content-input')
    input.type = 'text'
    input.value = value
    input.addEventListener('change', function () { onChange(input.value.trim()) })
    wrap.appendChild(input)
    return wrap
  }

  function renderContentAction(label, onClick) {
    var wrap = el('div', null)
    var btn = el('button', PREFIX + '-block-btn', { text: label, type: 'button' })
    btn.addEventListener('click', onClick)
    wrap.appendChild(btn)
    return wrap
  }

  function renderTargetSelect(anchor) {
    var wrap = el('div', PREFIX + '-ctrl')
    wrap.appendChild(el('div', PREFIX + '-ctrl-label', { text: t('打开方式') }))
    var sel = el('select', PREFIX + '-select')
    var current = anchor.getAttribute('target') === '_blank' ? '_blank' : '_self'
    ;[
      { value: '_self', label: t('当前窗口打开') },
      { value: '_blank', label: t('新窗口打开') }
    ].forEach(function (opt) {
      var item = el('option', null, { text: opt.label })
      item.value = opt.value
      if (opt.value === current) item.selected = true
      sel.appendChild(item)
    })
    sel.addEventListener('change', function () {
      pushHistory('attribute')
      if (sel.value === '_blank') {
        anchor.setAttribute('target', '_blank')
        anchor.setAttribute('rel', 'noopener noreferrer')
      } else {
        anchor.removeAttribute('target')
        if (anchor.getAttribute('rel') === 'noopener noreferrer') anchor.removeAttribute('rel')
      }
      showToast(t('打开方式已更新'))
    })
    wrap.appendChild(sel)
    return wrap
  }

  function renderControl(ctrl) {
    var wrap = el('div', PREFIX + '-ctrl')
    wrap.appendChild(el('div', PREFIX + '-ctrl-label', { text: ctrl.label }))
    switch (ctrl.type) {
      case 'slider': buildSlider(wrap, ctrl); break
      case 'color': buildColor(wrap, ctrl); break
      case 'select': buildSelect(wrap, ctrl); break
      case 'buttonGroup': buildBtnGroup(wrap, ctrl); break
      case 'spacing': buildSpacing(wrap, ctrl); break
      case 'dimension': buildDimension(wrap, ctrl); break
      case 'shadow': buildShadow(wrap, ctrl); break
      case 'compoundSlider': buildCompoundSlider(wrap, ctrl); break
    }
    return wrap
  }

  function buildSlider(wrap, ctrl) {
    var target = state.selected
    var raw = cs(target, ctrl.prop)
    var val = ctrl.parse ? ctrl.parse(raw, target) : parseFloat(raw)
    if (isNaN(val)) val = ctrl.min

    var row = el('div', PREFIX + '-ctrl-row')
    var slider = el('input', PREFIX + '-slider')
    slider.type = 'range'
    slider.min = ctrl.min; slider.max = ctrl.max; slider.step = ctrl.step; slider.value = val
    var numInput = el('input', PREFIX + '-num')
    numInput.type = 'text'
    numInput.value = round(val) + (ctrl.unit || '')

    slider.addEventListener('input', function () {
      var v = parseFloat(slider.value)
      numInput.value = round(v) + (ctrl.unit || '')
      applyStyle(ctrl.prop, ctrl.format ? ctrl.format(v, state.selected) : v + (ctrl.unit || ''))
    })
    numInput.addEventListener('change', function () {
      var v = parseFloat(numInput.value)
      if (!isNaN(v)) {
        slider.value = v
        applyStyle(ctrl.prop, ctrl.format ? ctrl.format(v, state.selected) : v + (ctrl.unit || ''))
      }
    })
    row.appendChild(slider); row.appendChild(numInput)
    wrap.appendChild(row)
  }

  function buildColor(wrap, ctrl) {
    var raw = cs(state.selected, ctrl.prop)
    var hex = rgbToHex(raw)
    var row = el('div', PREFIX + '-color-row')
    var cInput = el('input', PREFIX + '-color-input')
    cInput.type = 'color'
    cInput.value = hex === 'transparent' ? '#ffffff' : hex
    var hInput = el('input', PREFIX + '-color-hex')
    hInput.type = 'text'
    hInput.value = hex

    cInput.addEventListener('input', function () {
      hInput.value = cInput.value
      applyStyle(ctrl.prop, cInput.value)
    })
    hInput.addEventListener('change', function () {
      var v = hInput.value.trim()
      if (/^#[0-9a-fA-F]{3,8}$/.test(v)) {
        cInput.value = v.length <= 5 ? v : v.slice(0, 7)
        applyStyle(ctrl.prop, v)
      } else if (v === 'transparent') {
        applyStyle(ctrl.prop, v)
      }
    })
    row.appendChild(cInput); row.appendChild(hInput)
    wrap.appendChild(row)
  }

  function buildSelect(wrap, ctrl) {
    var raw = cs(state.selected, ctrl.prop)
    var val = ctrl.parse ? ctrl.parse(raw, state.selected) : raw
    var sel = el('select', PREFIX + '-select')
    ctrl.options.forEach(function (opt) {
      var o = el('option', null, { text: opt.label })
      o.value = opt.value
      if (opt.value === val) o.selected = true
      sel.appendChild(o)
    })
    sel.addEventListener('change', function () {
      applyStyle(ctrl.prop, ctrl.format ? ctrl.format(sel.value, state.selected) : sel.value)
    })
    wrap.appendChild(sel)
  }

  function buildBtnGroup(wrap, ctrl) {
    var val = cs(state.selected, ctrl.prop)
    var grp = el('div', PREFIX + '-btn-group')
    ctrl.options.forEach(function (opt) {
      var btn = el('button', PREFIX + '-bg-item' + (opt.value === val ? ' active' : ''), { text: opt.label })
      btn.addEventListener('click', function () {
        grp.querySelectorAll('.' + PREFIX + '-bg-item').forEach(function (b) { b.classList.remove('active') })
        btn.classList.add('active')
        applyStyle(ctrl.prop, opt.value)
      })
      grp.appendChild(btn)
    })
    wrap.appendChild(grp)
  }

  function buildSpacing(wrap, ctrl) {
    var sides = ['Top', 'Right', 'Bottom', 'Left']
    var labels = LANG === 'zh' ? ['上', '右', '下', '左'] : ['T', 'R', 'B', 'L']
    var grid = el('div', PREFIX + '-sp-grid')
    sides.forEach(function (side, i) {
      var col = el('div')
      col.appendChild(el('div', PREFIX + '-sp-label', { text: labels[i] }))
      var input = el('input', PREFIX + '-sp-input')
      input.type = 'number'; input.min = 0
      input.value = Math.round(parseFloat(cs(state.selected, ctrl.prop + side))) || 0
      input.addEventListener('change', function () {
        applyStyle(ctrl.prop + side, (parseInt(input.value) || 0) + 'px')
      })
      col.appendChild(input)
      grid.appendChild(col)
    })
    wrap.appendChild(grid)
  }

  function buildDimension(wrap, ctrl) {
    var raw = cs(state.selected, ctrl.prop)
    var input = el('input', PREFIX + '-dim-input')
    input.type = 'text'
    input.value = raw
    input.placeholder = 'auto'
    input.addEventListener('change', function () {
      applyStyle(ctrl.prop, input.value || '')
    })
    wrap.appendChild(input)
  }

  function buildShadow(wrap, ctrl) {
    var raw = cs(state.selected, ctrl.prop)
    var s = parseShadow(raw)
    var subs = [
      { key: 'x', label: 'X', min: -50, max: 50 },
      { key: 'y', label: 'Y', min: -50, max: 50 },
      { key: 'blur', label: t('糊'), min: 0, max: 50 }
    ]
    if (ctrl.hasSpread) subs.push({ key: 'spread', label: t('展'), min: -20, max: 50 })

    function apply() { applyStyle(ctrl.prop, composeShadow(s, ctrl.hasSpread)) }

    subs.forEach(function (sc) {
      var row = el('div', PREFIX + '-ctrl-row')
      row.appendChild(el('span', PREFIX + '-shadow-label', { text: sc.label }))
      var slider = el('input', PREFIX + '-slider')
      slider.type = 'range'; slider.min = sc.min; slider.max = sc.max; slider.step = 1; slider.value = s[sc.key]
      var num = el('input', PREFIX + '-num')
      num.type = 'text'; num.value = Math.round(s[sc.key]) + 'px'
      slider.addEventListener('input', function () {
        s[sc.key] = parseFloat(slider.value); num.value = Math.round(s[sc.key]) + 'px'; apply()
      })
      num.addEventListener('change', function () {
        var v = parseFloat(num.value); if (!isNaN(v)) { s[sc.key] = v; slider.value = v; apply() }
      })
      row.appendChild(slider); row.appendChild(num)
      wrap.appendChild(row)
    })

    var colorRow = el('div', PREFIX + '-color-row')
    var cInput = el('input', PREFIX + '-color-input')
    cInput.type = 'color'; cInput.value = s.color === 'transparent' ? '#000000' : s.color
    var hInput = el('input', PREFIX + '-color-hex')
    hInput.type = 'text'; hInput.value = s.color
    cInput.addEventListener('input', function () { s.color = cInput.value; hInput.value = cInput.value; apply() })
    hInput.addEventListener('change', function () {
      if (/^#[0-9a-fA-F]{3,8}$/.test(hInput.value.trim())) { s.color = hInput.value.trim(); cInput.value = s.color.slice(0, 7); apply() }
    })
    colorRow.appendChild(cInput); colorRow.appendChild(hInput)
    wrap.appendChild(colorRow)
  }

  function buildCompoundSlider(wrap, ctrl) {
    var inline = state.selected.style[ctrl.prop] || ''
    var fnVal = parseCSSFn(inline, ctrl.subFn)
    var val = fnVal !== null ? parseFloat(fnVal) : ctrl.defaultVal
    if (isNaN(val)) val = ctrl.defaultVal

    var row = el('div', PREFIX + '-ctrl-row')
    var slider = el('input', PREFIX + '-slider')
    slider.type = 'range'; slider.min = ctrl.min; slider.max = ctrl.max; slider.step = ctrl.step; slider.value = val
    var num = el('input', PREFIX + '-num')
    num.type = 'text'; num.value = round(val) + (ctrl.unit || '')

    function apply(v) {
      var cur = state.selected.style[ctrl.prop] || ''
      var valStr = ctrl.unit ? v + ctrl.unit : String(v)
      applyStyle(ctrl.prop, setCSSFn(cur, ctrl.subFn, valStr))
    }
    slider.addEventListener('input', function () {
      var v = parseFloat(slider.value); num.value = round(v) + (ctrl.unit || ''); apply(v)
    })
    num.addEventListener('change', function () {
      var v = parseFloat(num.value); if (!isNaN(v)) { slider.value = v; apply(v) }
    })
    row.appendChild(slider); row.appendChild(num)
    wrap.appendChild(row)
  }

  // ========== Style Application ==========

  function applyStyle(prop, value) {
    if (!state.selected) return
    pushHistory('style')
    state.selected.style[prop] = value
    updateSelOverlay()
  }

  function applyAttribute(target, attr, value) {
    if (!target || isVE(target)) return
    pushHistory('attribute')
    if (value !== '') target.setAttribute(attr, value)
    else target.removeAttribute(attr)
    updateSelOverlay()
    showToast(t('属性已更新'))
  }

  function applyTextContent(target, value) {
    if (!target || isVE(target)) return
    pushHistory('content')
    target.textContent = value
    updateSelOverlay()
    showToast(t('文字已更新'))
  }

  function copyBlockHTML(block) {
    if (!block) return
    finishTextEdit()
    var clone = block.cloneNode(true)
    cleanEditorArtifacts(clone)
    var html = clone.outerHTML
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(html).then(
        function () { showToast(t('已复制区块 HTML')) },
        function () { fallbackCopy(html) }
      )
    } else { fallbackCopy(html) }
  }

  function moveBlock(block, dir) {
    var sibling = movableSibling(block, dir)
    if (!block || !sibling || !block.parentNode) return
    pushHistory('block-move')
    if (dir < 0) block.parentNode.insertBefore(block, sibling)
    else block.parentNode.insertBefore(sibling, block)
    refreshPages()
    selectElement(block)
    updatePagerState()
    showToast(dir < 0 ? t('区块已上移') : t('区块已下移'))
  }

  function deleteBlock(block) {
    if (!block || !block.parentNode) return
    if (!window.confirm(t('删除当前区块？可用撤销恢复。'))) return
    pushHistory('block-delete')
    removeNode(block)
    refreshPages()
    deselectElement()
    updatePagerState()
    showToast(t('区块已删除'))
  }

  function pushHistory(reason) {
    if (state.restoring) return
    state.history.push({ html: exportHTML(), reason: reason || 'change' })
    if (state.history.length > 30) state.history.shift()
    state.future = []
    updateToolbarState()
  }

  function restoreHTML(html) {
    state.restoring = true
    html = withEditorScript(html)
    document.open()
    document.write(html)
    document.close()
  }

  function getEditorSrc() {
    var script = document.querySelector('script[data-ve][src]') || document.querySelector('script[src*="editor.js"]')
    if (script && script.src) return script.src
    return new URL('editor.js', window.location.href).href
  }

  function withEditorScript(html) {
    var script = '<script src="' + getEditorSrc() + '" data-ve="1"><\/script>'
    if (html.indexOf('</body>') !== -1) return html.replace('</body>', script + '</body>')
    if (html.indexOf('</html>') !== -1) return html.replace('</html>', script + '</html>')
    return html + script
  }

  function undo() {
    if (!state.history.length) {
      showToast(t('没有可撤销的操作'))
      return
    }
    var item = state.history.pop()
    state.future.push({ html: exportHTML(), reason: 'redo' })
    if (state.future.length > 30) state.future.shift()
    try {
      sessionStorage.setItem(PREFIX + '-history', JSON.stringify(state.history))
      sessionStorage.setItem(PREFIX + '-future', JSON.stringify(state.future))
      sessionStorage.setItem(PREFIX + '-auto-edit', '1')
    } catch (e) {}
    restoreHTML(item.html)
  }

  function redo() {
    if (!state.future.length) {
      showToast(t('没有可复原的操作'))
      return
    }
    var item = state.future.pop()
    state.history.push({ html: exportHTML(), reason: 'undo' })
    if (state.history.length > 30) state.history.shift()
    try {
      sessionStorage.setItem(PREFIX + '-history', JSON.stringify(state.history))
      sessionStorage.setItem(PREFIX + '-future', JSON.stringify(state.future))
      sessionStorage.setItem(PREFIX + '-auto-edit', '1')
    } catch (e) {}
    restoreHTML(item.html)
  }

  function updateToolbarState() {
    if (dom.undoBtn) dom.undoBtn.disabled = state.history.length === 0
    if (dom.redoBtn) dom.redoBtn.disabled = state.future.length === 0
    if (dom.textBtn) dom.textBtn.classList.toggle('active', state.textFlow)
    if (dom.dragBtn) dom.dragBtn.classList.toggle('active', state.dragMode)
    if (dom.layoutBtn) {
      dom.layoutBtn.classList.toggle('active', state.layoutOpen)
      dom.layoutBtn.disabled = false
    }
    if (dom.panel) dom.panel.classList.toggle('visible', !!(state.active && state.layoutOpen))
  }

  function toggleLayoutPanel() {
    if (!state.active) return
    state.layoutOpen = !state.layoutOpen
    updateToolbarState()
    if (state.layoutOpen) renderPanel()
  }

  function toggleTextEdit() {
    if (!state.active) return
    state.textFlow = !state.textFlow
    if (state.textFlow && state.dragMode) {
      // Text edit and drag mode are mutually exclusive.
      state.dragMode = false
      if (state.dragging) cancelDrag()
      document.body.removeAttribute('data-ve-drag-mode')
    }
    updateToolbarState()
    if (state.textFlow && state.selected && isTextEditable(state.selected)) {
      startTextEdit()
      return
    }
    if (!state.textFlow && state.textEditing) finishTextEdit()
    showToast(state.textFlow ? t('文字编辑已开启') : t('文字编辑已关闭'))
  }

  function toggleDragMode() {
    if (!state.active) return
    state.dragMode = !state.dragMode
    if (state.dragMode) {
      // Mutually exclusive with text editing.
      if (state.textFlow) state.textFlow = false
      if (state.textEditing) finishTextEdit()
      document.body.setAttribute('data-ve-drag-mode', '1')
    } else {
      if (state.dragging) cancelDrag()
      document.body.removeAttribute('data-ve-drag-mode')
    }
    updateToolbarState()
    showToast(state.dragMode ? t('拖拽模式已开启') : t('拖拽模式已关闭'))
  }

  function isTextEditable(target) {
    if (!target || isVE(target)) return false
    var tag = target.tagName ? target.tagName.toLowerCase() : ''
    return ['script', 'style', 'html', 'head', 'body', 'img', 'video', 'audio', 'canvas', 'svg', 'iframe'].indexOf(tag) === -1
  }

  function startTextEdit(target) {
    target = target || state.selected
    if (!isTextEditable(target)) {
      showToast(t('这个元素不适合直接编辑文字'))
      return
    }
    if (state.textEditing === target) return
    if (state.textEditing) finishTextEdit()
    state.selected = target
    pushHistory('text')
    state.textEditing = target
    if (!target.hasAttribute('data-ve-prev-contenteditable')) {
      target.setAttribute('data-ve-prev-contenteditable', target.hasAttribute('contenteditable') ? target.getAttribute('contenteditable') : '__ve_absent')
    }
    target.setAttribute('contenteditable', 'true')
    target.setAttribute('data-ve-editing', '1')
    target.focus()
    placeCaretAtEnd(target)
    hideOv(dom.hoverOv)
    updateSelOverlay()
    showToast(t('正在编辑文字 · 完成后点页面空白处或按 Esc'))
  }

  function finishTextEdit() {
    var target = state.textEditing
    if (!target) return
    restoreContenteditable(target)
    target.removeAttribute('data-ve-editing')
    target.removeAttribute('data-ve-prev-contenteditable')
    state.textEditing = null
    if (state.selected === target) updateSelOverlay()
    showToast(t('文字已更新'))
  }

  function placeCaretAtEnd(target) {
    if (!target || !window.getSelection || !document.createRange) return
    var range = document.createRange()
    range.selectNodeContents(target)
    range.collapse(false)
    var sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }

  function restoreContenteditable(node) {
    if (!node || !node.hasAttribute('data-ve-prev-contenteditable')) {
      if (node) node.removeAttribute('contenteditable')
      return
    }
    var prev = node.getAttribute('data-ve-prev-contenteditable')
    if (prev === '__ve_absent') node.removeAttribute('contenteditable')
    else node.setAttribute('contenteditable', prev)
  }

  function reloadPage() {
    if (confirm(t('重新载入会放弃未复制/保存的修改，确定继续吗？'))) {
      window.location.reload()
    }
  }

  // ========== Page Navigation ==========

  function isVisiblePageCandidate(el) {
    if (!el || isVE(el)) return false
    var r = el.getBoundingClientRect()
    var style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    return r.width >= window.innerWidth * 0.45 && r.height >= window.innerHeight * 0.45
  }

  function isExplicitPageNode(el) {
    if (!el || isVE(el)) return false
    var tag = el.tagName ? el.tagName.toLowerCase() : ''
    var id = (el.id || '').toLowerCase()
    var cls = typeof el.className === 'string' ? el.className.toLowerCase() : ''
    var role = (el.getAttribute && (el.getAttribute('role') || '').toLowerCase()) || ''
    var aria = (el.getAttribute && (el.getAttribute('aria-label') || '').toLowerCase()) || ''
    return el.hasAttribute && (
      el.hasAttribute('data-page') ||
      el.hasAttribute('data-page-number') ||
      el.hasAttribute('data-page-no') ||
      el.hasAttribute('data-slide') ||
      el.hasAttribute('data-slide-index') ||
      el.hasAttribute('data-slide-number') ||
      /\b(page|slide|ppt|deck-page|presentation-page)\b/.test(cls) ||
      /(^|[-_])(page|slide|ppt)([-_]|$|\d)/.test(cls) ||
      /(^|[-_])(page|slide|ppt)([-_]|$|\d)/.test(id) ||
      tag === 'section' ||
      role === 'document' ||
      role === 'group' && /page|slide|页|幻灯片/.test(aria)
    )
  }

  function isScrollableCandidate(el) {
    if (!el || isVE(el) || el === document.body || el === document.documentElement) return false
    var r = el.getBoundingClientRect()
    if (r.width < 180 || r.height < 180) return false
    var style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    var overflowY = style.overflowY
    var overflowX = style.overflowX
    var canScrollY = el.scrollHeight > el.clientHeight + 40 && overflowY !== 'hidden'
    var canScrollX = el.scrollWidth > el.clientWidth + 40 && overflowX !== 'hidden'
    return canScrollY || canScrollX
  }

  function findScrollTarget() {
    var best = null
    var bestArea = 0
    var nodes = document.querySelectorAll('body *')
    each(nodes, function (node) {
      if (!isScrollableCandidate(node)) return
      var r = node.getBoundingClientRect()
      var area = r.width * r.height
      if (area > bestArea) {
        best = node
        bestArea = area
      }
    })
    return best
  }

  function uniqueByPosition(items) {
    var out = []
    items.sort(function (a, b) { return (a.y || 0) - (b.y || 0) || a.x - b.x })
    items.forEach(function (item) {
      var prev = out[out.length - 1]
      if (!prev || Math.abs(prev.x - item.x) > 80 || Math.abs((prev.y || 0) - (item.y || 0)) > 80) out.push(item)
    })
    return out
  }

  function pagePos(node) {
    var r = node.getBoundingClientRect()
    var scroller = closestScroller(node)
    var sr = scroller ? scroller.getBoundingClientRect() : null
    return {
      node: node,
      scroller: scroller,
      x: scroller ? r.left - sr.left + scroller.scrollLeft : r.left + window.pageXOffset,
      y: scroller ? r.top - sr.top + scroller.scrollTop : r.top + window.pageYOffset,
      explicitIndex: parsePageIndex(node)
    }
  }

  function parsePageIndex(node) {
    var raw = node.getAttribute('data-i') || node.getAttribute('data-index') ||
      node.getAttribute('data-page') || node.getAttribute('data-page-number') ||
      node.getAttribute('data-slide') || node.getAttribute('data-slide-index') ||
      node.getAttribute('data-slide-number')
    var n = parseInt(raw, 10)
    return isNaN(n) ? null : n
  }

  function markStackedPages(pages) {
    if (pages.length < 2) return pages
    var first = pages[0]
    var visuallyStacked = pages.every(function (page) {
      return Math.abs(page.x - first.x) < 8 && Math.abs((page.y || 0) - (first.y || 0)) < 8
    })
    var firstNode = first.node
    var firstStyle = firstNode && getComputedStyle(firstNode)
    var layoutStacked = firstNode && /^(absolute|fixed)$/.test(firstStyle.position) && pages.every(function (page) {
      var node = page.node
      if (!node || node.parentElement !== firstNode.parentElement) return false
      var style = getComputedStyle(node)
      return /^(absolute|fixed)$/.test(style.position) &&
        node.offsetParent === firstNode.offsetParent &&
        Math.abs(node.offsetLeft - firstNode.offsetLeft) < 8 &&
        Math.abs(node.offsetTop - firstNode.offsetTop) < 8
    })
    if (visuallyStacked || layoutStacked) pages.forEach(function (page) { page.stacked = true })
    return pages
  }

  function setPageMode(mode, pages) {
    state.pageMode = mode
    pages.forEach(function (page) { page.mode = mode })
    return pages
  }

  function closestScroller(node) {
    var cur = node.parentElement
    while (cur && cur !== document.body && cur !== document.documentElement) {
      if (isScrollableCandidate(cur)) return cur
      cur = cur.parentElement
    }
    return null
  }

  function collectExplicitPageNodes() {
    var selectors = [
      '[data-page]', '[data-page-number]', '[data-page-no]',
      '[data-slide]', '[data-slide-index]', '[data-slide-number]',
      '[id*="page"]', '[id*="Page"]', '[id*="slide"]', '[id*="Slide"]', '[id*="ppt"]',
      '[class*="page"]', '[class*="Page"]', '[class*="slide"]', '[class*="Slide"]', '[class*="ppt"]',
      'section'
    ].join(',')

    var nodes = Array.prototype.slice.call(document.querySelectorAll(selectors))
      .filter(function (node) { return isExplicitPageNode(node) && isVisiblePageCandidate(node) })

    return nodes.filter(function (node) {
      return !nodes.some(function (other) { return other !== node && node.contains(other) && isVisiblePageCandidate(other) })
    })
  }

  function sortPages(pages) {
    pages.sort(function (a, b) {
      if (a.explicitIndex !== null && b.explicitIndex !== null) return a.explicitIndex - b.explicitIndex
      return (a.y || 0) - (b.y || 0) || a.x - b.x
    })
    return pages
  }

  function detectSlidePages() {
    var pages = markStackedPages(sortPages(collectExplicitPageNodes().map(pagePos)))
    if (pages.length > 1 && pages.every(function (page) { return page.stacked })) return setPageMode('slide', pages)
    return []
  }

  function detectExplicitPages() {
    var pages = sortPages(collectExplicitPageNodes().map(pagePos))
    if (pages.length > 1) return setPageMode('element', pages)
    return pages
  }

  function hasActivePageState(node) {
    if (!node || !node.classList) return false
    return node.classList.contains('active') ||
      node.classList.contains('current') ||
      node.classList.contains('is-active')
  }

  function shouldPreferRuntimePages(runtimePages) {
    var explicitNodes = collectExplicitPageNodes()
    if (!explicitNodes.length) return true
    if (runtimePages.length > explicitNodes.length) return true
    return explicitNodes.some(hasActivePageState)
  }

  function detectActiveRuntimePages() {
    var explicitNodes = collectExplicitPageNodes()
    if (explicitNodes.length < 2 || !explicitNodes.some(hasActivePageState)) return []
    return setPageMode('runtime', sortPages(explicitNodes.map(pagePos)))
  }

  function sizeKey(item) {
    var w = Math.round(item.rect.width / 40) * 40
    var h = Math.round(item.rect.height / 40) * 40
    return w + 'x' + h
  }

  function collectRepeatedCandidates(rootNode, viewportWidth, viewportHeight) {
    var nodes = Array.prototype.slice.call(rootNode.querySelectorAll ? rootNode.querySelectorAll('*') : [])
    return nodes.filter(function (node) {
      if (isVE(node)) return false
      var r = node.getBoundingClientRect()
      var style = getComputedStyle(node)
      if (style.display === 'none' || style.visibility === 'hidden') return false
      if (r.width < Math.max(140, viewportWidth * 0.22)) return false
      if (r.height < Math.max(100, viewportHeight * 0.12)) return false
      if (r.width * r.height < viewportWidth * viewportHeight * 0.08) return false
      return true
    }).map(function (node) {
      var r = node.getBoundingClientRect()
      return { node: node, rect: r, key: null }
    })
  }

  function removeAncestorCandidates(items) {
    return items.filter(function (item) {
      return !items.some(function (other) {
        return other !== item && item.node.contains(other.node) &&
          other.rect.width >= item.rect.width * 0.55 &&
          other.rect.height >= item.rect.height * 0.55
      })
    })
  }

  function detectRepeatedPages() {
    var scrollTarget = findScrollTarget()
    var contexts = []
    if (scrollTarget) contexts.push(scrollTarget)
    contexts.push(document.body)

    var best = []
    contexts.forEach(function (ctx) {
      var viewportWidth = ctx === document.body ? window.innerWidth : ctx.clientWidth
      var viewportHeight = ctx === document.body ? window.innerHeight : ctx.clientHeight
      var candidates = removeAncestorCandidates(collectRepeatedCandidates(ctx, viewportWidth, viewportHeight))
      var groups = {}
      candidates.forEach(function (item) {
        var key = sizeKey(item)
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      })
      Object.keys(groups).forEach(function (key) {
        var group = groups[key]
        if (group.length < 3) return
        group.sort(function (a, b) {
          return a.rect.top - b.rect.top || a.rect.left - b.rect.left
        })
        if (group.length > best.length) best = group
      })
    })

    return setPageMode('element', uniqueByPosition(best.map(function (item) { return pagePos(item.node) })))
  }

  function parsePageCounterText(text) {
    var m = String(text || '').match(/(\d+)\s*[\/／]\s*(\d+)/)
    if (!m) return null
    var current = parseInt(m[1], 10)
    var total = parseInt(m[2], 10)
    if (!current || !total || total < 2 || current > total || total > 500) return null
    return { current: current, total: total }
  }

  function readRuntimeCounterNode(node, allowGeneric) {
    if (!node || isVE(node)) return null
    var text = (node.textContent || '').trim()
    if (!text || text.length > 40) return null
    var parsed = parsePageCounterText(text)
    if (!parsed) return null
    var style = getComputedStyle(node)
    if (style.display === 'none' || style.visibility === 'hidden') return null
    var rect = node.getBoundingClientRect()
    if (rect.width < 6 || rect.height < 6) return null
    if (!allowGeneric) return { node: node, parsed: parsed }

    var idClass = ((node.id || '') + ' ' + (typeof node.className === 'string' ? node.className : '')).toLowerCase()
    var aria = ((node.getAttribute && (node.getAttribute('aria-label') || '')) || '').toLowerCase()
    var nearEdge = rect.top < 120 || rect.left < 160 || window.innerWidth - rect.right < 180 || window.innerHeight - rect.bottom < 140
    var compact = !node.children || node.children.length <= 2
    if (/page|pager|pageno|slide|counter|num|no|页|幻灯片/.test(idClass + ' ' + aria)) return { node: node, parsed: parsed }
    if (/^(fixed|sticky|absolute)$/.test(style.position)) return { node: node, parsed: parsed }
    if (compact && nearEdge) return { node: node, parsed: parsed }
    return null
  }

  function findRuntimeCounter(nodes, allowGeneric) {
    for (var i = 0; i < nodes.length; i++) {
      var found = readRuntimeCounterNode(nodes[i], allowGeneric)
      if (found) return found
    }
    return null
  }

  function detectRuntimePages() {
    var selectors = [
      '.page-num', '.pageNum', '#pageNum',
      '.pg', '#pg', '.pager', '#pager',
      '[class*="page"]', '[id*="page"]',
      '[class*="Page"]', '[id*="Page"]'
    ].join(',')
    var nodes = Array.prototype.slice.call(document.querySelectorAll(selectors))
    var found = findRuntimeCounter(nodes, false)
    if (!found) {
      found = findRuntimeCounter(Array.prototype.slice.call(document.querySelectorAll('body *')), true)
    }
    if (!found) return []
    var pages = []
    for (var i = 0; i < found.parsed.total; i++) pages.push({ node: null, counter: found.node, x: 0, y: 0 })
    return setPageMode('runtime', pages)
  }

  function detectPages() {
    var pages = detectSlidePages()
    if (pages.length > 1) return pages

    var runtimePages = detectRuntimePages()
    if (runtimePages.length > 1 && shouldPreferRuntimePages(runtimePages)) return runtimePages

    pages = detectActiveRuntimePages()
    if (pages.length > 1) return pages

    pages = detectExplicitPages()
    if (pages.length > 1) return pages

    pages = detectRepeatedPages()
    if (pages.length > 1) return pages

    if (runtimePages.length > 1) return runtimePages

    var scrollTarget = findScrollTarget()
    var root = document.scrollingElement || document.documentElement
    var docWidth = Math.max(root.scrollWidth, document.body ? document.body.scrollWidth : 0, window.innerWidth)
    var docHeight = Math.max(root.scrollHeight, document.body ? document.body.scrollHeight : 0, window.innerHeight)
    var docPageCount = Math.max(Math.ceil(docWidth / window.innerWidth), Math.ceil(docHeight / window.innerHeight))
    var targetPageCount = scrollTarget ? Math.max(Math.ceil(scrollTarget.scrollWidth / scrollTarget.clientWidth), Math.ceil(scrollTarget.scrollHeight / scrollTarget.clientHeight)) : 0
    if (scrollTarget && targetPageCount <= docPageCount && docPageCount > 1) scrollTarget = null

    var viewportWidth = scrollTarget ? scrollTarget.clientWidth : window.innerWidth
    var viewportHeight = scrollTarget ? scrollTarget.clientHeight : window.innerHeight
    var totalWidth = scrollTarget ? scrollTarget.scrollWidth : docWidth
    var totalHeight = scrollTarget ? scrollTarget.scrollHeight : docHeight
    var horizontalCount = Math.ceil(totalWidth / viewportWidth)
    var verticalCount = Math.ceil(totalHeight / viewportHeight)
    var count = Math.max(1, horizontalCount, verticalCount)
    var useVertical = verticalCount >= horizontalCount
    pages = []
    for (var i = 0; i < count; i++) {
      pages.push({ node: null, scroller: scrollTarget, x: useVertical ? (scrollTarget ? scrollTarget.scrollLeft : window.pageXOffset) : i * viewportWidth, y: useVertical ? i * viewportHeight : (scrollTarget ? scrollTarget.scrollTop : window.pageYOffset) })
    }
    return setPageMode('scroll', pages)
  }

  function refreshPages() {
    state.pages = detectPages()
    updateCurrentPage()
    updatePagerState()
  }

  function updateCurrentPage() {
    if (!state.pages.length) {
      state.currentPage = 0
      return
    }
    if (state.pageMode === 'slide') {
      for (var i = 0; i < state.pages.length; i++) {
        var node = state.pages[i].node
        if (hasActivePageState(node)) {
          state.currentPage = i
          return
        }
      }
    }
    if (state.pageMode === 'runtime') {
      var counter = state.pages[0] && state.pages[0].counter
      var parsed = counter ? parsePageCounterText(counter.textContent) : null
      if (parsed) {
        state.currentPage = parsed.current - 1
        return
      }
      var activeIndex = getActiveRuntimePageIndex()
      if (activeIndex !== -1) {
        state.currentPage = activeIndex
        return
      }
    }
    var first = state.pages[0]
    var curX = first && first.scroller ? first.scroller.scrollLeft : window.pageXOffset
    var curY = first && first.scroller ? first.scroller.scrollTop : window.pageYOffset
    var best = 0
    var bestDist = Infinity
    state.pages.forEach(function (page, i) {
      var dist = Math.abs(page.x - curX) + Math.abs((page.y || 0) - curY)
      if (dist < bestDist) { best = i; bestDist = dist }
    })
    state.currentPage = best
  }

  function updatePagerState() {
    if (!dom.pageLabel) return
    var total = Math.max(1, state.pages.length)
    var usable = hasUsablePager()
    if (dom.pager) {
      dom.pager.classList.toggle('hidden', !usable)
      dom.pager.setAttribute('aria-hidden', usable ? 'false' : 'true')
    }
    if (!usable) {
      dom.pageLabel.textContent = ''
      if (dom.prevPageBtn) dom.prevPageBtn.disabled = true
      if (dom.nextPageBtn) dom.nextPageBtn.disabled = true
      return
    }
    dom.pageLabel.textContent = (state.currentPage + 1) + '/' + total
    if (dom.prevPageBtn) dom.prevPageBtn.disabled = total <= 1 || state.currentPage <= 0
    if (dom.nextPageBtn) dom.nextPageBtn.disabled = total <= 1 || state.currentPage >= total - 1
  }

  function hasUsablePager() {
    return state.pages.length > 1 && /^(slide|element|runtime|scroll)$/.test(state.pageMode)
  }

  function goPage(delta) {
    if (state.textEditing) finishTextEdit()
    refreshPages()
    if (!hasUsablePager()) return
    var total = state.pages.length
    if (!total) return
    var next = Math.max(0, Math.min(total - 1, state.currentPage + delta))
    if (next === state.currentPage) return
    deselectElement()
    var page = state.pages[next]
    if (state.pageMode === 'runtime') {
      activateRuntimePage(delta)
    } else if (state.pageMode === 'slide' && page.node) {
      activateStackedPage(next)
    } else if (page.node) {
      page.node.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' })
    } else if (page.scroller) {
      page.scroller.scrollTo({ left: page.x, top: page.y || 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ left: page.x, top: page.y || 0, behavior: 'smooth' })
    }
    state.currentPage = next
    updatePagerState()
    setTimeout(function () { updateCurrentPage(); updatePagerState(); onScrollResize() }, state.pageMode === 'runtime' ? 650 : 350)
  }

  function activateRuntimePage(delta) {
    var key = delta > 0 ? 'ArrowRight' : 'ArrowLeft'
    var event = new KeyboardEvent('keydown', {
      key: key,
      code: key,
      bubbles: true,
      cancelable: true
    })
    document.dispatchEvent(event)
  }

  function activateStackedPage(index) {
    if (typeof window.goTo === 'function') {
      try { window.goTo(index) } catch (e) {}
    }

    if (getActiveStackedPageIndex() !== index) manuallyActivateStackedPage(index)
    syncStackedPageChrome(index)
  }

  function getActiveStackedPageIndex() {
    for (var i = 0; i < state.pages.length; i++) {
      var node = state.pages[i].node
      if (hasActivePageState(node)) return i
    }
    return -1
  }

  function getActiveRuntimePageIndex() {
    for (var i = 0; i < state.pages.length; i++) {
      if (hasActivePageState(state.pages[i].node)) return i
    }
    return -1
  }

  function manuallyActivateStackedPage(index) {
    state.pages.forEach(function (page, i) {
      var node = page.node
      if (!node || !node.classList) return
      if (i === index) {
        node.classList.add('active')
        node.classList.remove('prev')
      } else if (i < index) {
        node.classList.remove('active')
        node.classList.add('prev')
      } else {
        node.classList.remove('active')
        node.classList.remove('prev')
      }
    })
  }

  function syncStackedPageChrome(index) {
    var total = state.pages.length
    var prev = document.getElementById('prevBtn')
    var next = document.getElementById('nextBtn')
    var pageNum = document.getElementById('pageNum')
    if (prev) prev.disabled = index === 0
    if (next) next.disabled = index === total - 1
    if (pageNum) pageNum.textContent = (index + 1) + ' / ' + total
    each(document.querySelectorAll('.dot'), function (dot, i) {
      if (i === index) dot.classList.add('active')
      else dot.classList.remove('active')
    })
  }

  // ========== Overlay Positioning ==========

  function positionOv(ov, target) {
    var r = target.getBoundingClientRect()
    ov.style.display = 'block'
    ov.style.top = r.top + 'px'; ov.style.left = r.left + 'px'
    ov.style.width = r.width + 'px'; ov.style.height = r.height + 'px'
    var tag = ov.querySelector('.' + PREFIX + '-ov-tag')
    if (tag) {
      var label = target.tagName.toLowerCase()
      if (target.className && typeof target.className === 'string') {
        var c = target.className.split(/\s+/).filter(function (s) { return s && !hasPrefix(s, PREFIX) })[0]
        if (c) label += '.' + c
      }
      tag.textContent = label
    }
  }

  function hideOv(ov) { ov.style.display = 'none' }
  function updateSelOverlay() { if (state.selected) positionOv(dom.selOv, state.selected) }

  // ========== Element Selection ==========

  function onMouseMove(e) {
    if (!state.active) return
    if (state.textEditing) return
    if (state.dragCandidate && !state.dragging) {
      var dx = e.clientX - state.dragCandidate.x
      var dy = e.clientY - state.dragCandidate.y
      if (Math.sqrt(dx * dx + dy * dy) > 6) startDrag(state.dragCandidate.element, e)
    }
    if (state.dragging) { updateDropTarget(e); return }
    var t = e.target
    if (isVE(t)) { hideOv(dom.hoverOv); state.hovered = null; return }
    if (t === state.hovered) return
    state.hovered = t
    positionOv(dom.hoverOv, t)
  }

  function onMouseDown(e) {
    if (!state.active) return
    if (isVE(e.target)) return
    if (state.textEditing && (e.target === state.textEditing || state.textEditing.contains(e.target))) return
    if (e.ctrlKey || e.altKey) return // Ctrl/Alt+click passes through to page
    // Drag mode: any mousedown on a draggable element starts a drag candidate.
    if (state.dragMode && isDraggableElement(e.target)) {
      e.preventDefault(); e.stopPropagation()
      selectElement(e.target)
      state.dragCandidate = { element: e.target, x: e.clientX, y: e.clientY }
      return
    }
    var textTarget = secondClickTextTarget(e.target)
    if (textTarget) {
      e.preventDefault(); e.stopPropagation()
      startTextEdit(textTarget)
      return
    }
    e.preventDefault(); e.stopPropagation()
    selectElement(e.target)
  }

  function onMouseUp(e) {
    if (state.dragging) {
      finishDrag(e)
    }
    state.dragCandidate = null
  }

  // ========== Drag to Reorder ==========

  function isDraggableElement(node) {
    if (!node || !node.tagName) return false
    var tag = node.tagName.toLowerCase()
    if (['html', 'head', 'body', 'script', 'style'].indexOf(tag) !== -1) return false
    if (isVE(node)) return false
    if (!node.parentNode) return false
    return true
  }

  function startDrag(element, e) {
    state.dragging = element
    element.setAttribute('data-ve-dragging', '1')
    document.body.setAttribute('data-ve-drag-active', '1')
    hideOv(dom.hoverOv)
    updateDropTarget(e)
  }

  function updateDropTarget(e) {
    if (!state.dragging) return
    // Temporarily hide the dragging element so elementFromPoint sees what's behind.
    var prevPe = state.dragging.style.pointerEvents
    state.dragging.style.pointerEvents = 'none'
    var below = document.elementFromPoint(e.clientX, e.clientY)
    state.dragging.style.pointerEvents = prevPe
    if (!below || isVE(below)) {
      // Cursor is outside the page. Use sibling fallback so a drop indicator
      // is still shown somewhere reasonable.
      siblingFallback(e); return
    }
    // If cursor is on the dragging element or its descendants, fall back to
    // sibling-position logic so users can still see where it would land.
    if (below === state.dragging || state.dragging.contains(below)) {
      siblingFallback(e); return
    }
    // Walk up if below is inside dragging (defensive — shouldn't usually hit).
    var target = below
    while (target && (target === state.dragging || state.dragging.contains(target))) {
      target = target.parentNode
    }
    if (!target || !target.tagName) { siblingFallback(e); return }
    var tag = target.tagName.toLowerCase()
    if (['html', 'head', 'body'].indexOf(tag) !== -1 || isVE(target)) {
      siblingFallback(e); return
    }
    setDropTarget(target, e)
  }

  function setDropTarget(target, e) {
    var rect = target.getBoundingClientRect()
    // Detect orientation: if siblings are arranged in a row (similar tops),
    // use x to decide before/after; otherwise default to y.
    var parent = target.parentNode
    var horizontal = false
    if (parent) {
      var sibs = parent.children
      if (sibs && sibs.length > 1) {
        var first = sibs[0].getBoundingClientRect()
        var second = sibs[1].getBoundingClientRect()
        if (Math.abs(first.top - second.top) < 10 && Math.abs(first.left - second.left) > 10) {
          horizontal = true
        }
      }
    }
    var before
    if (horizontal) {
      before = e.clientX < rect.left + rect.width / 2
    } else {
      before = e.clientY < rect.top + rect.height / 2
    }
    state.dropTarget = target
    state.dropBefore = before
    state.dropHorizontal = horizontal
    showDropIndicator(rect, before, horizontal)
  }

  function siblingFallback(e) {
    // When cursor is over the dragging element or off-page, find the closest
    // sibling within the dragging's parent and use it as a drop target hint.
    var dragging = state.dragging
    if (!dragging || !dragging.parentNode) { hideDropIndicator(); state.dropTarget = null; return }
    var parent = dragging.parentNode
    var children = []
    for (var i = 0; i < parent.children.length; i++) {
      var ch = parent.children[i]
      if (ch !== dragging && !isVE(ch)) children.push(ch)
    }
    if (!children.length) { hideDropIndicator(); state.dropTarget = null; return }
    var best = null
    var bestDist = Infinity
    for (var j = 0; j < children.length; j++) {
      var r = children[j].getBoundingClientRect()
      var cx = r.left + r.width / 2
      var cy = r.top + r.height / 2
      var dx = e.clientX - cx, dy = e.clientY - cy
      var d = dx * dx + dy * dy
      if (d < bestDist) { bestDist = d; best = children[j] }
    }
    if (!best) { hideDropIndicator(); state.dropTarget = null; return }
    setDropTarget(best, e)
  }

  function showDropIndicator(rect, before, horizontal) {
    dom.dropInd.style.display = 'block'
    if (horizontal) {
      dom.dropInd.className = PREFIX + '-drop-ind v'
      var left = before ? rect.left : rect.right
      dom.dropInd.style.left = (left - 1) + 'px'
      dom.dropInd.style.top = Math.max(0, rect.top - 2) + 'px'
      dom.dropInd.style.width = ''
      dom.dropInd.style.height = (rect.height + 4) + 'px'
    } else {
      dom.dropInd.className = PREFIX + '-drop-ind h'
      var top = before ? rect.top : rect.bottom
      dom.dropInd.style.left = Math.max(0, rect.left - 2) + 'px'
      dom.dropInd.style.top = (top - 1) + 'px'
      dom.dropInd.style.width = (rect.width + 4) + 'px'
      dom.dropInd.style.height = ''
    }
  }

  function hideDropIndicator() {
    dom.dropInd.style.display = 'none'
  }

  function finishDrag(e) {
    var dragging = state.dragging
    var target = state.dropTarget
    var before = state.dropBefore
    // Clear drag state
    dragging.removeAttribute('data-ve-dragging')
    document.body.removeAttribute('data-ve-drag-active')
    hideDropIndicator()
    state.dragging = null
    state.dropTarget = null
    state.dragCandidate = null
    if (!target || !target.parentNode) { selectElement(dragging); return }
    if (dragging.contains(target)) {
      showToast(t('不能放到自己里面'))
      selectElement(dragging)
      return
    }
    // Don't move if it's already in the right position
    var nextSibling = before ? target : target.nextSibling
    if (dragging === target || dragging === nextSibling) {
      selectElement(dragging)
      return
    }
    pushHistory('drag-move')
    target.parentNode.insertBefore(dragging, nextSibling)
    selectElement(dragging)
    updateSelOverlay()
    showToast(t('元素已移动'))
  }

  function cancelDrag() {
    if (!state.dragging) return
    state.dragging.removeAttribute('data-ve-dragging')
    document.body.removeAttribute('data-ve-drag-active')
    hideDropIndicator()
    var dragging = state.dragging
    state.dragging = null
    state.dropTarget = null
    state.dragCandidate = null
    selectElement(dragging)
  }

  function onDoubleClickCapture(e) {
    if (!state.active) return
    if (isVE(e.target)) return
    if (state.textEditing && (e.target === state.textEditing || state.textEditing.contains(e.target))) return
    if (e.ctrlKey || e.altKey) return
    e.preventDefault(); e.stopPropagation()
    var textTarget = doubleClickTextTarget(e.target)
    selectElement(textTarget || e.target)
    state.layoutOpen = true
    state.textFlow = true
    updateToolbarState()
    renderPanel()
    if (textTarget) startTextEdit(textTarget)
  }

  function secondClickTextTarget(target) {
    if (!state.layoutOpen || !state.selected || !target) return null
    var selected = state.selected
    if (target !== selected && !selected.contains(target)) return null
    if (!isTextEditable(selected)) return null
    var tag = selected.tagName ? selected.tagName.toLowerCase() : ''
    if (/^(img|input|textarea|select|option|video|audio|canvas|svg|iframe)$/.test(tag)) return null
    if (/^(a|button)$/.test(tag) || isTextContentTarget(selected) || isPlainTextTarget(selected)) return selected
    return null
  }

  function doubleClickTextTarget(target) {
    if (!target || isVE(target)) return null
    if (target.tagName && /^(a|button)$/i.test(target.tagName)) return target
    if (isTextContentTarget(target) || isPlainTextTarget(target)) return target
    if (!target.closest) return null
    var nested = target.closest('a,button,h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,label,span,strong,em,small')
    if (!nested || isVE(nested)) return null
    if (nested.tagName && /^(a|button)$/i.test(nested.tagName)) return nested
    return isTextContentTarget(nested) || isPlainTextTarget(nested) ? nested : null
  }

  function onClickCapture(e) {
    if (state.textEditing && (e.target === state.textEditing || state.textEditing.contains(e.target))) return
    if (state.active && !isVE(e.target) && !e.ctrlKey && !e.altKey) { e.preventDefault(); e.stopPropagation() }
  }

  function selectElement(target) {
    if (state.textEditing && target !== state.textEditing && !state.textEditing.contains(target)) finishTextEdit()
    state.selected = target
    positionOv(dom.selOv, target)
    hideOv(dom.hoverOv)
    dom.breadcrumb.textContent = elPath(target)
    updateToolbarState()
    if (state.layoutOpen) renderPanel()
    if (state.textFlow && isTextEditable(target)) startTextEdit(target)
  }

  function deselectElement() {
    state.selected = null
    hideOv(dom.selOv)
    dom.breadcrumb.textContent = ''
    updateToolbarState()
    if (state.layoutOpen) renderPanel()
  }

  function onScrollResize() {
    if (state.hovered && dom.hoverOv.style.display !== 'none') positionOv(dom.hoverOv, state.hovered)
    if (state.selected && dom.selOv.style.display !== 'none') positionOv(dom.selOv, state.selected)
    if (state.active) { updateCurrentPage(); updatePagerState(); applyToolbarPos() }
  }

  // ========== Toolbar Position ==========
  // The toolbar is a floating pill: auto-centered at the top by default,
  // draggable by its grip handle, position remembered per tab.

  function loadToolbarPos() {
    try {
      var raw = sessionStorage.getItem(PREFIX + '-toolbar-pos')
      if (!raw) return null
      var pos = JSON.parse(raw)
      if (pos && typeof pos.left === 'number' && typeof pos.top === 'number') return pos
    } catch (e) {}
    return null
  }

  function saveToolbarPos(pos) {
    try {
      if (pos) sessionStorage.setItem(PREFIX + '-toolbar-pos', JSON.stringify(pos))
      else sessionStorage.removeItem(PREFIX + '-toolbar-pos')
    } catch (e) {}
  }

  function clampToolbarPos(left, top) {
    var rect = dom.toolbar.getBoundingClientRect()
    var margin = 8
    var maxLeft = Math.max(margin, window.innerWidth - rect.width - margin)
    var maxTop = Math.max(margin, window.innerHeight - rect.height - margin)
    return {
      left: Math.min(Math.max(left, margin), maxLeft),
      top: Math.min(Math.max(top, margin), maxTop)
    }
  }

  function applyToolbarPos() {
    if (!dom.toolbar || state.toolbarDragging) return
    if (state.toolbarPos) {
      var pos = clampToolbarPos(state.toolbarPos.left, state.toolbarPos.top)
      dom.toolbar.style.left = pos.left + 'px'
      dom.toolbar.style.top = pos.top + 'px'
    } else {
      dom.toolbar.style.top = '12px'
      var rect = dom.toolbar.getBoundingClientRect()
      dom.toolbar.style.left = Math.max(8, Math.round((window.innerWidth - rect.width) / 2)) + 'px'
    }
  }

  function resetToolbarPos() {
    state.toolbarPos = null
    saveToolbarPos(null)
    applyToolbarPos()
    showToast(t('工具栏位置已复位'))
  }

  function initToolbarDrag(handle) {
    var start = null
    function onDown(e) {
      if (e.button !== undefined && e.button !== 0) return
      var rect = dom.toolbar.getBoundingClientRect()
      start = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top, moved: false }
      e.preventDefault()
      e.stopPropagation()
      if (e.pointerId !== undefined && handle.setPointerCapture) {
        try { handle.setPointerCapture(e.pointerId) } catch (err) {}
      } else {
        document.addEventListener('mousemove', onMove, true)
        document.addEventListener('mouseup', onUp, true)
      }
    }
    function onMove(e) {
      if (!start) return
      var dx = e.clientX - start.x
      var dy = e.clientY - start.y
      if (!start.moved) {
        if (Math.abs(dx) + Math.abs(dy) < 3) return
        start.moved = true
        state.toolbarDragging = true
      }
      var pos = clampToolbarPos(start.left + dx, start.top + dy)
      dom.toolbar.style.left = pos.left + 'px'
      dom.toolbar.style.top = pos.top + 'px'
    }
    function onUp() {
      if (!start) return
      if (start.moved) {
        var rect = dom.toolbar.getBoundingClientRect()
        state.toolbarPos = { left: Math.round(rect.left), top: Math.round(rect.top) }
        saveToolbarPos(state.toolbarPos)
      }
      start = null
      state.toolbarDragging = false
      document.removeEventListener('mousemove', onMove, true)
      document.removeEventListener('mouseup', onUp, true)
    }
    if (window.PointerEvent) {
      handle.addEventListener('pointerdown', onDown)
      handle.addEventListener('pointermove', onMove)
      handle.addEventListener('pointerup', onUp)
      handle.addEventListener('pointercancel', onUp)
    } else {
      handle.addEventListener('mousedown', onDown)
    }
    handle.addEventListener('dblclick', function (e) {
      e.preventDefault()
      e.stopPropagation()
      resetToolbarPos()
    })
  }

  // ========== Panel Docking ==========
  // The style panel docks to the right by default. Dragging its header
  // across the viewport docks it to the left or right edge. Disabled on
  // small screens where the panel is a bottom sheet.

  function panelDockEnabled() {
    return window.innerWidth > 720
  }

  function loadPanelSide() {
    try {
      return sessionStorage.getItem(PREFIX + '-panel-side') === 'left' ? 'left' : null
    } catch (e) { return null }
  }

  function savePanelSide(side) {
    try {
      if (side === 'left') sessionStorage.setItem(PREFIX + '-panel-side', 'left')
      else sessionStorage.removeItem(PREFIX + '-panel-side')
    } catch (e) {}
  }

  function applyPanelSide() {
    if (!dom.panel) return
    dom.panel.classList.toggle('dock-left', state.panelSide === 'left')
  }

  function initPanelDrag() {
    var start = null
    function inTitle(node) {
      while (node && node !== dom.panel) {
        if (node.className && String(node.className).indexOf(PREFIX + '-panel-title') !== -1) return true
        node = node.parentNode
      }
      return false
    }
    function onDown(e) {
      if (!panelDockEnabled()) return
      if (e.button !== undefined && e.button !== 0) return
      if (!inTitle(e.target)) return
      var rect = dom.panel.getBoundingClientRect()
      start = { x: e.clientX, grabDX: e.clientX - rect.left, moved: false }
      e.preventDefault()
      if (e.pointerId !== undefined && dom.panel.setPointerCapture) {
        try { dom.panel.setPointerCapture(e.pointerId) } catch (err) {}
      } else {
        document.addEventListener('mousemove', onMove, true)
        document.addEventListener('mouseup', onUp, true)
      }
    }
    function onMove(e) {
      if (!start) return
      if (!start.moved) {
        if (Math.abs(e.clientX - start.x) < 4) return
        start.moved = true
      }
      var width = dom.panel.getBoundingClientRect().width
      var left = Math.min(Math.max(e.clientX - start.grabDX, 8), window.innerWidth - width - 8)
      dom.panel.style.left = left + 'px'
      dom.panel.style.right = 'auto'
    }
    function onUp() {
      if (!start) return
      if (start.moved) {
        var rect = dom.panel.getBoundingClientRect()
        var side = rect.left + rect.width / 2 < window.innerWidth / 2 ? 'left' : 'right'
        dom.panel.style.left = ''
        dom.panel.style.right = ''
        state.panelSide = side
        savePanelSide(side)
        applyPanelSide()
        showToast(side === 'left' ? t('面板已停靠左侧') : t('面板已停靠右侧'))
      }
      start = null
      document.removeEventListener('mousemove', onMove, true)
      document.removeEventListener('mouseup', onUp, true)
    }
    if (window.PointerEvent) {
      dom.panel.addEventListener('pointerdown', onDown)
      dom.panel.addEventListener('pointermove', onMove)
      dom.panel.addEventListener('pointerup', onUp)
      dom.panel.addEventListener('pointercancel', onUp)
    } else {
      dom.panel.addEventListener('mousedown', onDown)
    }
    dom.panel.addEventListener('dblclick', function (e) {
      if (!panelDockEnabled()) return
      // With pointer capture on dom.panel, clicks that started on the title
      // are retargeted to the panel itself, so accept that target too.
      if (e.target !== dom.panel && !inTitle(e.target)) return
      e.preventDefault()
      state.panelSide = 'right'
      savePanelSide(null)
      applyPanelSide()
      showToast(t('面板位置已复位'))
    })
  }

  // ========== Edit Mode ==========

  function toggleEdit() { if (state.active) exitEdit(); else enterEdit() }

  function enterEdit() {
    if (state.active) return
    state.active = true
    dom.toggle.classList.add('active')
    dom.toggle.innerHTML = ICON_X
    dom.toggle.title = t('退出编辑模式 (Alt+E)')
    dom.toolbar.classList.add('visible')
    state.layoutOpen = false
    refreshPages()
    updateToolbarState()
    applyToolbarPos()
    showToast(t('点击选中元素 · 双击文字直接编辑 · Ctrl 点击触发原页面'), 3000)
    document.addEventListener('mousemove', onMouseMove, true)
    document.addEventListener('mousedown', onMouseDown, true)
    document.addEventListener('mouseup', onMouseUp, true)
    document.addEventListener('click', onClickCapture, true)
    document.addEventListener('dblclick', onDoubleClickCapture, true)
    window.addEventListener('scroll', onScrollResize, true)
    window.addEventListener('resize', onScrollResize)
  }

  function exitEdit() {
    finishTextEdit()
    if (state.dragging) cancelDrag()
    document.body.removeAttribute('data-ve-drag-mode')
    state.active = false; state.selected = null; state.hovered = null; state.textFlow = false; state.dragMode = false
    dom.toggle.classList.remove('active')
    dom.toggle.innerHTML = ICON_EDIT
    dom.toggle.title = t('切换编辑模式 (Alt+E)')
    dom.toolbar.classList.remove('visible')
    dom.panel.classList.remove('visible')
    state.layoutOpen = false
    hideOv(dom.hoverOv); hideOv(dom.selOv)
    dom.breadcrumb.textContent = ''
    updateToolbarState()
    document.removeEventListener('mousemove', onMouseMove, true)
    document.removeEventListener('mousedown', onMouseDown, true)
    document.removeEventListener('mouseup', onMouseUp, true)
    document.removeEventListener('click', onClickCapture, true)
    document.removeEventListener('dblclick', onDoubleClickCapture, true)
    window.removeEventListener('scroll', onScrollResize, true)
    window.removeEventListener('resize', onScrollResize)
  }

  // ========== Export ==========

  function exportHTML() {
    var clone = document.documentElement.cloneNode(true)
    cleanEditorArtifacts(clone)
    return '<!DOCTYPE html>\n' + clone.outerHTML
  }

  function cleanEditorArtifacts(root) {
    var editorSrc = getEditorSrc()
    var rootEl = root.querySelector('#' + PREFIX + '-root')
    if (rootEl) rootEl.remove()
    each(root.querySelectorAll('.' + PREFIX + '-toggle'), removeNode)
    each(root.querySelectorAll('style[data-ve], script[data-ve]'), removeNode)
    each(root.querySelectorAll('script[src]'), function (script) {
      if (isEditorScript(script.getAttribute('src'), editorSrc)) removeNode(script)
    })
    each(root.querySelectorAll('[data-ve-editing], [data-ve-prev-contenteditable]'), function (el) {
      restoreContenteditable(el)
      el.removeAttribute('data-ve-editing')
      el.removeAttribute('data-ve-prev-contenteditable')
    })
  }

  function isEditorScript(src, editorSrc) {
    if (!src) return false
    var absolute
    try { absolute = new URL(src, window.location.href).href }
    catch (e) { absolute = src }
    return absolute === editorSrc
  }

  function copyHTML() {
    finishTextEdit()
    var html = exportHTML()
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(html).then(
        function () { showToast(t('已复制到剪贴板')) },
        function () { fallbackCopy(html) }
      )
    } else { fallbackCopy(html) }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea')
    ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'
    ta.setAttribute('readonly', '')
    document.body.appendChild(ta); ta.select()
    if (ta.setSelectionRange) ta.setSelectionRange(0, ta.value.length)
    try { document.execCommand('copy'); showToast(t('已复制到剪贴板')) }
    catch (e) { showToast(t('复制失败，请手动选择导出的 HTML')) }
    removeNode(ta)
  }

  function downloadHTML() {
    finishTextEdit()
    var html = exportHTML()
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    downloadBlob(blob, 'page-' + Date.now() + '.html', t('HTML 已保存'))
  }

  function downloadBlob(blob, filename, successText) {
    if (navigator.msSaveOrOpenBlob) {
      navigator.msSaveOrOpenBlob(blob, filename)
      showToast(successText || t('HTML 已保存'))
      return
    }
    if (!window.URL || !URL.createObjectURL) {
      showToast(t('当前浏览器不支持直接保存，请先复制 HTML'))
      return
    }
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a'); a.href = url
    a.download = filename
    a.setAttribute('data-ve-ui', '1')
    a.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0'
    document.body.appendChild(a)
    try {
      if ('download' in a) {
        a.click()
      } else {
        window.open(url, '_blank')
      }
    } catch (e) {
      window.location.href = url
    }
    setTimeout(function () {
      removeNode(a)
      URL.revokeObjectURL(url)
    }, 1000)
    showToast(successText || t('HTML 已保存'))
  }

  function goToPageIndex(index) {
    refreshPages()
    if (!state.pages.length) return
    index = Math.max(0, Math.min(state.pages.length - 1, index))
    var previous = state.currentPage
    var page = state.pages[index]
    deselectElement()
    if (state.pageMode === 'runtime') {
      var delta = index - previous
      var step = delta > 0 ? 1 : -1
      for (var i = 0; i < Math.abs(delta); i++) activateRuntimePage(step)
    } else if (state.pageMode === 'slide' && page.node) {
      activateStackedPage(index)
    } else if (page.node) {
      page.node.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'start' })
    } else if (page.scroller) {
      page.scroller.scrollTo({ left: page.x, top: page.y || 0, behavior: 'auto' })
    } else {
      window.scrollTo({ left: page.x, top: page.y || 0, behavior: 'auto' })
    }
    state.currentPage = index
    updatePagerState()
    onScrollResize()
  }

  // ========== Keyboard ==========

  function onKeyDown(e) {
    if (e.altKey && e.key.toLowerCase() === 'e') { e.preventDefault(); toggleEdit(); return }
    if (!state.active) return
    if (e.key === 'Escape') { e.preventDefault(); state.dragging ? cancelDrag() : (state.textEditing ? finishTextEdit() : (state.selected ? deselectElement() : exitEdit())); return }
    if (e.altKey && e.key.toLowerCase() === 't') { e.preventDefault(); toggleTextEdit(); return }
    if (e.altKey && e.key.toLowerCase() === 'd') { e.preventDefault(); toggleDragMode(); return }
    if (e.altKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return }
    if (e.altKey && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return }
    if (e.altKey && e.key === 'ArrowLeft' && hasUsablePager()) { e.preventDefault(); goPage(-1); return }
    if (e.altKey && e.key === 'ArrowRight' && hasUsablePager()) { e.preventDefault(); goPage(1); return }
    if (e.altKey && e.key.toLowerCase() === 'c') { e.preventDefault(); copyHTML(); return }
    if (e.altKey && e.key.toLowerCase() === 's') { e.preventDefault(); downloadHTML(); return }
  }

  // ========== Init ==========

  function init() {
    if (document.getElementById(PREFIX + '-root')) return
    injectCSS()
    createUI()
    state.toolbarPos = loadToolbarPos()
    state.panelSide = loadPanelSide() || 'right'
    applyPanelSide()
    try {
      var savedHistory = sessionStorage.getItem(PREFIX + '-history')
      if (savedHistory) state.history = JSON.parse(savedHistory) || []
      var savedFuture = sessionStorage.getItem(PREFIX + '-future')
      if (savedFuture) state.future = JSON.parse(savedFuture) || []
      sessionStorage.removeItem(PREFIX + '-history')
      sessionStorage.removeItem(PREFIX + '-future')
      if (sessionStorage.getItem(PREFIX + '-auto-edit') === '1') {
        sessionStorage.removeItem(PREFIX + '-auto-edit')
        setTimeout(enterEdit, 80)
      }
    } catch (e) {}
    updateToolbarState()
    document.addEventListener('keydown', onKeyDown)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
