/*
  Ai2Psd.jsx for Adobe Illustrator
  Description: This script may help to prepare vector paths to export from AI to PSD file. 
  Requirements: Adobe Illustrator CS6 and later
  Date: February, 2017
  Modification date: December, 2025
  Author: Sergey Osokin, email: hi@sergosokin.ru
  Thanks to Radmir Kashaev, https://github.com/rkashaev for help in creating version 1.0
            Alexander Ladygin (http://ladygin.pro) for help in creating version 2.3

  More info:
  EN https://medium.com/@creold/how-to-export-a-illustrator-file-into-a-vector-layered-photoshop-file-2dcc274abf66
  RU https://sergosokin.ru/blog/export-vector-ai-to-psd/

  Release notes:
  4.1 Fixed Adobe Illustrator issues. Minor improvements
  4.0 Added UI with batch export. Minor improvements
  3.1 Minor improvements
  3.0 Algorithm issues fixed. Added saving custom path names and RU localization
  2.3 Minor improvements
  2.2 Added timer & progress bar
  2.1 Fixed unlock and order of objects issue
  2.0 The script doesn't need to load the helper Action file
  1.3 Fixed a Overprint issue
  1.2 Fixed a performance issue
  1.1 After start the script unlocks visible layers & objects
  1.0 Initial version

  Donate (optional):
  If you find this script helpful, you can buy me a coffee
  - via Buymeacoffee: https://www.buymeacoffee.com/aiscripts
  - via CloudTips: https://pay.cloudtips.ru/p/b81d370e
  - via Donatty https://donatty.com/sergosokin
  - via DonatePay https://new.donatepay.ru/en/@osokin
  - via YooMoney https://yoomoney.ru/to/410011149615582

  NOTICE:
  Tested with Adobe Illustrator CC 2019-2026 (Mac/Win).
  This script is provided "as is" without warranty of any kind.
  Free to use, not for sale

  Released under the MIT license
  http://opensource.org/licenses/mit-license.php

  Check my other scripts: https://github.com/creold
*/

//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false); // Fix drag and drop a .jsx file
$.localize = true; // Enabling automatic localization

function main() {
  var SCRIPT = {
        name: 'Ai2Psd',
        version: 'v4.1'
      };

  var CFG = {
        aa: true, // Anti-Aliasing
        editTxt: true, // Editable text
        embedIcc: false, // Embed ICC profile
        isMac: /mac/i.test($.os),
        isRU: /ru/i.test($.locale),
        aiVers: parseFloat(app.version),
        uiScale: app.preferences.getRealPreference('UIPreferences/appScaleFactor'),
        actSet: 'Ai2Psd',
        actName: 'Make_Compound_Shape',
        actPath: Folder.myDocuments + '/Adobe Scripts/',
        mgns: [10, 15, 10, 10]
      };

  var LANG = {
        errApp: { en: 'Wrong application\nRun script from Adobe Illustrator',
                  ru: 'Неправильная программа\nЗапустите скрипт в Adobe Illustrator' },
        errVer: { en: 'Wrong app version\nSorry, script only works in Illustrator CS6 and later',
                  ru: 'Неподходящая версия\nСкрипт работает в Illustrator CS6 и выше' },
        errScale: { en: 'UI Scaling\nDue to scaling Preferences > User Interface > UI Scaling ' + 
                        'the Resolution dropdown list will not display correctly',
                  ru: 'UI Scaling\nИз-за масштабирования Preferences > User Interface > UI Scaling ' + 
                      'выпадающий список Resolution отобразится некорректно' },
        src: { en: 'Source', ru: 'Источник' },
        actDoc: { en: 'Active Document: ', ru: 'Текущий документ: ' },
        allDoc1: { en: 'All ', ru: 'Все ' },
        allDoc2: { en: ' open documents', ru: ' открытых документа' },
        noDoc: { en: 'No open documents', ru: 'Нет открытых документов' },
        fol: { en: 'From Folder:', ru: 'Из папки:' },
        selFol: { en: 'Select the source folder...', ru: 'Выберите папку...' },
        subfol: { en: 'Include Subfolders', ru: 'Включить подпапки' },
        sel: { en: 'Select', ru: 'Выбрать' },
        abs: { en: 'Artboards', ru: 'Артборды' },
        multiAbs: { en: 'Export Multiple Artboards', ru: 'Экспортировать отдельными артбордами' },
        allAbs: { en: 'All Artboards in a Document', ru: 'Все артборды документа' },
        actAb: { en: 'Active', ru: 'Активный' },
        range: { en: 'Range:', ru: 'Диапазон: ' },
        res: { en: 'Resolution, ppi', ru: 'Разрешение, ppi' },
        low: { en: 'Screen (72)', ru: 'Экранное (72)' },
        mid: { en: 'Medium (150)', ru: 'Среднее (150)' },
        high: { en: 'High (300)', ru: 'Высокое (300)' },
        other: { en: 'Other', ru: 'Другое' },
        rangeTip: { en: 'Range: 72-2400 ppi', ru: 'Диапазон: 72-2400 ppi' },
        model: { en: 'Color Space', ru: 'Цветовая модель' },
        docCol: { en: 'Doc color', ru: 'Документа' },
        of: { en: ' of ', ru: ' из ' },
        cancel: { en: 'Cancel', ru: 'Закрыть' },
        ok: { en: 'Export', ru: 'Экспортировать' },
        author: { en: 'Sergey Osokin', ru: 'Сергей Осокин' },
        link: { en: 'Visit GitHub', ru: 'Посетить GitHub' },
        warnObj: { en: 'Warning\nBitmaps and Graphs can cause errors when exporting them to PSD.',
                  ru: 'Предупреждение\nРастровые изображения и диаграммы могут вызвать ошибки при экспорте в PSD.' },
        hide: { en: 'You can hide them to avoid this.',
              ru: 'Вы можете скрыть их, чтобы избежать этого.' },
        agree: { en: 'Do you want to hide them?', ru: 'Хотите их скрыть?' },
        done: { en: 'Exporting process is complete\n'
              + 'Open documents have been changed. To restore the last save select File > Revert.\n\n'
              + 'Some layers in the PSD could get merged randomly. '
              + "In Illustrator there's still no reliable way to control it.\n\nWe tried!",
              ru: 'Экспорт завершен\n'
              + 'Открытые документы были изменены. Для восстановления последнего сохранения выберите Файл > Восстановить.\n\n'
              + 'Некоторые слои в PSD могут быть случайным образом слиты в один. '
              + 'В Illustrator все еще нет способа починить это.\n\nНо мы попытались.'}
      };

  var SETTINGS = {
        name: SCRIPT.name.replace(/\s/g, '_') + '_data.json',
        folder: Folder.myDocuments + '/Adobe Scripts/'
      };

  if (!/illustrator/i.test(app.name)) {
    alert(LANG.errApp, 'Ai2Psd Error');
    return false;
  }

  if (CFG.aiVers < 16) {
    alert(LANG.errVer, 'Ai2Psd Error');
    return false;
  }

  if (CFG.aiVers >= 23 && CFG.aiVers < 24 && CFG.uiScale > 1) {
    alert(LANG.errScale, 'Ai2Psd Warning');
  }

  var doc = hasOpenDoc() ? app.activeDocument : null;
  var actAbIdx = 0; // Active artboard index
  var srcFiles = []; // Files from folder

  // DIALOG
  var win = new Window('dialog', SCRIPT.name + ' ' + SCRIPT.version);
      win.orientation = 'column';
      win.alignChildren = ['fill', 'top'];
  
  // SOURCE PANEL
  var srcPnl = win.add('panel', undefined, LANG.src);
      srcPnl.alignChildren = 'fill';
      srcPnl.margins = CFG.mgns;

  var actDocRb = srcPnl.add('radiobutton', undefined, LANG.actDoc);
      actDocRb.text += hasOpenDoc() ? truncate(doc.name, 23) : LANG.noDoc;
      actDocRb.value = true;
  var allDocRb = srcPnl.add('radiobutton', undefined, LANG.allDoc1 + documents.length + LANG.allDoc2);
      allDocRb.text = hasOpenDoc() ? LANG.allDoc1 + documents.length + LANG.allDoc2 : LANG.noDoc;
      allDocRb.enabled = documents.length > 1;

  // FOLDER
  var folGrp = srcPnl.add('group');
      folGrp.alignChildren = ['left', 'center'];
  var folRb = folGrp.add('radiobutton', undefined, LANG.fol);
  var folBtn = folGrp.add('button', undefined, LANG.sel);
      folBtn.preferredSize.height = 24;
  var isSubfol = srcPnl.add('checkbox', undefined, LANG.subfol);
      isSubfol.enabled = folBtn.value;
  var folLbl = srcPnl.add('statictext', undefined, Folder.desktop);
      folLbl.preferredSize.width = 160;
  
  // ARTBOARDS PANEL
  var abPnl = win.add('panel', undefined, LANG.abs);
      abPnl.alignChildren = ['fill', 'center'];
      abPnl.margins = CFG.mgns;
  
  var isSaveAbs = abPnl.add('checkbox', undefined, LANG.multiAbs);
      isSaveAbs.value = true;
  
  var abGrp = abPnl.add('group');
      abGrp.alignChildren = ['fill', 'top'];
      abGrp.orientation = 'column';
  
  var allAbRb = abGrp.add('radiobutton', undefined, LANG.allAbs);
      allAbRb.value = true;
  var actAbRb = abGrp.add('radiobutton', undefined, LANG.actAb);

  // RANGE
  var rangeGrp = abGrp.add('group');
      rangeGrp.alignChildren = ['left', 'center'];
  
  var rangeAbRb = rangeGrp.add('radiobutton', undefined, LANG.range);
      rangeAbRb.preferredSize.width = CFG.isRU ? 85 : 60;
  var rangeInp = rangeGrp.add('edittext', undefined, '1,2');
      rangeInp.characters = 12;
      rangeInp.helpTip = '"1, 3-5" -> 1, 3, 4, 5';
  
  // TWO COLUMN LAYOUT
  var row = win.add('group');
      row.alignChildren = ['fill', 'fill'];
  
  // RESOLUTION PANEL
  var resPnl = row.add('panel', undefined, LANG.res);
      resPnl.alignChildren = 'fill';
      resPnl.margins = CFG.mgns;
  
  var ppiList = resPnl.add('dropdownlist', undefined, [LANG.low, LANG.mid, LANG.high, '-', LANG.other]);
      ppiList.selection = 0;
  
  var ppiInp = resPnl.add('edittext', undefined, '96');
      ppiInp.characters = 5;
  resPnl.add('statictext', undefined, LANG.rangeTip);
  
  // COLOR MODEL PANEL
  var colPnl = row.add('panel', undefined, LANG.model);
      colPnl.alignChildren = 'left';
      colPnl.margins = CFG.mgns;
  
  var origColRb = colPnl.add('radiobutton', undefined, LANG.docCol);
      origColRb.value = true;
  var rgbRb = colPnl.add('radiobutton', undefined, 'RGB');
  var cmykRb = colPnl.add('radiobutton', undefined, 'CMYK');
  
  // PROGRESS BAR
  var progGrp = win.add('group');
      progGrp.alignChildren = ['fill', 'center'];
  var progLbl = progGrp.add('statictext', undefined, '1' + LANG.of + '1');
      progLbl.preferredSize.width = 58;
  var progBar = progGrp.add('progressbar', undefined, 0, 100);
      progBar.preferredSize.width = 220;
      progBar.preferredSize.height = 5;

  // BUTTONS
  var btns = win.add('group');
      btns.alignChildren = ['fill', 'fill'];

  var cancel, ok;
  if (CFG.isMac) {
    cancel = btns.add('button', undefined, LANG.cancel, { name: 'cancel' });
    ok = btns.add('button', undefined, LANG.ok, { name: 'ok' });
  } else {
    ok = btns.add('button', undefined, LANG.ok, { name: 'ok' });
    cancel = btns.add('button', undefined, LANG.cancel, { name: 'cancel' });
  }

  var copyGrp = win.add('group');
      copyGrp.orientation = 'row';
      copyGrp.alignChildren = ['fill', 'center'];

  var author = copyGrp.add('statictext', undefined, '\u00A9 ' + LANG.author);
      author.justify = 'left';

  var link = copyGrp.add('statictext', undefined, LANG.link);
      link.justify = 'right';
  
  // EVENTS
  actDocRb.onClick = function () {
    folRb.value = false;
    isSubfol.enabled = false;
    actAbRb.enabled = abGrp.enabled;
    progLbl.text = progLbl.text.replace(/(\d+|\?)$/g, 1);
  }

  allDocRb.onClick = function () {
    if (!this.enabled) return;
    if (!rangeAbRb.value) allAbRb.value = true;
    actAbRb.enabled = false;
    folRb.value = false;
    isSubfol.enabled = false;
    progLbl.text = progLbl.text.replace(/(\d+|\?)$/g, app.documents.length);
  }

  folRb.onClick = function () {
    if (actAbRb.value) {
      allAbRb.value = true;
      rangeAbRb.value = false;
      rangeInp.enabled = false;
    }
    isSubfol.enabled = true;
    actDocRb.value = allDocRb.value = false;
    actAbRb.enabled = false;
    progLbl.text = progLbl.text.replace(/(\d+|\?)$/g, '?');
  }

  var folPath = '';
  folBtn.onClick = function () {
    var fol = Folder.selectDialog(LANG.selFol);
    var str = '';
    if (fol !== null) {
      folPath = decodeURI(fol);
      srcFiles = getFolderFiles(folPath, ['ai', 'eps', 'svg'], isSubfol.enabled && isSubfol.value);
      progLbl.text = progLbl.text.replace(/(\d+|\?)$/g, srcFiles.length);
      str = '.../' + folPath.substr(folPath.lastIndexOf('/') + 1);
      folLbl.text = truncate(str, 40);
    }
  }

  isSubfol.onClick = function () {
    if (!folPath.length) return;
    srcFiles = getFolderFiles(folPath, ['ai', 'eps', 'svg'], isSubfol.enabled && isSubfol.value);
    progLbl.text = progLbl.text.replace(/(\d+|\?)$/g, srcFiles.length);
  }
  
  isSaveAbs.onClick = function () { 
    abGrp.enabled = this.value;
    actAbRb.enabled = abGrp.enabled && actDocRb.value;
    rangeInp.enabled = rangeAbRb.value;
  }
  
  allAbRb.onClick = actAbRb.onClick = function () {
    if (!this.enabled) return;
    rangeAbRb.value = rangeInp.enabled = false;
  }
  
  rangeAbRb.onClick = function () { 
    allAbRb.value = actAbRb.value = false;
    rangeInp.enabled = true;
  }
  
  ppiList.onChange = function () {
    ppiInp.enabled = (/other|другое/i.test(this.selection.text));
  }

  cancel.onClick = win.close;

  ok.onClick = okClick;

  setTextHandler(link, function () {
    openURL('https://github.com/creold')
  });
  
  // Set options
  loadSettings(SETTINGS);

  /**
   * Handle the click event for the OK button
   */
  function okClick() {
    saveSettings(SETTINGS);

    var docs = [];
    var currDoc;
    var isSuccess = false;

    // Determine which documents to process
    if (folRb.value) {
      docs = [].concat(srcFiles); // Process selected folder files
    } else if (allDocRb.value) {
      docs = get(app.documents); // Process all open documents
    } else {
      docs = [app.activeDocument]; // Process only the active document
    }

    // Update progress label with total document count
    progLbl.text = progLbl.text.replace(/(\d+|\?)$/g, docs.length);

    addCompShapeAction(CFG.actSet, CFG.actName, CFG.actPath);

    try {
      for (var i = 0, len = docs.length; i < len; i++) {
        // Update progress label with current document index
        progLbl.text = progLbl.text.replace(/^\d+/g, i + 1);
        win.update();

        // Activate or open the document
        if (folRb.value) {
          app.open(docs[i]);
        } else {
          docs[i].activate();
        }
        currDoc = app.activeDocument;

        // Process the document
        try { process(currDoc, win, progBar, CFG, LANG); } catch (err) {}

        currDoc.activate();

        var psdOpts = setExportOptions(currDoc);
        isSuccess = exportAsPsd(currDoc, psdOpts);

        if (folRb.value) {
          app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        }
      }
    } catch (err) {}

    // Unload existing action
    try {
      app.unloadAction(CFG.actSet, '');
    } catch (err) {}

    // Notify user on success
    if (isSuccess) alert(LANG.done, 'Ai2Psd');

    win.close();
  }

  /**
   * Save UI options to a file
   * @param {object} prefs - Object containing preferences
   */
  function saveSettings(prefs) {
    if (!Folder(prefs.folder).exists) {
      Folder(prefs.folder).create();
    }

    var f = new File(prefs.folder + prefs.name);

    f.encoding = 'UTF-8';
    f.open('w');

    var data = {};
    data.win_x = win.location.x;
    data.win_y = win.location.y;
    data.src = actDocRb.value ? 0 : (allDocRb.value ? 1 : 2);
    data.subfol = isSubfol.value;
    data.multi = isSaveAbs.value;
    data.abs = allAbRb.value ? 0 : (actAbRb.value ? 1 : 2);
    data.range = rangeInp.text;
    data.res = ppiList.selection.index;
    data.ppi = ppiInp.text;
    data.color = origColRb.value ? 0 : (rgbRb.value ? 1 : 2);

    f.write( stringify(data) );
    f.close();
  }

  /**
   * Load options from a file
   * @param {object} prefs - Object containing preferences
   */
  function loadSettings(prefs) {
    var f = File(prefs.folder + prefs.name);

    if (f.exists) {
      try {
        f.encoding = 'UTF-8';
        f.open('r');
        var json = f.readln();
        try { var data = new Function('return (' + json + ')')(); }
        catch (err) {}
        f.close();

        if (typeof data != 'undefined') {
          win.location = [
            data.win_x && !isNaN(parseInt(data.win_x)) ? parseInt(data.win_x) : 300,
            data.win_y && !isNaN(parseInt(data.win_y)) ? parseInt(data.win_y) : 300
          ];
          if (data.src == 0) actDocRb.notify('onClick');
          else if (data.src == 1) allDocRb.notify('onClick');
          else folRb.notify('onClick');
          isSubfol.value = data.subfol === 'true';
          isSaveAbs.value = data.multi === 'true';
          if (data.abs == 0) allAbRb.notify('onClick');
          else if (data.abs == 1) actAbRb.notify('onClick');
          else rangeAbRb.notify('onClick');
          rangeInp.text = data.range;
          ppiList.selection = parseInt(data.res) || 0;
          ppiInp.text = data.ppi;
          if (data.color == 0) origColRb.value = true;
          else if (data.color == 1) rgbRb.value = true;
          else cmykRb.value = true;
        }
      } catch (err) {}
    }

    if (hasOpenDoc()) {
      actAbIdx = doc.artboards.getActiveArtboardIndex();
      actAbRb.text += ' [' + (actAbIdx + 1) + ']: ' + truncate(doc.artboards[actAbIdx].name, 32);
      if (actDocRb.value && /cmyk/i.test(doc.documentColorSpace)) cmykRb.value = true;
    } else {
      actDocRb.enabled = actDocRb.value = false;
      allDocRb.enabled = allDocRb.value = false;
      folRb.value = true;
      isSubfol.enabled = true;
      progLbl.text = '1' + LANG.of + '?';
      actAbRb.enabled = false;
    }

    rangeInp.enabled = rangeAbRb.value;
    abGrp.enabled = isSaveAbs.value;
    actAbRb.enabled = abGrp.enabled && actDocRb.value;
    ppiInp.enabled = (/other|другое/i.test(ppiList.selection.text));
  }

  /**
   * Set up a clickable text handler with hover effects and callback execution
   * @param {Object} text - The statictext object to attach handlers to
   * @param {Function} callback - The function to execute on click
   */
  function setTextHandler(text, callback) {
    var isDarkUI = app.preferences.getRealPreference('uiBrightness') <= 0.5;
    var gfx = text.graphics;
    var colNormal = gfx.newPen(gfx.PenType.SOLID_COLOR, isDarkUI ? [0.8, 0.8, 0.8] : [0.3, 0.3, 0.3], 1); // Black
    var colHover = gfx.newPen(gfx.PenType.SOLID_COLOR, isDarkUI ? [0.27, 0.62, 0.96] : [0.08, 0.45, 0.9], 1); // Blue

    gfx.foregroundColor = colNormal;

    // Hover effect: change color on mouseover
    text.addEventListener('mouseover', function () {
      gfx.foregroundColor = colHover;
      text.notify('onDraw');
    });

    // Revert color to normal
    text.addEventListener('mouseout', function () {
      gfx.foregroundColor = colNormal;
      text.notify('onDraw');
    });

    // Execute callback on click if provided
    text.addEventListener('mousedown', function () {
      if (typeof callback === 'function') callback(text);
    });
  }

  /**
   * Configure and return export options for Photoshop
   * @param {Object} doc - The Illustrator document
   * @returns {Object} Configured export options
   */
  function setExportOptions(doc) {
    var ppi = getPPI(ppiList.selection.text, ppiInp.text);
    var range = actAbRb.enabled && actAbRb.value ? actAbIdx + 1 : '';

    var opts = new ExportOptionsPhotoshop();
    opts.antiAliasing = CFG.aa;
    opts.editableText = CFG.editTxt;
    opts.embedICCProfile = CFG.embedIcc;
    opts.maximumEditability = true;
    opts.resolution = ppi;
    opts.saveMultipleArtboards = isSaveAbs.value;
    opts.warnings = false;
    opts.writeLayers = true;

    // Set image color space
    var imgCol;
    if (origColRb.value) {
      imgCol = /rgb/i.test(doc.documentColorSpace) ? ImageColorSpace.RGB : ImageColorSpace.CMYK;
    } else if (rgbRb.value) {
      app.executeMenuCommand('doc-color-rgb');
      imgCol = ImageColorSpace.RGB;
    } else {
      app.executeMenuCommand('doc-color-cmyk');
      imgCol = ImageColorSpace.CMYK;
    }

    opts.imageColorSpace = imgCol;

    // Handle artboard range
    if (rangeAbRb.value) {
      range = parseAndFilterIndexes(rangeInp.text, doc.artboards.length);
      for (var i = 0; i < range.length; i++) {
        range[i] = (range[i] < 9 ? '0' : '') + (range[i] + 1).toString();
      }
      range = '' + range.join();
    }

    opts.artboardRange = range; // Only string range

    return opts;
  }

  win.show();
}

/**
 * Check if there is at least one open document in Adobe Illustrator
 * @returns {boolean} `true` if there is an open document, `false` otherwise
 */
function hasOpenDoc() {
  return app.documents.length > 0;
}

/**
 * Truncate a string to a specified length, appending an ellipsis if the string exceeds the limit
 * @param {string} str - The input string to truncate
 * @param {number} n - The maximum length of the truncated string (including the ellipsis)
 * @returns {string} The truncated string
 */
function truncate(str, n) {
  if (typeof str !== 'string' || typeof n !== 'number' || n <= 0 || !isFinite(n)) {
    return;
  }
  return str.length > n ? str.slice(0, n - 1) + '...' : str;
}

/**
 * Retrieve files from a specified folder, filtering by file extension
 * @param {Object} path - The folder path to search for files
 * @param {Array} extensions - Array of file extensions to match
 * @param {boolean} isDeep - Whether to search recursively through subfolders
 * @returns {Array} results - An array of files that match the specified extensions
 */
function getFolderFiles(path, extensions, isDeep) {
  var folder = Folder(decodeURI(path));
  var results = [];
  try {
    var filesArr = folder.getFiles();
  } catch(err) {
    return [];
  }

  var currFile = null;
  var regex = new RegExp(extensions.join('|'));

  for (var i = 0, len = filesArr.length; i < len; i++) {
    currFile = filesArr[i];
    try {
      if (isDeep && currFile instanceof Folder) {
        results = results.concat( getFolderFiles(currFile, extensions, isDeep) );
      } else if (currFile instanceof File) {
        if (!/^\._|ds_store/.test(currFile.name) && // Ignore macOS hidden files
            regex.test(/\.[^\.]+$/g.exec(currFile.name.toLowerCase())[0])) {
              results.push(currFile);
        }
      }
    } catch(err) {}
  }

  return results;
}

/**
 * Create a compound shape action in Adobe Illustrator
 * @param {string} set - The name of the action set
 * @param {string} name - The name of the action
 * @param {string} [path] - Optional path to save the action
 * @returns {void}
 */
function addCompShapeAction(set, name, path) {
  var str = [
    '/version 3',
    '/name [' + set.length + ' ' + ascii2Hex(set) + ']',
    '/isOpen 1',
    '/actionCount 1',
    '/action-1 {',
        '/name [' + name.length + ' ' + ascii2Hex(name) + ']',
        '/keyIndex 0',
        '/colorIndex 0',
        '/isOpen 1',
        '/eventCount 1',
        '/event-1 {',
            '/useRulersIn1stQuadrant 0',
            '/internalName (ai_make_compound_shape)',
            '/localizedName [ 19',
            '    4d616b6520436f6d706f756e64205368617065',
            ']',
            '/isOpen 0',
            '/isOn 1',
            '/hasDialog 0',
            '/parameterCount 1',
            '/parameter-1 {',
                '/key 1835101029',
                '/showInPalette 4294967295',
                '/type (integer)',
                '/value 0',
            '}',
        '}',
    '}'].join('');

  // Unload existing action if it exists
  try {
    app.unloadAction(set, '');
  } catch (err) {}

  // Create the new action
  createAction(str, set, path);
}

/**
 * Create an action file and loads it into Adobe Illustrator
 * @param {string} str - The content of the action file
 * @param {string} set - The name of the action set
 * @param {string} path - The path where the action file will be created
 */
function createAction(str, set, path) {
  if (!Folder(path).exists) Folder(path).create();
  var f = new File('' + path + '/' + set + '.aia');
  f.open('w');
  f.write(str);
  f.close();
  app.loadAction(f);
  f.remove();
}

/**
 * Convert a string to its hexadecimal representation
 * @param {string} hex - The input string to be converted to HEX
 * @returns {string} - The hexadecimal representation of the input string
 */
function ascii2Hex(hex) {
  return hex.replace(/./g, function(a) {
    return a.charCodeAt(0).toString(16)
  });
}

/**
 * Convert a collection into a standard Array
 * @param {Object} coll - The collection to be converted
 * @returns {Array} A new array containing the elements
 */
function get(coll) {
  var results = [];
  for (var i = 0, len = coll.length; i < len; i++) {
    results.push(coll[i]);
  }
  return results;
}

/**
 * Process the active Illustrator document
 * @param {Object} doc - The active Illustrator document
 * @param {Object} w - The script UI window (for progress bar updates)
 * @param {Object} pb - Progress bar object
 * @param {Object} pref - Preferences object
 * @param {Object} msg - Object for messages
 */
function process(doc, w, pb, pref, msg) {
  pb.value = 0;

  unlockAll(doc);
  // If the group nesting limit is exceeded, the export to PSD will fail
  limitGroupDepth(doc.layers, 2);

  // Search for the problematic object types
  pref.isHide = searchProblemObj(doc, msg, pref.isHide);

  updateScreenView();
  app.executeMenuCommand('selectall');
  var docItems = getItems(app.selection);

  // Start processing
  for (var len = docItems.length, i = len - 1; i >= 0; i--) {
    app.executeMenuCommand('deselectall');
    updateScreenView();
    var item = docItems[i];
    convertItem(item, pref.actName, pref.actSet);
    // Update Progress bar
    pb.value = parseInt(100 * ((len - i) / len));
    w.update();
  }

  pb.value = 100;
  docItems = null;
  app.executeMenuCommand('deselectall');
  refreshLayersPanel(doc);
  updateScreenView();
}

/**
 * Unlocks all layers and items in the document
 * @param {Object} doc - The active Illustrator document
 */
function unlockAll(doc) {
  unlockLayers(doc.layers);
  app.executeMenuCommand('unlockAll');
  app.executeMenuCommand('deselectall');
  updateScreenView();
}

/**
 * Recursively unlock all layers and sublayers
 * @param {(Object|Array)} layers - Array of layers to unlock
 */
function unlockLayers(layers) {
  for (var i = 0, len = layers.length; i < len; i++) {
    layers[i].locked = false;
    if (layers[i].layers.length) {
      unlockLayers(layers[i].layers);
    }
  }
}

/**
 * Limit the nesting depth of groups in the document
 * @param {(Object|Array)} layers - Array of layers to process
 * @param {number} depth - Maximum allowed group depth
 */
function limitGroupDepth(layers, depth) {
  depth = (isNaN(parseInt(depth)) ? 4 : parseInt(depth)) + 1;
  for (var i = 0; i < layers.length; i++) {
    groupNormalize(layers[i].groupItems, depth);
    if (layers[i].layers.length) {
      limitGroupDepth(layers[i], depth);
    }
  }
}

/**
 * Normalize group nesting by ungrouping or moving items 
 * if the depth exceeds the limit
 * @param {(Object|Array)} groups - Array of group items to process
 * @param {number} max - Maximum allowed group depth
 * @param {number} [counter=0] - Current depth counter
 * @param {Object} [dest] - Destination group for moving items
 */
function groupNormalize(groups, max, counter, dest) {
  var i = groups.length;
  var counter = (counter || 0) + 1;
  if (i > 0) {
    while (i--) {
      if (counter > max) {
        try {
          var dest = groups[i];
        } catch (err) {}
        try {
          if (!groups[i].clipped) {
            moveItems(groups[i].pageItems, dest);
          } else {
            ungroupAll(groups[i]);
          }
        } catch (err) {}
        groupNormalize(groups, max, counter - 1, dest);
      } else {
        try {
          groupNormalize(groups[i].groupItems, max, counter, dest);
        } catch (err) {}
      }
    }
  }
}

/**
 * Ungroup all items in the specified group or layer, recursively
 * @param {Object} obj - The target group, layer, or page item to ungroup.
 */
function ungroupAll(obj) {
  var childs = getGroupChilds(obj);
  if (!childs.length) obj.remove();

  for (var i = 0, len = childs.length; i < len; i++) {
    var item = childs[i];
    try {
      if (!obj.clipped && isType(item.parent, 'layer')) {
        item.move(obj, ElementPlacement.PLACEBEFORE);
      }
      if (isType(item, 'group|layer')) {
        ungroupAll(item);
      }
    } catch (err) {}
  }
}

/**
 * Retrieve all child items (page items and layers) of a group or layer
 * @param {Object} obj - The group or layer to inspect
 * @returns {Array} An array of child items
 */
function getGroupChilds(obj) {
  var results = [];
  var i = 0;

  // Add page items
  for (i = 0, pi = obj.pageItems.length; i < pi; i++) {
    results.push(arr.pageItems[i]);
  }

  // Add layers if they exist
  if (obj.layers) {
    for (i= 0, len = obj.layers.length; i < len; i++) {
      results.push(obj.layers[i]);
    }
  }
  return results;
}

/**
 * Move selected items to a destination in the Adobe Illustrator document
 * @param {Array} items - Array of page items to move
 * @param {Object} [dest] - Destination item or layer. If undefined, the function exits early
 * @returns {Array} Array of group items that were moved (if any)
 */
function moveItems(items, dest) {
  // Early exit if destination is not provided
  if (dest === undefined) return [];

  var groups = [];
  var i = items.length;

  while (i--) {
    var item = items[i];
    if (isType(item, 'group')) groups.push(item);
    item.move(dest, ElementPlacement.PLACEAFTER);
  }

  if (!dest.pageItems.length) dest.remove();

  return groups;
}

/**
 * Search for and optionally hide problematic objects (raster and graph items) in the document
 * @param {Object} doc - The Adobe Illustrator document to search
 * @param {Object} msg - Object containing warning messages
 * @param {boolean} [isHide] - If true, hides found items. If undefined, prompts user for confirmation
 * @returns {boolean} Returns true if items were hidden (or user confirmed), false otherwise
 */
function searchProblemObj(doc, msg, isHide) {
  var badItems = [];
  var i = 0;

  // Collect visible raster items
  for (i = 0; i < doc.rasterItems.length; i++) {
    if (!doc.rasterItems[i].hidden) {
      badItems.push(doc.rasterItems[i]);
    }
  }

  // Collect visible graph items
  for (i = 0; i < doc.graphItems.length; i++) {
    if (!doc.graphItems[i].hidden) {
      badItems.push(doc.graphItems[i]);
    }
  }

  // Hide items if confirmed or forced
  if (badItems.length) {
    if (isHide == undefined) {
      isHide = confirm(msg.warnObj + ' ' + msg.hide + '\n\n' + msg.agree);
    }
    if (isHide) {
      for (i = 0; i < badItems.length; i++) {
        badItems[i].hidden = true;
      }
    }
  }

  return isHide;
}

/**
 * Get individual items from a collection
 * @param {object} coll - Collection of items
 * @returns {array} results - Output array of individual items
 */
function getItems(coll) {
  var results = [];

  for (var i = 0, len = coll.length; i < len; i++) {
    var item = coll[i];
    if (item.pageItems && item.pageItems.length) {
      results = [].concat(results, getItems(item.pageItems));
    } else if (isType(item, 'compound')) {
      if (item.pathItems.length && item.pathItems[0].clipping) continue;
      results.push(item);
    } else if (!item.clipping) {
      results.push(item);
    }
  }

  return results;
}

/**
 * Check the item typename by short name
 * @param {Object} item - Item to be checked
 * @param {string} type - The shortened type to check against. Case-insensitive
 * @returns {boolean} Returns true if the item's typename matches the specified type
 */
function isType(item, type) {
  var regexp = new RegExp(type, 'i');
  return regexp.test(item.typename);
}

/**
 * Convert an Illustrator item to a compound shape for export
 * @param {Object} item - The Illustrator item to convert
 * @param {string} actName - The name of the action to execute for conversion
 * @param {string} actSet - The action set containing the conversion action
 */
function convertItem(item, actName, actSet) {
  var props = {
      name: transliterate( getName(item) ),
      opa: item.opacity,
      blend: item.blendingMode
    };
  var prnt = item.parent;
  prnt.name = transliterate( getName(prnt) );

  // Save properties for single item group
  if ( isType(prnt, 'group') && prnt.pageItems.length === 1 ) {
    props.opa = prnt.opacity;
    props.blend = prnt.blendingMode;
  }

  // Skip text items (editable in PSD)
  if (isType(item, 'text')) {
    if (!isEmpty(props.name)) {
      item.name = props.name;
    }
    return;
  }

  var tmpPath;
  if (isType(item, 'compound')) {
    if (item.pathItems.length) {
      item = item.pathItems[0];
    } else {
      // Fix: Create a temporary path for empty compound paths
      tmpPath = item.pathItems.add();
      item = tmpPath;
    }
  }

  // Remove overprint attributes
  item.fillOverprint = false;
  item.strokeOverprint = false;

  try {
    if (!isProblemType(item) && isSolidFill(item) && !item.stroked) {
      if (isType(item.parent, 'compound')) {
        item = item.parent;
        if (tmpPath) tmpPath.remove();
      }

      app.selection = item;
      app.doScript(actName, actSet); // Convert to Compound Shape

      // Fix Adobe Illustrator bug, when selection is lost after run action
      if (!app.selection.length) {
        try {
          app.selection = item;
        } catch (err) {}
      }

      // Restore properties
      if (!isEmpty(props.name)) app.selection[0].name = props.name;
      app.selection[0].opacity = props.opa;
      app.selection[0].blendingMode = props.blend;
    } else {
      if (isType(item.parent, 'compound')) {
        item = item.parent;
        if (tmpPath) tmpPath.remove();
      }

      // Path didn't match the condition, so we do group on it
      var safeGrp = item.layer.groupItems.add();
      safeGrp.move(item, ElementPlacement.PLACEBEFORE);
      item.move(safeGrp, ElementPlacement.PLACEATEND);
      if (!isEmpty(props.name)) safeGrp.name = props.name;
    }
  } catch (err) {}
}

/**
 * Transliterate Cyrillic characters to Latin for naming compatibility
 * @param {string} str - The string to transliterate
 * @returns {string} The transliterated string
 */
function transliterate(str) {
  var tlStr = '';
  var cyrillicMap = {
    'Ё': 'YO', 'Й': 'I', 'Ц': 'TS', 'У': 'U', 'К': 'K', 'Е': 'E', 'Н': 'N', 'Г': 'G', 'Ґ': 'G', 'Ш': 'SH', 'Щ': 'SCH', 'З': 'Z', 'Х': 'H', 'Ъ': "'",
    'ё': 'yo', 'й': 'i', 'ц': 'ts', 'у': 'u', 'к': 'k', 'е': 'e', 'н': 'n', 'г': 'g', 'ґ': 'g', 'ш': 'sh', 'щ': 'sch', 'з': 'z', 'х': 'h', 'ъ': "'",
    'Ф': 'F', 'Ы': 'I', 'В': 'V', 'А': 'a', 'П': 'P', 'Р': 'R', 'О': 'O', 'Л': 'L', 'Д': 'D', 'Ж': 'ZH', 'Э': 'E', 'Є': 'Je',
    'ф': 'f', 'ы': 'i', 'в': 'v', 'а': 'a', 'п': 'p', 'р': 'r', 'о': 'o', 'л': 'l', 'д': 'd', 'ж': 'zh', 'э': 'e', 'є': 'je',
    'Я': 'Ya', 'Ч': 'CH', 'С': 'S', 'М': 'M', 'И': 'I', 'Ї': 'ш', 'Т': 'T', 'Ь': "'", 'Б': 'B', 'Ю': 'YU',
    'я': 'ya', 'ч': 'ch', 'с': 's', 'м': 'm', 'и': 'i', 'ї': 'i', 'т': 't', 'ь': "'", 'б': 'b', 'ю': 'yu'
  };

  for (var i = 0; i < str.length; i++) {
    tlStr += cyrillicMap[str[i]] || str[i];
  }
  return tlStr;
}

/**
* Get the name of an item, considering its type
* @param {Object} item - The item for which to get the name
* @returns {string} str - The name of the item
*/
function getName(item) {
  if (!item || !item.typename) return item.name || '';

  // If part of a compound path with a name, return that
  var compound = getCompound(item);
  if (compound && !isEmpty(compound.name)) {
    return compound.name;
  }

  // If item has a direct name, return it
  if (!isEmpty(item.name)) {
    return item.name;
  }

  // Special cases for derived names
  if (item.typename === 'TextFrame' && !isEmpty(item.contents)) {
    return item.contents;
  }

  if (item.typename === 'SymbolItem') {
    return item.symbol.name;
  }

  if (item.typename === 'PlacedItem') {
    return item.file && item.file.name ? item.file.name : '<Linked File>';
  }

  // Default system names for unnamed objects
  switch (item.typename) {
    case 'PathItem': return '<Path>';
    case 'CompoundPathItem': return '<Compound Path>';
    case 'GraphItem': return '<Graph>';
    case 'GroupItem': return item.clipped ? '<Clipping Group>' : '<Group>';
    case 'MeshItem': return '<Mesh>';
    case 'NonNativeItem': return '<Non-Native Art>';
    case 'RasterItem': return '<Image>';
    case 'SymbolItem': return '<Symbol>';
    case 'PlacedItem': return '<Linked File>';
    case 'TextFrame': return '<Text>';
    default:
      if (isLegacyText(item)) return '<Legacy Text>';
      return '<' + item.typename + '>';
  }
}

/**
 * Retrieve the compound path parent of an item
 * @param {Object} item - The item to check for a compound path parent
 * @returns {Object|null} The compound path item if found, otherwise null
 */
function getCompound(item) {
  if (!item || !item.typename) return null;

  // Skip top-level objects: layers, artboards, document
  if (item.typename === 'Layer' || item.typename === 'Artboard' || item.typename === 'Document') {
    return null;
  }

  while (item && item.parent) {
    if (item.parent.typename === 'CompoundPathItem') {
      return item.parent;
    }
    item = item.parent;
  }

  return null;
}

/**
 * Check if an item is considered a legacy text item
 * @param {Object} item - The item to check
 * @return {boolean} Returns true if the item is a legacy text item, false otherwise
 */
function isLegacyText(item) {
  return item.typename === 'LegacyTextItem' || 
        (item.typename === 'TextFrame' && (!item.hasOwnProperty('contents') ||
        item.hasOwnProperty('converted')));
}

/**
 * Check if a string is empty or contains only whitespace characters
 * @param {string} str - The string to check for emptiness
 * @returns {boolean} True if the string is empty, false otherwise
 */
function isEmpty(str) {
  return str.replace(/\s/g, '').length === 0;
}

/**
 * Check if an item is of a problematic type
 * Problematic types include: GraphItem, GroupItem, MeshItem, NonNativeItem,
 * PlacedItem, PluginItem, RasterItem, SymbolItem
 * @param {Object} item - The item to check
 * @returns {boolean} True if the item is of a problematic type, false otherwise
 */
function isProblemType(item) {
  return isType(item, 'graph|group|mesh|nonnative|placed|plugin|raster|symbol');
}

/**
 * Checs if an item has a solid fill color
 * Solid fill types include: RGBColor, CMYKColor, GrayColor, SpotColor
 * @param {Object} item - The item to check
 * @returns {boolean} True if the item has a solid fill, false otherwise
 */
function isSolidFill(item) {
  if (!item.filled) return false;
  return isType(item.fillColor, 'rgb|cmyk|gray|spot');
}

/**
 * Refresh the Layers panel by temporarily hiding and restoring layer visibility
 * @param {Object} doc - The active Adobe Illustrator document
 */
function refreshLayersPanel(doc) {
  var layers = doc.layers;
  var layerStates = [];
  var i;

  // Store current visibility states
  for (i = 0; i < layers.length; i++) {
    layerStates.push(layers[i].visible);
  }

  // Temporarily hide all layers
  for (i = 0; i < layers.length; i++) {
    layers[i].visible = false;
  }

  $.sleep(50);

  // Restore original visibility states
  for (i = 0; i < layers.length; i++) {
    layers[i].visible = layerStates[i];
  }
}

// Convert string to absolute integer number
function strToIntNum(str, def) {
  if (arguments.length == 1 || def == undefined) def = 0;
  str = str.replace(/,/g, '.').replace(/[^\d.]/g, '');
  str = str.split('.');
  str = str[0] ? str[0] + '.' + str.slice(1).join('') : '';
  if (isNaN(str) || !str.length) {
    return parseInt(def);
  } else {
    return parseInt(str);
  }
}

/**
 * Extract PPI (Pixels Per Inch) from user input or falls back to default values
 * @param {string} str - Preset input string (e.g., "72", "150", "300", "other")
 * @param {string} custom - Custom PPI value as a string
 * @returns {number} PPI value, clamped between 72 and 2400
 */
function getPPI(str, custom) {
  var ppi = 72; // Default PPI

  switch (true) {
    case /72/i.test(str):
      break;
    case /150/i.test(str):
      ppi = 150;
      break;
    case /300/i.test(str):
      ppi = 300;
      break;
    case /other|другое/i.test(str):
      ppi = custom ? strToIntNum(custom, 72) : 72;
      break;
  }

  return Math.max(72, Math.min(ppi, 2400));
}

/**
 * Parse a string representing a list of indexes and filters them based on a total count
 * @param {string} str - The input string containing the indexes
 * @param {number} total - The maximum allowed number (exclusive)
 * @returns {Array} An array of valid indexes
 */
function parseAndFilterIndexes(str, givenNumber) {
  var parsedNums = [];
  var chunks = str.split(/[,; ]+/);
  var length = chunks.length;

  for (var i = 0; i < length; i++) {
    var chunk = chunks[i];
    var range = chunk.split('-');

    if (range.length === 2) {
      var start = parseInt(range[0], 10);
      var end = parseInt(range[1], 10);

      for (var j = start; j <= end; j++) {
        parsedNums.push(j);
      }
    } else {
      var num = parseInt(chunk, 10);
      if (!isNaN(num)) {
        parsedNums.push(num);
      }
    }
  }

  var filteredNums = [];
  length = parsedNums.length;

  for (var k = 0; k < length; k++) {
    var num = parsedNums[k] - 1;

    if (num >= 0 && num < givenNumber) {
      filteredNums.push(num);
    }
  }

  // Remove duplicates and sort
  filteredNums = getUnique(filteredNums);
  filteredNums.sort(function (a, b) {
    return a - b;
  });

  return filteredNums;
}

/**
 * Remove duplicate elements from an array
 * @param {Array} arr - The input array
 * @returns {Array} An array with duplicate elements removed
 */
function getUnique(arr) {
  var obj = {};
  var i, l = arr.length;
  var unique = [];
  for (i = 0; i < l; i++) obj[arr[i]] = arr[i];
  for (i in obj) unique.push(obj[i]);
  return unique;
}

/**
 * Export the Illustrator document as a PSD file
 * @param {Document} doc - The active Illustrator document to export
 * @param {Object} opts - Export options for the PSD file
 * @returns {boolean} `true` if export succeeded, `false` if failed
 */
function exportAsPsd(doc, opts) {
  var fol = (doc.path == '' || doc.path.toString().length < 1) ? Folder.desktop : doc.path;
  try {
    var name = doc.name.replace(/\.[^\.]+$/, '') + '.psd';
    var f = new File(decodeURI(fol) + '/' + name);
    doc.exportFile(f, ExportType.PHOTOSHOP, opts);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Open a URL in the default web browser
 * @param {string} url - The URL to open in the web browser
 * @returns {void}
 */
function openURL(url) {
  var html = new File(Folder.temp.absoluteURI + '/aisLink.html');
  html.open('w');
  var htmlBody = '<html><head><META HTTP-EQUIV=Refresh CONTENT="0; URL=' + url + '"></head><body> <p></body></html>';
  html.write(htmlBody);
  html.close();
  html.execute();
}

/**
 * Force a refresh of the active document's view in Adobe Illustrator
 * This is a workaround to update the screen view when UI changes are not automatically reflected
 * @returns {void}
 */
function updateScreenView() {
  var doc, currView, currCenter;
  try {
    doc = app.activeDocument;
    currView = doc.views[0];
    currCenter = currView.centerPoint.slice();
    currView.centerPoint = [currCenter[0] + 0.001, currCenter[1]];
    $.sleep(50);
    currView.centerPoint = currCenter;
  } catch (err) {} finally {
    currView = null;
    doc = null;
    $.gc();
  }
}

/**
 * Serialize a JavaScript plain object into a JSON-like string
 * @param {Object} obj - The object to serialize
 * @returns {string} - A JSON-like string representation of the object
 */
function stringify(obj) {
  var json = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var value = obj[key].toString();
      value = value
        .replace(/\t/g, "\t")
        .replace(/\r/g, "\r")
        .replace(/\n/g, "\n")
        .replace(/"/g, '\"');
      json.push('"' + key + '":"' + value + '"');
    }
  }
  return "{" + json.join(",") + "}";
}

// Run script
try {
  main();
} catch (err) {}