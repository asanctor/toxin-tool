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
 * @fileoverview FactoryUtils is a namespace that holds block starter code
 * generation functions shared by the Block Factory, Workspace Factory, and
 * Exporter applications within Blockly Factory. Holds functions to generate
 * block definitions and generator stubs and to create and download files.
 *
 * @author fraser@google.com (Neil Fraser), quachtina96 (Tina Quach), JC-Orozco
 * (Juan Carlos Orozco)
 */
'use strict';

/**
 * Namespace for FactoryUtils.
 */
var FactoryUtils = FactoryUtils || Object.create(null);

/**
 * Get block definition code for the current block.
 * @param {string} blockType Type of block.
 * @param {!Blockly.Block} rootBlock RootBlock from main workspace in which
 *    user uses Block Factory Blocks to create a custom block.
 * @param {string} format 'JSON' or 'JavaScript'.
 * @param {!Blockly.Workspace} workspace Where the root block lives.
 * @return {string} Block definition.
 */
FactoryUtils.getBlockDefinition = function(blockType, rootBlock, format, workspace) {
  blockType = FactoryUtils.cleanBlockType(blockType);
  switch (format) {
    case 'JSON':
      var code = FactoryUtils.formatJson_(blockType, rootBlock);
      break;
    case 'JavaScript':
      var code = FactoryUtils.formatJavaScript_(blockType, rootBlock, workspace);
      break;
  }
  return code;
};

/**
 * Convert invalid block name to a valid one. Replaces whitespace
 * and prepend names that start with a digit with an '_'.
 * @param {string} blockType Type of block.
 * @return {string} Cleaned up block type.
 */
FactoryUtils.cleanBlockType = function(blockType) {
  if (!blockType) {
    return '';
  }
  return blockType.replace(/\W/g, '_').replace(/^(\d)/, '_$1');
};

/**
 * Get the generator code for a given block.
 * @param {!Blockly.Block} block Rendered block in preview workspace.
 * @param {string} generatorLanguage 'JavaScript', 'Python', 'PHP', 'Lua',
 *     or 'Dart'.
 * @return {string} Generator code for multiple blocks.
 *
FactoryUtils.getGeneratorStub = function(block, generatorLanguage) {
  // Build factory blocks from block
  if (BlockFactory.updateBlocksFlag) {  // TODO: Move this to updatePreview()
    BlockFactory.mainWorkspace.clear();
    var xml = BlockDefinitionExtractor.buildBlockFactoryWorkspace(block);
    console.log(xml);
    Blockly.Xml.domToWorkspace(xml, BlockFactory.mainWorkspace);
    // Calculate timer to avoid infinite update loops
    // TODO(#1267): Remove the global variables and any infinite loops.
    BlockFactory.updateBlocksFlag = false;
    setTimeout(
        function() {BlockFactory.updateBlocksFlagDelayed = false;}, 3000);
  }
  BlockFactory.lastUpdatedBlock = block; // Variable to share the block value.

  function makeVar(root, name) {
    name = name.toLowerCase().replace(/\W/g, '_');
    return '  var ' + root + '_' + name;
  }
  // The makevar function lives in the original update generator.
  var language = generatorLanguage;
  var code = [];
  code.push("Blockly." + language + "['" + block.type +
            "'] = function(block) {");

  // Generate getters for any fields or inputs.
  for (var i = 0, input; input = block.inputList[i]; i++) {
    for (var j = 0, field; field = input.fieldRow[j]; j++) {
      var name = field.name;
      if (!name) {
        continue;
      }
      if (field instanceof Blockly.FieldVariable) {
        // Subclass of Blockly.FieldDropdown, must test first.
        code.push(makeVar('variable', name) +
                  " = Blockly." + language +
                  ".variableDB_.getName(block.getFieldValue('" + name +
                  "'), Blockly.Variables.NAME_TYPE);");
      } else if (field instanceof Blockly.FieldAngle) {
        // Subclass of Blockly.FieldTextInput, must test first.
        code.push(makeVar('angle', name) +
                  " = block.getFieldValue('" + name + "');");
      } else if (Blockly.FieldDate && field instanceof Blockly.FieldDate) {
        // Blockly.FieldDate may not be compiled into Blockly.
        code.push(makeVar('date', name) +
                  " = block.getFieldValue('" + name + "');");
      } else if (field instanceof Blockly.FieldColour) {
        code.push(makeVar('colour', name) +
                  " = block.getFieldValue('" + name + "');");
      } else if (field instanceof Blockly.FieldCheckbox) {
        code.push(makeVar('checkbox', name) +
                  " = block.getFieldValue('" + name + "') == 'TRUE';");
      } else if (field instanceof Blockly.FieldDropdown) {
        code.push(makeVar('dropdown', name) +
                  " = block.getFieldValue('" + name + "');");
      } else if (field instanceof Blockly.FieldNumber) {
        code.push(makeVar('number', name) +
                  " = block.getFieldValue('" + name + "');");
      } else if (field instanceof Blockly.FieldTextInput) {
        code.push(makeVar('text', name) +
                  " = block.getFieldValue('" + name + "');");
      }
    }
    var name = input.name;
    if (name) {
      if (input.type == Blockly.INPUT_VALUE) {
        code.push(makeVar('value', name) +
                  " = Blockly." + language + ".valueToCode(block, '" + name +
                  "', Blockly." + language + ".ORDER_ATOMIC);");
      } else if (input.type == Blockly.NEXT_STATEMENT) {
        code.push(makeVar('statements', name) +
                  " = Blockly." + language + ".statementToCode(block, '" +
                  name + "');");
      }
    }
  }
  // Most languages end lines with a semicolon.  Python & Lua do not.
  var lineEnd = {
    'JavaScript': ';',
    'Python': '',
    'PHP': ';',
    'Lua': '',
    'Dart': ';'
  };
  code.push("  // TODO: Assemble " + language + " into code variable.");
  if (block.outputConnection) {
    code.push("  var code = '...';");
    code.push("  // TODO: Change ORDER_NONE to the correct strength.");
    code.push("  return [code, Blockly." + language + ".ORDER_NONE];");
  } else {
    code.push("  var code = '..." + (lineEnd[language] || '') + "\\n';");
    code.push("  return code;");
  }
  code.push("};");

  return code.join('\n');
};
*/

/**
 * Update the language code as JSON.
 * @param {string} blockType Name of block.
 * @param {!Blockly.Block} rootBlock Factory_base block.
 * @return {string} Generanted language code.
 * @private
 */
//TODO: this code still uses study and test domain concepts which are now replaced by "component" so should be updated everywhere!
FactoryUtils.formatJson_ = function(blockType, rootBlock) {
  var JS = {};
  // Type is not used by Blockly, but may be used by a loader.
  JS.type = "http://ontologies.vub.be/oecd#"+ blockType;
  // Generate inputs.
  var message = [];
  var args = [];
  let propertiesBlock = rootBlock.getInputTargetBlock('PROPERTIES');
  console.log(propertiesBlock);
  var lastInput = null;
  //first push name of the block
  message.push(rootBlock.getFieldValue('DM_name'));
  //then the abbreviation of the block
  message.push('(' + rootBlock.getFieldValue('DM_abbrev') + ')');
  //name and abbreviation are forming a dummy input
  args.push({type: "input_dummy"});
  message.push('%' + args.length);

  while (propertiesBlock) {
    if (!propertiesBlock.disabled && !propertiesBlock.getInheritedDisabled()) {
      let fields = FactoryUtils.getFieldsJson_(propertiesBlock);
      for (var i = 0; i < fields.length; i++) {
        if (typeof fields[i] == 'string') {
          message.push(fields[i].replace(/%/g, '%%'));
        } else {
          //properties always have a name
          message.push(fields[i].name);
          args.push(fields[i]);
          message.push('%' + args.length);
        }
      }

      var input = {type: "input_dummy"}; //properties are always input_dummies
      args.push(input);
      message.push('%' + args.length);
      lastInput = propertiesBlock;
    }
      propertiesBlock = propertiesBlock.nextConnection &&
          propertiesBlock.nextConnection.targetBlock();
  }


    //additional compositions (start counting from 6th entry)
    for(let i = 6; i<rootBlock.inputList.length; i++){
        let comp = rootBlock.inputList[i].fieldRow[0].value_;
        //push name of comp
        message.push(comp);
        args.push({type: "input_value", name: comp, check: comp});
        message.push('%' + args.length);
        lastInput = rootBlock.inputList[i];
    }

  // Remove last input if dummy and not empty. => will depend if user added value inputs...
  if (lastInput && lastInput.type == 'input_dummy') {
    var fields = lastInput.getInputTargetBlock('FIELDS');
    if (fields && FactoryUtils.getFieldsJson_(fields).join('').trim() != '') {
      args.pop();
      message.pop();
    }
  }
  JS.message0 = message.join(' ');
  if (args.length) {
    JS.args0 = args;
  }

  //update stuff for DB
  document.getElementById('nameDM').value = rootBlock.getFieldValue('DM_name');

  //"composed of" dropdown selection
  let superConcept = rootBlock.inputList[3].fieldRow[1].value_;
  if(superConcept == "Report"){ //top and bottom connections + color lime
      // Generate next/previous connections.
      JS.previousStatement =
          JSON.parse(
              FactoryUtils.getOptTypesFrom(rootBlock, 'TOPTYPE') || 'null');
      JS.nextStatement =
          JSON.parse(
              FactoryUtils.getOptTypesFrom(rootBlock, 'BOTTOMTYPE') || 'null');
      JS.colour = 60;
      //update type for saving it later to the DB
      document.getElementById('typeDM').value = "Report";

  } else { //test or study only has left connector
      JS.output =
          JSON.parse(
              FactoryUtils.getOptTypesFrom(rootBlock, 'OUTPUTTYPE') || 'null');
      if(superConcept == "Study"){
          JS.colour = 120; //default color blue for study
      } else { //tests are green
          JS.colour = 90;
          //here for now for all components, update type:
          document.getElementById('typeDM').value = "Component";
      }
  }

  JS.tooltip = rootBlock.getFieldValue('DM_description');
  JS.comment = rootBlock.getFieldValue('DM_description'); //use comment if not working

  return JSON.stringify(JS, null, '  ');
};

/**
 * Update the language code as JavaScript.
 * @param {string} blockType Name of block.
 * @param {!Blockly.Block} rootBlock Factory_base block.
 * @param {!Blockly.Workspace} workspace Where the root block lives.
 * @return {string} Generated language code.
 * @private
 */
//TODO: this code still uses study and test domain concepts which are now replaced by "component" so should be updated everywhere!
FactoryUtils.formatJavaScript_ = function(blockType, rootBlock, workspace) {
  var code = [];
  code.push("Blockly.Blocks['http://ontologies.vub.be/oecd#"+ blockType +"'] = {");
  code.push("  init: function() {");
  //push heading of block with name and abbreviation
  code.push("    this.appendDummyInput()\n" +
      "        .appendField(new Blockly.FieldLabelSerializable('"+ rootBlock.getFieldValue('DM_name') +"'), 'DM_name')\n" +
      "        .appendField(new Blockly.FieldLabelSerializable('("+ rootBlock.getFieldValue('DM_abbrev') +")'), 'DM_abbrev');");
  // Generate inputs.
  var TYPES = {'input_value': 'appendValueInput',
               'input_statement': 'appendStatementInput',
               'input_dummy': 'appendDummyInput'};
  let propertiesBlock = rootBlock.getInputTargetBlock('PROPERTIES');
  while (propertiesBlock) {
    if (!propertiesBlock.disabled && !propertiesBlock.getInheritedDisabled()) {
      // Dummy inputs don't have names.  Other inputs do.
      let name = "";
      //properties are always input_dummies
      let type = 'input_dummy';
      code.push('    this.' + TYPES[type] + '(' + name + ')');

      //let pName = propertiesBlock.getFieldValue('P_name');
      //let pType = propertiesBlock.getFieldValue('P_type');
      //let pValue = propertiesBlock.getFieldValue('P_value');


      let fields = FactoryUtils.getFieldsJs_(propertiesBlock);
      for (let i = 0; i < fields.length; i++) {
        code.push('        .appendField(' + fields[i] + ')');
      }
      // Add semicolon to last line to finish the statement.
      code[code.length - 1] += ';';
    }
    propertiesBlock = propertiesBlock.nextConnection &&
        propertiesBlock.nextConnection.targetBlock();
  }

  /*composed of dropdown selection
  let comp1 = rootBlock.inputList[5].fieldRow[1].value_;
  if(comp1 != "none"){
    code.push("    this.appendValueInput('"+ comp1 +"')\n" +
        "        .appendField('"+ comp1 +"')\n" +
        "        .setCheck('"+ comp1 +"')");
  }*/

  //additional compositions (start counting from 6th entry)
  for(let i = 6; i<rootBlock.inputList.length; i++){
    let comp = rootBlock.inputList[i].fieldRow[0].value_;
    code.push("    this.appendValueInput('"+ comp +"')\n" +
        "        .appendField('"+ comp +"')\n" +
        "        .setCheck('"+ comp +"')");
  }

  //composed of dropdown selection
  let superConcept = rootBlock.inputList[3].fieldRow[1].value_;
  if(superConcept == "Report"){ //top and bottom connections + color lime
    // Generate next/previous connections.
    code.push(
        FactoryUtils.connectionLineJs_('setPreviousStatement', 'TOPTYPE', workspace));
    code.push(
        FactoryUtils.connectionLineJs_('setNextStatement', 'BOTTOMTYPE', workspace));
    code.push("    this.setColour(60);");
    //update type for saving it later to the DB
    document.getElementById('typeDM').value = "Report";
  } else { //test or study only has left connector
    code.push(FactoryUtils.connectionLineJs_('setOutput', 'OUTPUTTYPE', workspace));
    if(superConcept == "Study"){
      code.push("    this.setColour(210);");//default color blue for study
    } else { //tests are green
      code.push("    this.setColour(90);");
      //here for now for all components, update type:
      document.getElementById('typeDM').value = "Component";
    }
  }
  code.push(" this.setCommentText('"+ rootBlock.getFieldValue('DM_description') +"');");
  //todo add this but should be depending on block's outputs, so replace connectionLineJs... (by ugly code ^^")
  //code.push(" this.setOutput(true, '"+ rootBlock.getFieldValue('DM_name') + "');"); //names must match to link blocks see example presentation
  code.push(" this.setTooltip('" + rootBlock.getFieldValue('DM_description') + "');");
  code.push('  }');
  code.push('};');
  return code.join('\n');
};

/**
 * Create JS code required to create a top, bottom, or value connection.
 * @param {string} functionName JavaScript function name.
 * @param {string} typeName Name of type input.
 * @param {!Blockly.Workspace} workspace Where the root block lives.
 * @return {string} Line of JavaScript code to create connection.
 * @private
 */
FactoryUtils.connectionLineJs_ = function(functionName, typeName, workspace) {
  var type = FactoryUtils.getOptTypesFrom(
      FactoryUtils.getRootBlock(workspace), typeName);
  if (type) {
    type = ', ' + type;
  } else {
    type = '';
  }
  return '    this.' + functionName + '(true' + type + ');';
};

/**
 * Returns field strings and any config.
 * @param {!Blockly.Block} block Input block.
 * @return {!Array.<string>} Field strings.
 * @private
 */
FactoryUtils.getFieldsJs_ = function(block) {
  var fields = [];
  while (block) {
    if (!block.disabled && !block.getInheritedDisabled()) {
      //check what type user chose for property
      fields.push(JSON.stringify(block.getFieldValue('P_name')));//always first name of property in text
      switch (block.getFieldValue('P_type')) {
        case 'field_static'://not used, could still be useful later
          // Result: 'hello'
          fields.push(JSON.stringify(block.getFieldValue('TEXT')));
          break;
        case 'field_label_serializable':
          // Result: new Blockly.FieldLabelSerializable('Hello'), 'GREET'
          fields.push('new Blockly.FieldLabelSerializable(' +
              JSON.stringify(block.getFieldValue('P_value')) + '), ' +
              JSON.stringify(block.getFieldValue('P_name')));
          break;
        case 'field_input':
          // Result: new Blockly.FieldTextInput('Hello'), 'GREET'
          fields.push('new Blockly.FieldTextInput(' +
              JSON.stringify(block.getFieldValue('P_value')) + '), ' +
              JSON.stringify(block.getFieldValue('P_name')));
          break;
        case 'field_number':
          // Result: new Blockly.FieldNumber(10, 0, 100, 1), 'NUMBER'
          let args = [
            Number(block.getFieldValue('P_value')),
          ];
          fields.push('new Blockly.FieldNumber(' + args.join(', ') + '), ' +
              JSON.stringify(block.getFieldValue('P_name')));
          break;
        case 'field_angle':
          // Result: new Blockly.FieldAngle(90), 'ANGLE'
          fields.push('new Blockly.FieldAngle(' +
              Number(block.getFieldValue('P_value')) + '), ' +
              JSON.stringify(block.getFieldValue('P_name')));
          break;
        case 'field_checkbox':
          // Result: new Blockly.FieldCheckbox('TRUE'), 'CHECK'
          fields.push('new Blockly.FieldCheckbox(' +
              JSON.stringify(block.getFieldValue('P_value')) +
               '), ' +
              JSON.stringify(block.getFieldValue('P_name')));
          break;
        case 'field_colour':
          // Result: new Blockly.FieldColour('#ff0000'), 'COLOUR'
          fields.push('new Blockly.FieldColour(' +
              JSON.stringify(block.getFieldValue('P_value')) +
              '), ' +
              JSON.stringify(block.getFieldValue('P_name')));
          break;
        case 'field_date':
          // Result: new Blockly.FieldDate('2015-02-04'), 'DATE'
          fields.push('new Blockly.FieldDate(' +
              JSON.stringify(block.getFieldValue('P_value')) + '), ' +
              JSON.stringify(block.getFieldValue('P_name')));
          break;
        case 'field_variable': //not used, could still be useful later
          // Result: new Blockly.FieldVariable('item'), 'VAR'
          var varname
              = JSON.stringify(block.getFieldValue('TEXT') || null);
          fields.push('new Blockly.FieldVariable(' + varname + '), ' +
              JSON.stringify(block.getFieldValue('FIELDNAME')));
          break;
        case 'field_dropdown': //not used yet, could still be useful later
          // Result:
          // new Blockly.FieldDropdown([['yes', '1'], ['no', '0']]), 'TOGGLE'
          var options = [];
          for (var i = 0; i < block.optionList_.length; i++) {
            options[i] = JSON.stringify([block.getUserData(i),
                                         block.getFieldValue('CPU' + i)]);
          }
          if (options.length) {
            fields.push('new Blockly.FieldDropdown([' +
                options.join(', ') + ']), ' +
                JSON.stringify(block.getFieldValue('FIELDNAME')));
          }
          break;
        case 'field_image': //not used, could still be useful later
          // Result: new Blockly.FieldImage('http://...', 80, 60, '*')
          var src = JSON.stringify(block.getFieldValue('SRC'));
          var width = Number(block.getFieldValue('WIDTH'));
          var height = Number(block.getFieldValue('HEIGHT'));
          var alt = JSON.stringify(block.getFieldValue('ALT'));
          var flipRtl = JSON.stringify(block.getFieldValue('FLIP_RTL'));
          fields.push('new Blockly.FieldImage(' +
              src + ', ' + width + ', ' + height +
              ', { alt: ' + alt + ', flipRtl: ' + flipRtl + ' })');
          break;
      }
    }
    block = false;//only one block while is actually not necessary...
  }
  return fields;
};

/**
 * Returns field strings and any config.
 * @param {!Blockly.Block} block Input block.
 * @return {!Array.<string|!Object>} Array of static text and field configs.
 * @private
 */
FactoryUtils.getFieldsJson_ = function(block) {
  var fields = [];
  while (block) {
    if (!block.disabled && !block.getInheritedDisabled()) {
      switch (block.getFieldValue('P_type')) {
        case 'field_static': //not used, could still be useful later
          // Result: 'hello'
          fields.push(block.getFieldValue('P_value'));
          break;
        case 'field_label_serializable':
          fields.push({
            type: block.getFieldValue('P_type'),
            name: block.getFieldValue('P_name'),
            text: block.getFieldValue('P_value')
          });
          break;
        case 'field_input':
          fields.push({
            type: block.getFieldValue('P_type'),
            name: block.getFieldValue('P_name'),
            text: block.getFieldValue('P_value')
          });
          break;
        case 'field_number':
          var obj = {
            type: block.getFieldValue('P_type'),
            name: block.getFieldValue('P_name'),
            value: Number(block.getFieldValue('P_value'))
          };
          fields.push(obj);
          break;
        case 'field_angle':
          fields.push({
            type: block.getFieldValue('P_type'),
            name: block.getFieldValue('P_name'),
            angle: Number(block.getFieldValue('P_value'))
          });
          break;
        case 'field_checkbox':
          fields.push({
            type: block.getFieldValue('P_type'),
            name: block.getFieldValue('P_name'),
            checked: block.getFieldValue('P_value') == 'TRUE'
          });
          break;
        case 'field_colour':
          fields.push({
            type: block.getFieldValue('P_type'),
            name: block.getFieldValue('P_name'),
            colour: block.getFieldValue('P_value')
          });
          break;
        case 'field_date':
          fields.push({
            type: block.getFieldValue('P_type'),
            name: block.getFieldValue('P_name'),
            date: block.getFieldValue('P_value')
          });
          break;
        case 'field_variable':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            variable: block.getFieldValue('TEXT') || null
          });
          break;
        case 'field_dropdown':
          var options = [];
          for (var i = 0; i < block.optionList_.length; i++) {
            options[i] = [block.getUserData(i),
                block.getFieldValue('CPU' + i)];
          }
          if (options.length) {
            fields.push({
              type: block.type,
              name: block.getFieldValue('FIELDNAME'),
              options: options
            });
          }
          break;
        case 'field_image':
          fields.push({
            type: block.type,
            src: block.getFieldValue('SRC'),
            width: Number(block.getFieldValue('WIDTH')),
            height: Number(block.getFieldValue('HEIGHT')),
            alt: block.getFieldValue('ALT'),
            flipRtl: block.getFieldValue('FLIP_RTL') == 'TRUE'
          });
          break;
      }
    }
    block = false;
  }
  return fields;
};

/**
 * Fetch the type(s) defined in the given input.
 * Format as a string for appending to the generated code.
 * @param {!Blockly.Block} block Block with input.
 * @param {string} name Name of the input.
 * @return {?string} String defining the types.
 */
FactoryUtils.getOptTypesFrom = function(block, name) {
  var types = FactoryUtils.getTypesFrom_(block, name);
  if (types.length == 0) {
    return undefined;
  } else if (types.indexOf('null') != -1) {
    return 'null';
  } else if (types.length == 1) {
    return types[0];
  } else {
    return '[' + types.join(', ') + ']';
  }
};


/**
 * Fetch the type(s) defined in the given input.
 * @param {!Blockly.Block} block Block with input.
 * @param {string} name Name of the input.
 * @return {!Array.<string>} List of types.
 * @private
 */
FactoryUtils.getTypesFrom_ = function(block, name) {
  var typeBlock = block.getInputTargetBlock(name);
  var types;
  if (!typeBlock || typeBlock.disabled) {
    types = [];
  } else if (typeBlock.type == 'type_other') {
    types = [JSON.stringify(typeBlock.getFieldValue('TYPE'))];
  } else if (typeBlock.type == 'type_group') {
    types = [];
    for (var n = 0; n < typeBlock.typeCount_; n++) {
      types = types.concat(FactoryUtils.getTypesFrom_(typeBlock, 'TYPE' + n));
    }
    // Remove duplicates.
    var hash = Object.create(null);
    for (var n = types.length - 1; n >= 0; n--) {
      if (hash[types[n]]) {
        types.splice(n, 1);
      }
      hash[types[n]] = true;
    }
  } else {
    types = [JSON.stringify(typeBlock.valueType)];
  }
  return types;
};

/**
 * Return the uneditable container block that everything else attaches to in
 * given workspace.
 * @param {!Blockly.Workspace} workspace Where the root block lives.
 * @return {Blockly.Block} Root block.
 */
FactoryUtils.getRootBlock = function(workspace) {
  var blocks = workspace.getTopBlocks(false);
  for (var i = 0, block; block = blocks[i]; i++) {
    if (block.type == 'DOMAINCONCEPT') {
      return block;
    }
  }
  return null;
};

// TODO(quachtina96): Move hide, show, makeInvisible, and makeVisible to a new
// AppView namespace.

/**
 * Hides element so that it's invisible and doesn't take up space.
 * @param {string} elementID ID of element to hide.
 */
FactoryUtils.hide = function(elementID) {
  document.getElementById(elementID).style.display = 'none';
};

/**
 * Un-hides an element.
 * @param {string} elementID ID of element to hide.
 */
FactoryUtils.show = function(elementID) {
  document.getElementById(elementID).style.display = 'block';
};

/**
 * Hides element so that it's invisible but still takes up space.
 * @param {string} elementID ID of element to hide.
 */
FactoryUtils.makeInvisible = function(elementID) {
  document.getElementById(elementID).visibility = 'hidden';
};

/**
 * Makes element visible.
 * @param {string} elementID ID of element to hide.
 */
FactoryUtils.makeVisible = function(elementID) {
  document.getElementById(elementID).visibility = 'visible';
};

/**
 * Create a file with the given attributes and download it.
 * @param {string} contents The contents of the file.
 * @param {string} filename The name of the file to save to.
 * @param {string} fileType The type of the file to save.
 */
FactoryUtils.createAndDownloadFile = function(contents, filename, fileType) {
  var data = new Blob([contents], {type: 'text/' + fileType});
  var clickEvent = new MouseEvent("click", {
    "view": window,
    "bubbles": true,
    "cancelable": false
  });

  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(data);
  a.download = filename;
  a.textContent = 'Download file!';
  a.dispatchEvent(clickEvent);
};

/**
 * Get Blockly Block by rendering pre-defined block in workspace.
 * @param {!Element} blockType Type of block that has already been defined.
 * @param {!Blockly.Workspace} workspace Workspace on which to render
 *    the block.
 * @return {!Blockly.Block} The Blockly.Block of desired type.
 */
FactoryUtils.getDefinedBlock = function(blockType, workspace) {
  workspace.clear();
  return workspace.newBlock(blockType);
};

/**
 * Parses a block definition get the type of the block it defines.
 * @param {string} blockDef A single block definition.
 * @return {string} Type of block defined by the given definition.
 */
FactoryUtils.getBlockTypeFromJsDefinition = function(blockDef) {
  var indexOfStartBracket = blockDef.indexOf('[\'');
  var indexOfEndBracket = blockDef.indexOf('\']');
  if (indexOfStartBracket != -1 && indexOfEndBracket != -1) {
    return blockDef.substring(indexOfStartBracket + 2, indexOfEndBracket);
  } else {
    throw Error('Could not parse block type out of JavaScript block ' +
        'definition. Brackets normally enclosing block type not found.');
  }
};

/**
 * Generates a category containing blocks of the specified block types.
 * @param {!Array.<!Blockly.Block>} blocks Blocks to include in the category.
 * @param {string} categoryName Name to use for the generated category.
 * @return {!Element} Category XML containing the given block types.
 */
FactoryUtils.generateCategoryXml = function(blocks, categoryName) {
  // Create category DOM element.
  var categoryElement = Blockly.utils.xml.createElement('category');
  categoryElement.setAttribute('name', categoryName);

  // For each block, add block element to category.
  for (var i = 0, block; block = blocks[i]; i++) {

    // Get preview block XML.
    var blockXml = Blockly.Xml.blockToDom(block);
    blockXml.removeAttribute('id');

    // Add block to category and category to XML.
    categoryElement.appendChild(blockXml);
  }
  return categoryElement;
};

/**
 * Parses a string containing JavaScript block definition(s) to create an array
 * in which each element is a single block definition.
 * @param {string} blockDefsString JavaScript block definition(s).
 * @return {!Array.<string>} Array of block definitions.
 */
FactoryUtils.parseJsBlockDefinitions = function(blockDefsString) {
  var blockDefArray = [];
  var defStart = blockDefsString.indexOf('Blockly.Blocks');

  while (blockDefsString.indexOf('Blockly.Blocks', defStart) != -1) {
    var nextStart = blockDefsString.indexOf('Blockly.Blocks', defStart + 1);
    if (nextStart == -1) {
      // This is the last block definition.
      nextStart = blockDefsString.length;
    }
    var blockDef = blockDefsString.substring(defStart, nextStart);
    blockDefArray.push(blockDef);
    defStart = nextStart;
  }
  return blockDefArray;
};

/**
 * Parses a string containing JSON block definition(s) to create an array
 * in which each element is a single block definition. Expected input is
 * one or more block definitions in the form of concatenated, stringified
 * JSON objects.
 * @param {string} blockDefsString String containing JSON block
 *    definition(s).
 * @return {!Array.<string>} Array of block definitions.
 */
FactoryUtils.parseJsonBlockDefinitions = function(blockDefsString) {
  var blockDefArray = [];
  var unbalancedBracketCount = 0;
  var defStart = 0;
  // Iterate through the blockDefs string. Keep track of whether brackets
  // are balanced.
  for (var i = 0; i < blockDefsString.length; i++) {
    var currentChar = blockDefsString[i];
    if (currentChar == '{') {
      unbalancedBracketCount++;
    }
    else if (currentChar == '}') {
      unbalancedBracketCount--;
      if (unbalancedBracketCount == 0 && i > 0) {
        // The brackets are balanced. We've got a complete block defintion.
        var blockDef = blockDefsString.substring(defStart, i + 1);
        blockDefArray.push(blockDef);
        defStart = i + 1;
      }
    }
  }
  return blockDefArray;
};

/**
 * Define blocks from imported block definitions.
 * @param {string} blockDefsString Block definition(s).
 * @param {string} format Block definition format ('JSON' or 'JavaScript').
 * @return {!Array.<!Element>} Array of block types defined.
 */
FactoryUtils.defineAndGetBlockTypes = function(blockDefsString, format) {
  var blockTypes = [];

  // Define blocks and get block types.
  if (format == 'JSON') {
    var blockDefArray = FactoryUtils.parseJsonBlockDefinitions(blockDefsString);

    // Populate array of blocktypes and define each block.
    for (var i = 0, blockDef; blockDef = blockDefArray[i]; i++) {
      var json = JSON.parse(blockDef);
      blockTypes.push(json.type);

      // Define the block.
      Blockly.Blocks[json.type] = {
        init: function() {
          this.jsonInit(json);
        }
      };
    }
  } else if (format == 'JavaScript') {
    var blockDefArray = FactoryUtils.parseJsBlockDefinitions(blockDefsString);

    // Populate array of block types.
    for (var i = 0, blockDef; blockDef = blockDefArray[i]; i++) {
      var blockType = FactoryUtils.getBlockTypeFromJsDefinition(blockDef);
      blockTypes.push(blockType);
    }

    // Define all blocks.
    eval(blockDefsString);
  }

  return blockTypes;
};

/**
 * Inject code into a pre tag, with syntax highlighting.
 * Safe from HTML/script injection.
 * @param {string} code Lines of code.
 * @param {string} id ID of <pre> element to inject into.
 */
FactoryUtils.injectCode = function(code, id) {
  var pre = document.getElementById(id);
  pre.textContent = code;
  // Remove the 'prettyprinted' class, so that Prettify will recalculate.
  pre.className = pre.className.replace('prettyprinted', '');
  PR.prettyPrint();
};

/**
 * Returns whether or not two blocks are the same based on their XML. Expects
 * XML with a single child node that is a factory_base block, the XML found on
 * Block Factory's main workspace.
 * @param {!Element} blockXml1 An XML element with a single child node that
 *    is a factory_base block.
 * @param {!Element} blockXml2 An XML element with a single child node that
 *    is a factory_base block.
 * @return {boolean} Whether or not two blocks are the same based on their XML.
 */
FactoryUtils.sameBlockXml = function(blockXml1, blockXml2) {
  // Each XML element should contain a single child element with a 'block' tag
  if (blockXml1.tagName.toLowerCase() != 'xml' ||
      blockXml2.tagName.toLowerCase() != 'xml') {
    throw Error('Expected two XML elements, received elements with tag ' +
        'names: ' + blockXml1.tagName + ' and ' + blockXml2.tagName + '.');
  }

  // Compare the block elements directly. The XML tags may include other meta
  // information we want to ignore.
  var blockElement1 = blockXml1.getElementsByTagName('block')[0];
  var blockElement2 = blockXml2.getElementsByTagName('block')[0];

  if (!(blockElement1 && blockElement2)) {
    throw Error('Could not get find block element in XML.');
  }

  var cleanBlockXml1 = FactoryUtils.cleanXml(blockElement1);
  var cleanBlockXml2 = FactoryUtils.cleanXml(blockElement2);

  var blockXmlText1 = Blockly.Xml.domToText(cleanBlockXml1);
  var blockXmlText2 = Blockly.Xml.domToText(cleanBlockXml2);

  // Strip white space.
  blockXmlText1 = blockXmlText1.replace(/\s+/g, '');
  blockXmlText2 = blockXmlText2.replace(/\s+/g, '');

  // Return whether or not changes have been saved.
  return blockXmlText1 == blockXmlText2;
};

/**
 * Strips the provided xml of any attributes that don't describe the
 * 'structure' of the blocks (i.e. block order, field values, etc).
 * @param {Node} xml The xml to clean.
 * @return {Node}
 */
FactoryUtils.cleanXml = function(xml) {
  var newXml = xml.cloneNode(true);
  var node = newXml;
  while (node) {
    // Things like text inside tags are still treated as nodes, but they
    // don't have attributes (or the removeAttribute function) so we can
    // skip removing attributes from them.
    if (node.removeAttribute) {
      node.removeAttribute('xmlns');
      node.removeAttribute('x');
      node.removeAttribute('y');
      node.removeAttribute('id');
    }

    // Try to go down the tree
    var nextNode = node.firstChild || node.nextSibling;
    // If we can't go down, try to go back up the tree.
    if (!nextNode) {
      nextNode = node.parentNode;
      while (nextNode) {
        // We are valid again!
        if (nextNode.nextSibling) {
          nextNode = nextNode.nextSibling;
          break;
        }
        // Try going up again. If parentNode is null that means we have
        // reached the top, and we will break out of both loops.
        nextNode = nextNode.parentNode;
      }
    }
    node = nextNode;
  }
  return newXml;
};

/**
 * Checks if a block has a variable field. Blocks with variable fields cannot
 * be shadow blocks.
 * @param {Blockly.Block} block The block to check if a variable field exists.
 * @return {boolean} True if the block has a variable field, false otherwise.
 */
FactoryUtils.hasVariableField = function(block) {
  if (!block) {
    return false;
  }
  return block.getVars().length > 0;
};

/**
 * Checks if a block is a procedures block. If procedures block names are
 * ever updated or expanded, this function should be updated as well (no
 * other known markers for procedure blocks beyond name).
 * @param {Blockly.Block} block The block to check.
 * @return {boolean} True if the block is a procedure block, false otherwise.
 */
FactoryUtils.isProcedureBlock = function(block) {
  return block &&
      (block.type == 'procedures_defnoreturn' ||
      block.type == 'procedures_defreturn' ||
      block.type == 'procedures_callnoreturn' ||
      block.type == 'procedures_callreturn' ||
      block.type == 'procedures_ifreturn');
};

/**
 * Returns whether or not a modified block's changes has been saved to the
 * Block Library.
 * TODO(quachtina96): move into the Block Factory Controller once made.
 * @param {!BlockLibraryController} blockLibraryController Block Library
 *    Controller storing custom blocks.
 * @return {boolean} True if all changes made to the block have been saved to
 *    the given Block Library.
 */
FactoryUtils.savedBlockChanges = function(blockLibraryController) {
  if (BlockFactory.isStarterBlock()) {
    return true;
  }
  var blockType = blockLibraryController.getCurrentBlockType();
  var currentXml = Blockly.Xml.workspaceToDom(BlockFactory.mainWorkspace);

  if (blockLibraryController.has(blockType)) {
    // Block is saved in block library.
    var savedXml = blockLibraryController.getBlockXml(blockType);
    return FactoryUtils.sameBlockXml(savedXml, currentXml);
  }
  return false;
};

/**
 * Given the root block of the factory, return the tooltip specified by the user
 * or the empty string if no tooltip is found.
 * @param {!Blockly.Block} rootBlock Factory_base block.
 * @return {string} The tooltip for the generated block, or the empty string.
 */
FactoryUtils.getTooltipFromRootBlock_ = function(rootBlock) {
  var tooltipBlock = rootBlock.getInputTargetBlock('TOOLTIP');
  if (tooltipBlock && !tooltipBlock.disabled) {
    return tooltipBlock.getFieldValue('TEXT');
  }
  return '';
};

/**
 * Given the root block of the factory, return the help url specified by the
 * user or the empty string if no tooltip is found.
 * @param {!Blockly.Block} rootBlock Factory_base block.
 * @return {string} The help url for the generated block, or the empty string.
 */
FactoryUtils.getHelpUrlFromRootBlock_ = function(rootBlock) {
  var helpUrlBlock = rootBlock.getInputTargetBlock('HELPURL');
  if (helpUrlBlock && !helpUrlBlock.disabled) {
    return helpUrlBlock.getFieldValue('TEXT');
  }
  return '';
};