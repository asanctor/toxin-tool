/**
 * @license
 * Copyright 2016 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview The AppController Class brings together the Block
 * Factory, Block Library, and Block Exporter functionality into a single web
 * app.
 *
 * @author quachtina96 (Tina Quach)
 */

/**
 * Controller for the Blockly Factory
 * @constructor
 */
AppController = function() {
  // Initialize Block Library
  this.blockLibraryName = 'blockLibrary';
  this.blockLibraryController =
      new BlockLibraryController(this.blockLibraryName);
  this.blockLibraryController.populateBlockLibrary();

};

// Constant values representing the three tabs in the controller.
AppController.BLOCK_FACTORY = 'BLOCK_FACTORY';


/**
 * Tied to the 'Import Block Library' button. Imports block library from file to
 * Block Factory. Expects user to upload a single file of JSON mapping each
 * block type to its XML text representation.
 */
AppController.prototype.importBlockLibraryFromFile = function() {
  var self = this;
  var files = document.getElementById('files');
  // If the file list is empty, the user likely canceled in the dialog.
  if (files.files.length > 0) {
    BlocklyDevTools.Analytics.onImport(
        BlocklyDevTools.Analytics.BLOCK_FACTORY_LIBRARY,
        { format: BlocklyDevTools.Analytics.FORMAT_XML });

    // The input tag doesn't have the "multiple" attribute
    // so the user can only choose 1 file.
    var file = files.files[0];
    var fileReader = new FileReader();

    // Create a map of block type to XML text from the file when it has been
    // read.
    fileReader.addEventListener('load', function(event) {
      var fileContents = event.target.result;
      // Create empty object to hold the read block library information.
      var blockXmlTextMap = Object.create(null);
      try {
        // Parse the file to get map of block type to XML text.
        blockXmlTextMap = self.formatBlockLibraryForImport_(fileContents);
      } catch (e) {
        var message = 'Could not load your block library file.\n'
        window.alert(message + '\nFile Name: ' + file.name);
        return;
      }

      // Create a new block library storage object with inputted block library.
      var blockLibStorage = new BlockLibraryStorage(
          self.blockLibraryName, blockXmlTextMap);

      // Update block library controller with the new block library
      // storage.
      self.blockLibraryController.setBlockLibraryStorage(blockLibStorage);
      // Update the block library dropdown.
      self.blockLibraryController.populateBlockLibrary();
      // Update the exporter's block library storage.
      //self.exporter.setBlockLibraryStorage(blockLibStorage);
    });
    // Read the file.
    fileReader.readAsText(file);
  }
};

/**
 * Tied to the 'Export Block Library' button. Exports block library to file that
 * contains JSON mapping each block type to its XML text representation.
 */
AppController.prototype.exportBlockLibraryToFile = function() {
  // Get map of block type to XML.
  var blockLib = this.blockLibraryController.getBlockLibrary();
  // Concatenate the XMLs, each separated by a blank line.
  var blockLibText = this.formatBlockLibraryForExport_(blockLib);
  // Get file name.
  var filename = prompt('Enter the file name under which to save your block ' +
      'library.', 'library.xml');
  // Download file if all necessary parameters are provided.
  if (filename) {
    FactoryUtils.createAndDownloadFile(blockLibText, filename, 'xml');
    BlocklyDevTools.Analytics.onExport(
        BlocklyDevTools.Analytics.BLOCK_FACTORY_LIBRARY,
        { format: BlocklyDevTools.Analytics.FORMAT_XML });
  } else {
    var msg = 'Could not export Block Library without file name under which ' +
      'to save library.';
    BlocklyDevTools.Analytics.onWarning(msg);
    alert(msg);
  }
};

/**
 * Converts an object mapping block type to XML to text file for output.
 * @param {!Object} blockXmlMap Object mapping block type to XML.
 * @return {string} XML text containing the block XMLs.
 * @private
 */
AppController.prototype.formatBlockLibraryForExport_ = function(blockXmlMap) {
  // Create DOM for XML.
  var xmlDom = Blockly.utils.xml.createElement('xml');

  // Append each block node to XML DOM.
  for (var blockType in blockXmlMap) {
    var blockXmlDom = Blockly.Xml.textToDom(blockXmlMap[blockType]);
    var blockNode = blockXmlDom.firstElementChild;
    xmlDom.appendChild(blockNode);
  }

  // Return the XML text.
  return Blockly.Xml.domToText(xmlDom);
};

/**
 * Converts imported block library to an object mapping block type to block XML.
 * @param {string} xmlText String representation of an XML with each block as
 *    a child node.
 * @return {!Object} Object mapping block type to XML text.
 * @private
 */
AppController.prototype.formatBlockLibraryForImport_ = function(xmlText) {
  var inputXml = Blockly.Xml.textToDom(xmlText);
  // Convert the live HTMLCollection of child Elements into a static array,
  // since the addition to editorWorkspaceXml below removes it from inputXml.
  var inputChildren = Array.from(inputXml.children);

  // Create empty map. The line below creates a  truly empy object. It doesn't
  // have built-in attributes/functions such as length or toString.
  var blockXmlTextMap = Object.create(null);

  // Populate map.
  for (var i = 0, blockNode; blockNode = inputChildren[i]; i++) {
    // Add outer XML tag to the block for proper injection in to the
    // main workspace.
    // Create DOM for XML.
    var editorWorkspaceXml = Blockly.utils.xml.createElement('xml');
    editorWorkspaceXml.appendChild(blockNode);

    xmlText = Blockly.Xml.domToText(editorWorkspaceXml);
    // All block types should be lowercase.
    var blockType = this.getBlockTypeFromXml_(xmlText).toLowerCase();
    // Some names are invalid so fix them up.
    blockType = FactoryUtils.cleanBlockType(blockType);

    blockXmlTextMap[blockType] = xmlText;
  }

  return blockXmlTextMap;
};

/**
 * Extracts out block type from XML text, the kind that is saved in block
 * library storage.
 * @param {string} xmlText A block's XML text.
 * @return {string} The block type that corresponds to the provided XML text.
 * @private
 */
AppController.prototype.getBlockTypeFromXml_ = function(xmlText) {
  var xmlDom = Blockly.Xml.textToDom(xmlText);
  // Find factory base block.
  var factoryBaseBlockXml = xmlDom.getElementsByTagName('block')[0];
  // Get field elements from factory base.
  var fields = factoryBaseBlockXml.getElementsByTagName('field');
  for (var i = 0; i < fields.length; i++) {
    // The field whose name is 'NAME' holds the block type as its value.
    if (fields[i].getAttribute('name') == 'NAME') {
      return fields[i].childNodes[0].nodeValue;
    }
  }
};


/**
 * If given checkbox is checked, enable the given elements.  Otherwise, disable.
 * @param {boolean} enabled True if enabled, false otherwise.
 * @param {!Array.<string>} idArray Array of element IDs to enable when
 *    checkbox is checked.
 */
AppController.prototype.ifCheckedEnable = function(enabled, idArray) {
  for (var i = 0, id; id = idArray[i]; i++) {
    var element = document.getElementById(id);
    if (enabled) {
      element.classList.remove('disabled');
    } else {
      element.classList.add('disabled');
    }
    var fields = element.querySelectorAll('input, textarea, select');
    for (var j = 0, field; field = fields[j]; j++) {
      field.disabled = !enabled;
    }
  }
};

/**
 * Assign button click handlers for the block library.
 */
AppController.prototype.assignLibraryClickHandlers = function() {
  var self = this;

    // Button for saving block to library (not really necessary) + save to DB (that is necessary!)
    document.getElementById('saveDM').addEventListener('click',
      function() {
          self.blockLibraryController.saveToBlockLibrary();
      });

  //most of function below are not necessary

  // Button for saving block to library.
  document.getElementById('saveToBlockLibraryButton').addEventListener('click',
      function() {
        self.blockLibraryController.saveToBlockLibrary();
      });

  // Button for removing selected block from library.
  document.getElementById('removeBlockFromLibraryButton').addEventListener(
    'click',
      function() {
        self.blockLibraryController.removeFromBlockLibrary();
      });

  // Button for clearing the block library.
  document.getElementById('clearBlockLibraryButton').addEventListener('click',
      function() {
        self.blockLibraryController.clearBlockLibrary();
      });

  // Hide and show the block library dropdown.
  document.getElementById('button_blockLib').addEventListener('click',
      function() {
        self.openModal('dropdownDiv_blockLib');
      });
};

/**
 * Assign button click handlers for the block factory.
 */
AppController.prototype.assignBlockFactoryClickHandlers = function() {
  var self = this;
  // Assign button event handlers for Block Factory.
  document.getElementById('localSaveButton')
      .addEventListener('click', function() {
        self.exportBlockLibraryToFile();
      });

  document.getElementById('files').addEventListener('change',
      function() {
        // Warn user.
        var replace = confirm('This imported block library will ' +
            'replace your current block library.');
        if (replace) {
          self.importBlockLibraryFromFile();
          // Clear this so that the change event still fires even if the
          // same file is chosen again. If the user re-imports a file, we
          // want to reload the workspace with its contents.
          this.value = null;
        }
      });

  document.getElementById('createNewBlockButton')
    .addEventListener('click', function() {
      // If there are unsaved changes warn user, check if they'd like to
      // proceed with unsaved changes, and act accordingly.
      var proceedWithUnsavedChanges =
          self.blockLibraryController.warnIfUnsavedChanges();
      if (!proceedWithUnsavedChanges) {
        return;
      }

      BlockFactory.showStarterBlock();
      self.blockLibraryController.setNoneSelected();

      // Close the Block Library Dropdown.
      self.closeModal();
    });
};

/**
 * Add event listeners for the block factory.
 */
AppController.prototype.addBlockFactoryEventListeners = function() {
  // Update code on changes to block being edited.
  BlockFactory.mainWorkspace.addChangeListener(BlockFactory.updateLanguage);

  // Disable blocks not attached to the factory_base block.
  BlockFactory.mainWorkspace.addChangeListener(Blockly.Events.disableOrphans);

  // Update the buttons on the screen based on whether
  // changes have been saved.
  var self = this;
  BlockFactory.mainWorkspace.addChangeListener(function() {
    self.blockLibraryController.updateButtons(FactoryUtils.savedBlockChanges(
        self.blockLibraryController));
    });

  document.getElementById('direction')
      .addEventListener('change', BlockFactory.updatePreview);
  document.getElementById('languageTA')
      .addEventListener('change', BlockFactory.manualEdit);
  document.getElementById('languageTA')
      .addEventListener('keyup', BlockFactory.manualEdit);
  document.getElementById('format')
      .addEventListener('change', BlockFactory.formatChange);
  //removed languages because not needed
  //document.getElementById('language')
      //.addEventListener('change', BlockFactory.updatePreview);
};

/**
 * Handle Blockly Storage with App Engine.
 */
AppController.prototype.initializeBlocklyStorage = function() {
  BlocklyStorage.HTTPREQUEST_ERROR =
      'There was a problem with the request.\n';
  BlocklyStorage.LINK_ALERT =
      'Share your blocks with this link:\n\n%1';
  BlocklyStorage.HASH_ERROR =
      'Sorry, "%1" doesn\'t correspond with any saved Blockly file.';
  BlocklyStorage.XML_ERROR = 'Could not load your saved file.\n' +
      'Perhaps it was created with a different version of Blockly?';
  var linkButton = document.getElementById('linkButton');
  linkButton.style.display = 'inline-block';
  linkButton.addEventListener('click',
      function() {
          BlocklyStorage.link(BlockFactory.mainWorkspace);});
  BlockFactory.disableEnableLink();
};

/**
 * Handle resizing of elements.
 */
AppController.prototype.onresize = function(event) {
  // Handle resizing of Block Factory elements.
  var expandList = [
    document.getElementById('blocklyPreviewContainer'),
    document.getElementById('blockly'),
    document.getElementById('blocklyMask'),
    document.getElementById('preview'),
    document.getElementById('languagePre'),
    document.getElementById('languageTA'),
    document.getElementById('generatorPre'),
  ];
  for (var i = 0, expand; expand = expandList[i]; i++) {
    expand.style.width = (expand.parentNode.offsetWidth - 2) + 'px';
    expand.style.height = (expand.parentNode.offsetHeight - 2) + 'px';
  }
};

/**
 * Handler for the window's 'beforeunload' event. When a user has unsaved
 * changes and refreshes or leaves the page, confirm that they want to do so
 * before actually refreshing.
 * @param {!Event} e beforeunload event.
 */
AppController.prototype.confirmLeavePage = function(e) {
  BlocklyDevTools.Analytics.sendQueued();
  if ((!BlockFactory.isStarterBlock() &&
      !FactoryUtils.savedBlockChanges(blocklyFactory.blockLibraryController)) ||
      blocklyFactory.workspaceFactoryController.hasUnsavedChanges()) {

    var confirmationMessage = 'You will lose any unsaved changes. ' +
        'Are you sure you want to exit this page?';
    BlocklyDevTools.Analytics.onWarning(confirmationMessage);
    e.returnValue = confirmationMessage;
    return confirmationMessage;
  }
};

/**
 * Show a modal element, usually a dropdown list.
 * @param {string} id ID of element to show.
 */
AppController.prototype.openModal = function(id) {
  Blockly.hideChaff();
  this.modalName_ = id;
  document.getElementById(id).style.display = 'block';
  document.getElementById('modalShadow').style.display = 'block';
};

/**
 * Hide a previously shown modal element.
 */
AppController.prototype.closeModal = function() {
  var id = this.modalName_;
  if (!id) {
    return;
  }
  document.getElementById(id).style.display = 'none';
  document.getElementById('modalShadow').style.display = 'none';
  this.modalName_ = null;
};

/**
 * Name of currently open modal.
 * @type {string?}
 * @private
 */
AppController.prototype.modalName_ = null;

/**
 * Initialize Blockly and layout.  Called on page load.
 */
AppController.prototype.init = function() {
  var self = this;
  // Handle Blockly Storage with App Engine.
  if ('BlocklyStorage' in window) {
    this.initializeBlocklyStorage();
  }

  // Assign click handlers.
  //this.assignExporterClickHandlers();
  this.assignLibraryClickHandlers();
  this.assignBlockFactoryClickHandlers();
  // Hide and show the block library dropdown.
  document.getElementById('modalShadow').addEventListener('click',
      function() {
        self.closeModal();
      });

  this.onresize();
  window.addEventListener('resize', function() {
    self.onresize();
  });

  // Inject Block Factory Main Workspace.
  var toolbox = document.getElementById('blockfactory_toolbox');
  BlockFactory.mainWorkspace = Blockly.inject('blockly',
      {collapse: false,
       toolbox: toolbox,
       comments: false,
       disable: false,
       media: '../media/'});

  // Add tab handlers for switching between Block Factory and Block Exporter.
  //this.addTabHandlers(this.tabMap);

  // Assign exporter change listeners.
  //this.assignExporterChangeListeners();

  // Create the root block on Block Factory main workspace.
  if ('BlocklyStorage' in window && window.location.hash.length > 1) {
    BlocklyStorage.retrieveXml(window.location.hash.substring(1),
                               BlockFactory.mainWorkspace);
  } else {
    BlockFactory.showStarterBlock();
  }
  BlockFactory.mainWorkspace.clearUndo();

  // Add Block Factory event listeners.
  this.addBlockFactoryEventListeners();

  // Workspace Factory init.
  //WorkspaceFactoryInit.initWorkspaceFactory(this.workspaceFactoryController);
};
