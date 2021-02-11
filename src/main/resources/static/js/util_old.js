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