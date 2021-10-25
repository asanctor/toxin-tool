// Add scrollbar support based on https://github.com/google/blockly/issues/110
function setBlocklyScrollBars(ws) {
    Blockly.bindEvent_(ws.svgGroup_, 'wheel', ws, ev => {
        let e = ev;
    const delta = e.deltaY > 0 ? -1 : 1;
    const position = Blockly.utils.mouseToSvg(e, ws.getParentSvg());
    if (e.ctrlKey)
        ws.zoom(position.x, position.y, delta);
    else if (ws.scrollbar) {
        let y = parseFloat(ws.scrollbar.vScroll.svgHandle_.getAttribute("y") || "0");
        y /= ws.scrollbar.vScroll.ratio_;
        ws.scrollbar.vScroll.set(y + e.deltaY);

        let x = parseFloat(ws.scrollbar.hScroll.svgHandle_.getAttribute("x") || "0");
        x /= ws.scrollbar.hScroll.ratio_;
        ws.scrollbar.hScroll.set(x + e.deltaX);

        ws.scrollbar.resize();
    }
    e.preventDefault();
});
}

function registerFirstContextMenuOptions() {
    const workspaceItem = {
        displayText: 'Save Structure',
        preconditionFn: function(scope) {
            if (scope.block.childBlocks_.length > 0) { //only show this option if block has some connected blocks otherwise this is useless
                return 'enabled';
            } else {
                return 'hidden';
			}
        },
        callback: function(scope) {
        	console.log(scope);
            saveStructure(scope.block);
            //$("#saveStructureModal").modal();
        },
        scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
        id: 'save_structure',
        weight: 10,
    };
    Blockly.ContextMenuRegistry.registry.register(workspaceItem);
}

function saveStructure(block) {
    let script = Blockly.Xml.blockToDomWithXY(block);
    let xmlScript = Blockly.Xml.domToPrettyText(script);
    let structure = {};
    structure["name"] = "structure";
    structure["xml"] = xmlScript;

    //call controller to save Structure to database
    $.ajax({
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        url: '/saveStructure',
        data: JSON.stringify(structure),
        success: function (data, status) {
            console.log(data + " and " + status);
            $("#saveDossier").click();
            let x = document.getElementById("snackbar");
            x.style["visibility"] = "visible";
            setTimeout(function(){ x.style["visibility"] = "hidden"; }, 4000);

        },
        error: function (data, status) {
            console.log("something went wrong; " + data.toString());
            //alert(status);
            $("#saveDossier").click();
            let x = document.getElementById("snackbar");
            x.style["visibility"] = "visible";
            setTimeout(function(){ x.style["visibility"] = "hidden"; }, 4000);
        }
    });
}
