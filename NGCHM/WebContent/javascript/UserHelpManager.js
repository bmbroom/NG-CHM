/**********************************************************************************
 * USER HELP FUNCTIONS:  The following functions handle the processing 
 * for user help popup windows for the detail canvas and the detail canvas buttons.
 **********************************************************************************/

//Define Namespace for NgChm UserHelpManager
NgChm.createNS('NgChm.UHM');

/**********************************************************************************
 * FUNCTION - userHelpOpen: This function handles all of the tasks necessary to 
 * generate help pop-up panels for the detail heat map and the detail heat map 
 * classification bars.  
 **********************************************************************************/
NgChm.UHM.userHelpOpen = function() {
	NgChm.UHM.hlpC();
    clearTimeout(NgChm.DET.detailPoint);
	var helpContents = document.createElement("TABLE");
	helpContents.id = 'helpTable';
    var orgW = window.innerWidth+window.pageXOffset;
    var orgH = window.innerHeight+window.pageYOffset;
    var helptext = NgChm.UHM.getDivElement("helptext");    
    helptext.innerHTML=("<a href='javascript:void(pasteHelpContents())' align='left'>Copy To Clipboard</a><img id='redX_btn' src='images/redX.png' alt='Close Help' onclick='NgChm.UHM.hlpC();' align='right'>");
    helptext.style.position = "absolute";
    document.getElementsByTagName('body')[0].appendChild(helptext);
    var rowElementSize = NgChm.DET.dataBoxWidth * NgChm.DET.canvas.clientWidth/NgChm.DET.canvas.width; // px/Glpoint
    var colElementSize = NgChm.DET.dataBoxHeight * NgChm.DET.canvas.clientHeight/NgChm.DET.canvas.height;

    // pixels
    var rowClassWidthPx = NgChm.DET.getRowClassPixelWidth();
    var colClassHeightPx = NgChm.DET.getColClassPixelHeight();
	var mapLocY = NgChm.DET.offsetY - colClassHeightPx;
	var mapLocX = NgChm.DET.offsetX - rowClassWidthPx;
	var objectType = "none";
    if (NgChm.DET.offsetY > colClassHeightPx) { 
    	if  (NgChm.DET.offsetX > rowClassWidthPx) {
    		objectType = "map";
    	}
    	if  (NgChm.DET.offsetX < rowClassWidthPx) {
    		objectType = "rowClass";
    	}
    } else {
    	if  (NgChm.DET.offsetX > rowClassWidthPx) {
    		objectType = "colClass";
    	}
    }
    if (objectType === "map") {
    	helpContents.insertRow().innerHTML = NgChm.UHM.formatBlankRow();
    	var row = Math.floor(NgChm.SEL.currentRow + (mapLocY/colElementSize)*NgChm.DET.getSamplingRatio('row'));
    	var col = Math.floor(NgChm.SEL.currentCol + (mapLocX/rowElementSize)*NgChm.DET.getSamplingRatio('col'));
    	if ((row <= NgChm.heatMap.getNumRows('d')) && (col <= NgChm.heatMap.getNumColumns('d'))) {
	    	var rowLabels = NgChm.heatMap.getRowLabels().labels;
	    	var colLabels = NgChm.heatMap.getColLabels().labels;
	    	NgChm.UHM.setTableRow(helpContents, ["<u>"+"Data Details"+"</u>", "&nbsp;"], 2);
	    	var matrixValue = NgChm.heatMap.getValue(NgChm.MMGR.DETAIL_LEVEL,row,col);
	     	if (matrixValue >= NgChm.SUM.maxValues) {
	    		matrixValue = "Missing Value";
	    	} else if (matrixValue <= NgChm.SUM.minValues) {
	    		return;
	    	} else {
	    		matrixValue = matrixValue.toFixed(5);
	    	}
	    	if (NgChm.SEL.mode === 'FULL_MAP') {
	    		matrixValue = matrixValue + "<br>(summarized)";
	    	}
	    	NgChm.UHM.setTableRow(helpContents,["&nbsp;Value:", matrixValue]);
	    	NgChm.UHM.setTableRow(helpContents,[ "&nbsp;Row:", rowLabels[row-1]]);
	    	NgChm.UHM.setTableRow(helpContents,["&nbsp;Column:", colLabels[col-1]]);
	    	helpContents.insertRow().innerHTML = NgChm.UHM.formatBlankRow();
	    	var writeFirstCol = true;
	    	var pos = row;
			var classBars = NgChm.heatMap.getRowClassificationData(); 
	    	var classBarsOrder = NgChm.heatMap.getRowClassificationOrder();
	       	if (classBarsOrder.length > 0) {
				NgChm.UHM.setTableRow(helpContents, ["&nbsp;<u>"+"Row Classifications"+"</u>", "&nbsp;"], 2);
		    	for (var i = 0;  i < classBarsOrder.length; i++){
		    		var key = classBarsOrder[i];
					var displayName = key;
					var classConfig = NgChm.heatMap.getRowClassificationConfig()[key];
					if (classConfig.show === 'Y') {
						if (key.length > 20){
							displayName = key.substring(0,20) + "...";
						}
			    		NgChm.UHM.setTableRow(helpContents,["&nbsp;&nbsp;&nbsp;"+displayName+":"+"</u>", classBars[key].values[pos-1]]);	
					}
		    	}
	       	}
	    	helpContents.insertRow().innerHTML = NgChm.UHM.formatBlankRow();
	    	pos = col
			var classBars = NgChm.heatMap.getColClassificationData(); 
	    	var classBarsOrder = NgChm.heatMap.getColClassificationOrder();
	       	if (classBarsOrder.length > 0) {
				NgChm.UHM.setTableRow(helpContents, ["&nbsp;<u>"+"Column Classifications"+"</u>", "&nbsp;"], 2);
		    	for (var i = 0;  i < classBarsOrder.length; i++){
		    		var key = classBarsOrder[i];
					var displayName = key;
					var classConfig = NgChm.heatMap.getColClassificationConfig()[key];
					if (classConfig.show === 'Y') {
						if (key.length > 20){
							displayName = key.substring(0,20) + "...";
						}
			    		NgChm.UHM.setTableRow(helpContents,["&nbsp;&nbsp;&nbsp;"+displayName+":"+"</u>", classBars[key].values[pos-1]]);	
					}
		    	}
	       	}
	        helptext.style.display="inherit";
	    	helptext.appendChild(helpContents);
	    	NgChm.UHM.locateHelpBox(helptext);
    	}
    } else if ((objectType === "rowClass") || (objectType === "colClass")) {
    	var pos, value, label;
    	var hoveredBar, hoveredBarColorScheme;                                                     //coveredWidth = 0, coveredHeight = 0;
    	if (objectType === "colClass") {
        	var col = Math.floor(NgChm.SEL.currentCol + (mapLocX/rowElementSize)*NgChm.DET.getSamplingRatio('col'));
        	var colLabels = NgChm.heatMap.getColLabels().labels;
        	label = colLabels[col-1];
    		var coveredHeight = 0;
    		pos = Math.floor(NgChm.SEL.currentCol + (mapLocX/rowElementSize));
    		var classBarsConfig = NgChm.heatMap.getColClassificationConfig(); 
    		var classBarsConfigOrder = NgChm.heatMap.getColClassificationOrder();
			for (var i = 0; i <  classBarsConfigOrder.length; i++) {
				var key = classBarsConfigOrder[i];
    			var currentBar = classBarsConfig[key];
    			if (currentBar.show === 'Y') {
	        		coveredHeight += NgChm.DET.canvas.clientHeight*currentBar.height/NgChm.DET.canvas.height;
	        		if (coveredHeight >= NgChm.DET.offsetY) {
	        			hoveredBar = key;
	        			hoveredBarValues = NgChm.heatMap.getColClassificationData()[key].values;
	        			break;
	        		}
    			}
    		}
        	var colorMap = NgChm.heatMap.getColorMapManager().getColorMap("col",hoveredBar);
    	} else {
    		var row = Math.floor(NgChm.SEL.currentRow + (mapLocY/colElementSize)*NgChm.DET.getSamplingRatio('row'));
        	var rowLabels = NgChm.heatMap.getRowLabels().labels;
        	label = rowLabels[row-1];
    		var coveredWidth = 0;
    		pos = Math.floor(NgChm.SEL.currentRow + (mapLocY/colElementSize));
    		var classBarsConfig = NgChm.heatMap.getRowClassificationConfig(); 
    		var classBarsConfigOrder = NgChm.heatMap.getRowClassificationOrder();
			for (var i = 0; i <  classBarsConfigOrder.length; i++) {
				var key = classBarsConfigOrder[i];
				var currentBar = classBarsConfig[key];
    			if (currentBar.show === 'Y') {
	        		coveredWidth += NgChm.DET.canvas.clientWidth*currentBar.height/NgChm.DET.canvas.width;
	        		if (coveredWidth >= NgChm.DET.offsetX){
	        			hoveredBar = key;
	        			hoveredBarValues = NgChm.heatMap.getRowClassificationData()[key].values;
	        			break;
	        		}
    			}
    		}
    		var colorMap = NgChm.heatMap.getColorMapManager().getColorMap("row",hoveredBar);
    	}
    	var value = hoveredBarValues[pos-1];
    	//No help popup when clicking on a gap in the class bar
    	if (value === '!CUT!') {
    		return;
    	}
    	var colors = colorMap.getColors();
    	var classType = colorMap.getType();
    	if ((value === 'null') || (value === 'NA')) {
        	value = "Missing Value";
    	}
    	var thresholds = colorMap.getThresholds();
    	var thresholdSize = 0;
    	// For Continuous Classifications: 
    	// 1. Retrieve continuous threshold array from colorMapManager
    	// 2. Retrieve threshold range size divided by 2 (1/2 range size)
    	// 3. If remainder of half range > .75 set threshold value up to next value, Else use floor value.
    	if (classType == 'continuous') {
    		thresholds = colorMap.getContinuousThresholdKeys();
    		var threshSize = colorMap.getContinuousThresholdKeySize()/2;
    		if ((threshSize%1) > .5) {
    			// Used to calculate modified threshold size for all but first and last threshold
    			// This modified value will be used for color and display later.
    			thresholdSize = Math.floor(threshSize)+1;
    		} else {
    			thresholdSize = Math.floor(threshSize);
    		}
    	}
    	
    	// Build TABLE HTML for contents of help box
		var displayName = hoveredBar;
		if (hoveredBar.length > 20){
			displayName = displayName.substring(0,20) + "...";
		}
		NgChm.UHM.setTableRow(helpContents, ["Label: ", "&nbsp;"+label]);
    	NgChm.UHM.setTableRow(helpContents, ["Covariate: ", "&nbsp;"+displayName]);
    	NgChm.UHM.setTableRow(helpContents, ["Value: ", "&nbsp;"+value]);
    	helpContents.insertRow().innerHTML = NgChm.UHM.formatBlankRow();
    	var rowCtr = 3 + thresholds.length;
    	var prevThresh = currThresh;
    	for (var i = 0; i < thresholds.length; i++){ // generate the color scheme diagram
        	var color = colors[i];
        	var valSelected = 0;
        	var valTotal = hoveredBarValues.length;
        	var currThresh = thresholds[i];
        	var modThresh = currThresh;
        	if (classType == 'continuous') {
        		// IF threshold not first or last, the modified threshold is set to the threshold value 
        		// less 1/2 of the threshold range ELSE the modified threshold is set to the threshold value.
        		if ((i != 0) &&  (i != thresholds.length - 1)) {
        			modThresh = currThresh - thresholdSize;
        		}
				color = colorMap.getRgbToHex(colorMap.getClassificationColor(modThresh));
        	}
        	
        	//Count classification value occurrences within each breakpoint.
        	for (var j = 0; j < valTotal; j++) {
        		classBarVal = hoveredBarValues[j];
        		if (classType == 'continuous') {
            		// Count based upon location in threshold array
            		// 1. For first threshhold, count those values <= threshold.
            		// 2. For second threshold, count those values >= threshold.
            		// 3. For penultimate threshhold, count those values > previous threshold AND values < final threshold.
            		// 3. For all others, count those values > previous threshold AND values <= final threshold.
        			if (i == 0) {
						if (classBarVal <= currThresh) {
       						valSelected++;
						}
        			} else if (i == thresholds.length - 1) {
        				if (classBarVal >= currThresh) {
        					valSelected++;
        				}
        			} else if (i == thresholds.length - 2) {
		        		if ((classBarVal > prevThresh) && (classBarVal < currThresh)) {
		        			valSelected++;
		        		}
        			} else {
		        		if ((classBarVal > prevThresh) && (classBarVal <= currThresh)) {
		        			valSelected++;
		        		}
        			}
        		} else {
                	var value = thresholds[i];
	        		if (classBarVal == value) {
	        			valSelected++;
	        		}
        		}
        	}
        	var selPct = Math.round(((valSelected / valTotal) * 100) * 100) / 100;  //new line
        	if (currentBar.bar_type === 'color_plot') {
            	NgChm.UHM.setTableRow(helpContents, ["<div class='input-color'><div class='color-box' style='background-color: " + color + ";'></div></div>", modThresh + " (n = " + valSelected + ", " + selPct+ "%)"]);
        	} else {
            	NgChm.UHM.setTableRow(helpContents, ["<div> </div></div>", modThresh + " (n = " + valSelected + ", " + selPct+ "%)"]);
        	}
        	prevThresh = currThresh;
    	}
    	var valSelected = 0;  
    	var valTotal = hoveredBarValues.length; 
    	for (var j = 0; j < valTotal; j++) { 
    		if ((hoveredBarValues[j] == "null") || (hoveredBarValues[j] == "NA")) { 
    			valSelected++;  
    		} 
    	} 
    	var selPct = Math.round(((valSelected / valTotal) * 100) * 100) / 100;  //new line
    	if (currentBar.bar_type === 'color_plot') {
			NgChm.UHM.setTableRow(helpContents, ["<div class='input-color'><div class='color-box' style='background-color: " +  colorMap.getMissingColor() + ";'></div></div>", "Missing Color (n = " + valSelected + ", " + selPct+ "%)"]);
    	} else {
			NgChm.UHM.setTableRow(helpContents, ["<div> </div></div>", "Missing Color (n = " + valSelected + ", " + selPct+ "%)"]);
    	}
		helptext.style.display="inherit";
    	helptext.appendChild(helpContents);
    	NgChm.UHM.locateHelpBox(helptext);
    } else {  
    	// on the blank area in the top left corner
    }

}

/**********************************************************************************
 * FUNCTION - pasteHelpContents: This function opens a browser window and pastes
 * the contents of the user help panel into the window.  
 **********************************************************************************/
function pasteHelpContents() {
    var el = document.getElementById('helpTable')
    window.open("","",'width=500,height=330,resizable=1').document.write(el.innerText.replace(/(\r\n|\n|\r)/gm, "<br>"));
}

/**********************************************************************************
 * FUNCTION - locateHelpBox: The purpose of this function is to set the location 
 * for the display of a pop-up help panel based upon the cursor location and the
 * size of the panel.
 **********************************************************************************/
NgChm.UHM.locateHelpBox = function(helptext) {
    var rowClassWidthPx = NgChm.DET.getRowClassPixelWidth();
    var colClassHeightPx = NgChm.DET.getColClassPixelHeight();
	var mapLocY = NgChm.DET.offsetY - colClassHeightPx;
	var mapLocX = NgChm.DET.offsetX - rowClassWidthPx;
	var mapH = NgChm.DET.canvas.clientHeight - colClassHeightPx;
	var mapW = NgChm.DET.canvas.clientWidth - rowClassWidthPx;
	var boxLeft = NgChm.DET.pageX;
	if (mapLocX > (mapW / 2)) {
		boxLeft = NgChm.DET.pageX - helptext.clientWidth - 10;
	}
	helptext.style.left = boxLeft;
	var boxTop = NgChm.DET.pageY;
	if ((boxTop+helptext.clientHeight) > NgChm.DET.canvas.clientHeight + 90) {
		if (helptext.clientHeight > NgChm.DET.pageY) {
			boxTop = NgChm.DET.pageY - (helptext.clientHeight/2);
		} else {
			boxTop = NgChm.DET.pageY - helptext.clientHeight;
		}
	}
	//Keep box from going off top of screen so data values always visible.
	if (boxTop < 0) {
		boxTop = 0;
	}
	helptext.style.top = boxTop;
}

/**********************************************************************************
 * FUNCTION - hlp: The purpose of this function is to generate a 
 * pop-up help panel for the tool buttons at the top of the detail pane. It receives
 * text from chm.html. If the screen has been split, it changes the test for the 
 * split screen button
 **********************************************************************************/
NgChm.UHM.hlp = function(e,text, width, reverse) {
	NgChm.UHM.hlpC();
    var helptext = document.createElement('div');
    helptext.id = 'bubbleHelp';
    helptext.style.display="none";
    NgChm.UHM.detailPoint = setTimeout(function(){
	    var elemPos = NgChm.UHM.getElemPosition(e);
	    var bodyElem = document.getElementsByTagName('body')[0];
	    if (bodyElem) {
	    	bodyElem.appendChild(helptext);
	    }
	    if (reverse !== undefined) {
	    	helptext.style.left = elemPos.left - width;
	    } else {
	    	helptext.style.left = elemPos.left;
	    }
    	helptext.style.top = elemPos.top + 20;
	    helptext.style.width = width;
		var htmlclose = "</font></b>";
		helptext.innerHTML = "<b><font size='2' color='#0843c1'>"+text+"</font></b>";
		helptext.style.display="inherit"; 
	},1500);
}

/**********************************************************************************
 * FUNCTION - getElemPosition: This function finds the help element selected's 
 * position on the screen and passes it back to the help function for display. 
 * The position returned is the position on the entire screen (not the panel that
 * the control is embedded in).  In this way, the help text bubble may be placed
 * on the document body.
 **********************************************************************************/
NgChm.UHM.getElemPosition = function(el) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

/**********************************************************************************
 * FUNCTION - hlpC: This function clears any bubble help box displayed on the screen.
 **********************************************************************************/
NgChm.UHM.hlpC = function() {
	clearTimeout(NgChm.UHM.detailPoint);
	var helptext = document.getElementById('bubbleHelp');
	if (helptext === null) {
		var helptext = document.getElementById('helptext');
	}
	if (helptext){
		helptext.remove();
	}
}

/**********************************************************************************
 * FUNCTION - userHelpClose: The purpose of this function is to close any open 
 * user help pop-ups and any active timeouts associated with those pop-up panels.
 **********************************************************************************/
NgChm.UHM.userHelpClose = function() {
	clearTimeout(NgChm.DET.detailPoint);
	var helptext = document.getElementById('helptext');
	if (helptext){
		helptext.remove();
	}
}

/**********************************************************************************
 * FUNCTION - getDivElement: The purpose of this function is to create and 
 * return a DIV html element that is configured for a help pop-up panel.
 **********************************************************************************/
NgChm.UHM.getDivElement = function(elemName) {
    var divElem = document.createElement('div');
    divElem.id = elemName;
    divElem.style.backgroundColor = 'CBDBF6'; 
    divElem.style.display="none";
    return divElem;
}

/**********************************************************************************
 * FUNCTION - setTableRow: The purpose of this function is to set a row into a help
 * or configuration html TABLE item for a given help pop-up panel. It receives text for 
 * the header column, detail column, and the number of columns to span as inputs.
 **********************************************************************************/
NgChm.UHM.setTableRow = function(tableObj, tdArray, colSpan, align) {
	var tr = tableObj.insertRow();
	tr.className = "chmTblRow";
	for (var i = 0; i < tdArray.length; i++) {
		var td = tr.insertCell(i);
		if (typeof colSpan != 'undefined') {
			td.colSpan = colSpan;
		}
		if (i === 0) {
			td.style.fontWeight="bold";
		}
		td.innerHTML = tdArray[i];
		if (typeof align != 'undefined') {
			td.align = align;
		}
	}
}

/**********************************************************************************
 * FUNCTION - formatBlankRow: The purpose of this function is to return the html
 * text for a blank row.
 **********************************************************************************/
NgChm.UHM.formatBlankRow = function() {
	return "<td style='line-height:4px;' colspan=2>&nbsp;</td>";
}

/**********************************************************************************
 * FUNCTION - addBlankRow: The purpose of this function is to return the html
 * text for a blank row.
 **********************************************************************************/
NgChm.UHM.addBlankRow = function(addDiv, rowCnt) {
	addDiv.insertRow().innerHTML = NgChm.UHM.formatBlankRow();
	if (typeof rowCnt !== 'undefined') {
		for (var i=1;i<rowCnt;i++) {
			addDiv.insertRow().innerHTML = NgChm.UHM.formatBlankRow();
		}
	}
	return;
}

NgChm.UHM.showSearchError = function(type) {
	var searchError = NgChm.UHM.getDivElement('searchError');
	searchError.style.display = 'inherit';
	var searchBar = document.getElementById('search_text');
	searchError.style.top = searchBar.offsetTop + searchBar.offsetHeight;
	searchError.style.left = searchBar.offsetLeft + searchBar.offsetWidth;
	switch (type){
		case 0: searchError.innerHTML = "No matching labels found"; break;
		case 1: searchError.innerHTML = "Exit dendrogram selection to go to " + NgChm.DET.currentSearchItem.label;break;
		case 2: searchError.innerHTML = "All " + NgChm.DET.currentSearchItem.axis +  " items are visible. Change the view mode to see " + NgChm.DET.currentSearchItem.label;break;
	}
	NgChm.UHM.hlpC();
	document.body.appendChild(searchError);
	setTimeout(function(){
		searchError.remove();
	}, 2000);
	
}

/**********************************************************************************
 * FUNCTION - saveHeatMapChanges: This function handles all of the tasks necessary 
 * display a modal window whenever the user requests to save heat map changes.  
 **********************************************************************************/
NgChm.UHM.saveHeatMapChanges = function() {
	NgChm.UHM.closeMenu();
	NgChm.UHM.initMessageBox();
	NgChm.UHM.setMessageBoxHeader("Save Heat Map");
	//Have changes been made?
	if (NgChm.heatMap.getUnAppliedChanges()) {
		if ((NgChm.heatMap.isFileMode()) || (typeof NgChm.galaxy !== "undefined")) {
			if (typeof NgChm.galaxy !== "undefined") {
				text = "<br>Changes to the heatmap cannot be saved in the Galaxy history.  Your modifications to the heatmap may be written to a downloaded NG-CHM file.";
			} else {
				text = "<br>You have elected to save changes made to this NG-CHM heat map file.<br><br>You may save them to a new NG-CHM file that may be opened using the NG-CHM File Viewer application.<br><br>";
			}
			NgChm.UHM.setMessageBoxText(text);
			NgChm.UHM.setMessageBoxButton(1, "images/saveNgchm.png", "Save To NG-CHM File", "NgChm.heatMap.saveHeatMapToNgchm");
			NgChm.UHM.setMessageBoxButton(4, "images/closeButton.png", "Cancel Save", "NgChm.UHM.messageBoxCancel");
		} else {
			// If so, is read only?
			if (NgChm.heatMap.isReadOnly()) {
				text = "<br>You have elected to save changes made to this READ-ONLY heat map. READ-ONLY heat maps cannot be updated.<br><br>However, you may save these changes to an NG-CHM file that may be opened using the NG-CHM File Viewer application.<br><br>";
				NgChm.UHM.setMessageBoxText(text);
				NgChm.UHM.setMessageBoxButton(1, "images/saveNgchm.png", "Save To NG-CHM File", "NgChm.heatMap.saveHeatMapToNgchm");
				NgChm.UHM.setMessageBoxButton(4, "images/closeButton.png", "Cancel Save", "NgChm.UHM.messageBoxCancel");
			} else {
				text = "<br>You have elected to save changes made to this heat map.<br><br>You have the option to save these changes to the original map OR to save them to an NG-CHM file that may be opened using the NG-CHM File Viewer application.<br><br>";
				NgChm.UHM.setMessageBoxText(text);
				NgChm.UHM.setMessageBoxButton(1, "images/saveNgchm.png", "Save To NG-CHM File", "NgChm.heatMap.saveHeatMapToNgchm");
				NgChm.UHM.setMessageBoxButton(2, "images/saveOriginal.png", "Save Original Heat Map", "NgChm.heatMap.saveHeatMapToServer");
				NgChm.UHM.setMessageBoxButton(3, "images/closeButton.png", "Cancel Save", "NgChm.UHM.messageBoxCancel");
			}
		}
	} else {
		text = "<br>There are no changes to save to this heat map at this time.<br><br>However, you may save the map as an NG-CHM file that may be opened using the NG-CHM File Viewer application.<br><br>";
		NgChm.UHM.setMessageBoxText(text);
		NgChm.UHM.setMessageBoxButton(1, "images/saveNgchm.png", "Save To NG-CHM File", "NgChm.heatMap.saveHeatMapToNgchm");
		NgChm.UHM.setMessageBoxButton(4, "images/closeButton.png", "Cancel Save", "NgChm.UHM.messageBoxCancel");
	}
	document.getElementById('msgBox').style.display = '';
}

/**********************************************************************************
 * FUNCTION - widgetHelp: This function displays a special help popup box for
 * the widgetized version of the NG-CHM embedded viewer.  
 **********************************************************************************/
NgChm.UHM.widgetHelp = function() {
	document.getElementById('ngchmLogos').style.display = '';
	NgChm.UHM.initMessageBox();
	NgChm.UHM.setMessageBoxHeader("About NG-CHM Viewer");
	var text = "<br>The NG-CHM Heat Map Viewer is a dynamic, graphical environment for exploration of clustered or non-clustered heat map data in a web browser. It supports zooming, panning, searching, covariate bars, and link-outs that enable deep exploration of patterns and associations in heat maps.<br><br><a href='https://bioinformatics.mdanderson.org/public-software/ngchm/' target='_blank'>Additional NG-CHM Information and Help</a><br><br><b>Software Version: </b>" + NgChm.CM.version+"<br><b>Map Version: </b>" +NgChm.heatMap.getMapInformation().version_id+"<br><br>";
	NgChm.UHM.setMessageBoxText(text);
	NgChm.UHM.setMessageBoxButton(3, "images/closeButton.png", "", "NgChm.UHM.messageBoxCancel");
	document.getElementById('msgBox').style.display = '';
}

/**********************************************************************************
 * FUNCTION - zipSaveNotification: This function handles all of the tasks necessary 
 * display a modal window whenever a zip file is being saved. The textId passed in
 * instructs the code to display either the startup save OR preferences save message.  
 **********************************************************************************/
NgChm.UHM.zipSaveNotification = function(autoSave) {
	var text;
	NgChm.UHM.initMessageBox();
	NgChm.UHM.setMessageBoxHeader("NG-CHM File Viewer");
	if (autoSave) {
		text = "<br>This NG-CHM archive file contains an out dated heat map configuration that has been updated locally to be compatible with the latest version of the NG-CHM Viewer.<br><br>In order to upgrade the NG-CHM and avoid this notice in the future, you will want to replace your original file with the version now being displayed.<br><br>";
		NgChm.UHM.setMessageBoxButton(1, "images/saveNgchm.png", "", "NgChm.heatMap.zipSaveNgchm");
	} else {
		text = "<br>You have just saved a heat map as a NG-CHM file.  In order to see your saved changes, you will want to open this new file using the NG-CHM File Viewer application.  If you have not already downloaded the application, press the Download Viewer button to get the latest version.<br><br>The application downloads as a single HTML file (ngchmApp.html).  When the download completes, you may run the application by simply double-clicking on the downloaded file.  You may want to save this file to a location of your choice on your computer for future use.<br><br>" 
		NgChm.UHM.setMessageBoxButton(1, "images/downloadViewer.png", "Download NG-CHM Viewer App", "NgChm.UHM.zipAppDownload");
	}
	NgChm.UHM.setMessageBoxText(text);
	NgChm.UHM.setMessageBoxButton(3, "images/cancelSmall.png", "", "NgChm.UHM.messageBoxCancel");
	document.getElementById('msgBox').style.display = '';
}

/**********************************************************************************
 * FUNCTION - viewerAppVersionExpiredNotification: This function handles all of the tasks 
 * necessary display a modal window whenever a user's version of the file application 
 * has been superceded and a new version of the file application should be downloaded. 
 **********************************************************************************/
NgChm.UHM.viewerAppVersionExpiredNotification = function(oldVersion, newVersion) {
	NgChm.UHM.initMessageBox();
	NgChm.UHM.setMessageBoxHeader("New NG-CHM File Viewer Version Available");
	NgChm.UHM.setMessageBoxText("<br>The version of the NG-CHM File Viewer application that you are running ("+oldVersion+") has been superceded by a newer version ("+newVersion+"). You will be able to view all pre-existing heat maps with this new backward-compatible version. However, you may wish to download the latest version of the viewer.<br><br>The application downloads as a single HTML file (ngchmApp.html).  When the download completes, you may run the application by simply double-clicking on the downloaded file.  You may want to save this file to a location of your choice on your computer for future use.<br><br>");
	NgChm.UHM.setMessageBoxButton(1, "images/downloadViewer.png", "Download NG-CHM Viewer App", "NgChm.UHM.zipAppDownload");
	NgChm.UHM.setMessageBoxButton(3, "images/closeButton.png", "", "NgChm.UHM.messageBoxCancel");
	document.getElementById('msgBox').style.display = '';
}

/**********************************************************************************
 * FUNCTION - hamburgerLinkMissing: This function handles all of the tasks 
 * necessary display a modal window whenever a user's clicks on a hamburger menu
 * link that has not had it's callback destination defined. 
 **********************************************************************************/
NgChm.UHM.hamburgerLinkMissing = function() {
	NgChm.UHM.initMessageBox();
	NgChm.UHM.setMessageBoxHeader("NG-CHM Menu Link Error");
	NgChm.UHM.setMessageBoxText("<br>No destination has been defined for the menu link.");
	NgChm.UHM.setMessageBoxButton(1, "images/closeButton.png", "", "NgChm.UHM.messageBoxCancel");
	document.getElementById('msgBox').style.display = '';
}

/**********************************************************************************
 * FUNCTION - zipAppDownload: This function calls the Matrix Manager to initiate
 * the download of the NG-CHM File Viewer application. 
 **********************************************************************************/
NgChm.UHM.zipAppDownload = function() {
	var dlButton = document.getElementById('msgBoxBtnImg_1');
	dlButton.style.display = 'none';
	NgChm.heatMap.downloadFileApplication();
}

/**********************************************************************************
 * FUNCTION - unappliedChangeNotification: This function handles all of the tasks necessary 
 * display a modal window whenever an unapplied change notification is required when
 * attempting to split screens after preferences have been applied.  
 **********************************************************************************/
NgChm.UHM.unappliedChangeNotification = function() {
	var text;
	NgChm.UHM.initMessageBox();
	NgChm.UHM.setMessageBoxHeader("Split Screen Preference Conflict");
	if (NgChm.heatMap.isReadOnly()) {
		text = "<br>There are un-applied preference changes that prevent the split-screen process from completing.<br><br>Since this is a READ-ONLY heatmap, you will need to reload the map without preference changes to access split screen mode.";
	} else {
		text = "<br>There are un-applied preference changes that prevent the split-screen process from completing.<br><br>You will need to either save them or cancel the process before the screen may be split.";
		NgChm.UHM.setMessageBoxButton(1, "images/prefSave.png", "Save Unapplied Changes", "NgChm.UHM.unappliedChangeSave");
	} 
	NgChm.UHM.setMessageBoxText(text);
	NgChm.UHM.setMessageBoxButton(3, "images/prefCancel.png", "", "NgChm.UHM.messageBoxCancel");
	document.getElementById('msgBox').style.display = '';
}

/**********************************************************************************
 * FUNCTION - unappliedChangeSave: This function performs a heatmap preferences 
 * save when the user chooses to save unapplied changes when performing a split
 * screen operation.  
 **********************************************************************************/
NgChm.UHM.unappliedChangeSave = function() {
	var success = NgChm.heatMap.saveHeatMapToServer();
	if (success === "true") {
		NgChm.heatMap.setUnAppliedChanges(false);
		NgChm.DET.detailSplit();
	}
	NgChm.UHM.initMessageBox();
}


/**********************************************************************************
 * FUNCTION - noWebGlContext: This function displays an error when no WebGl context
 * is available on the user's machine.
 **********************************************************************************/
NgChm.UHM.noWebGlContext = function(isDisabled) {
	NgChm.UHM.initMessageBox();
	NgChm.UHM.setMessageBoxHeader("ERROR: WebGL Initialization Failed");
	if (isDisabled) {
		NgChm.UHM.setMessageBoxText("<br>WebGL is available but is not enabled on your machine.  The NG-CHM Application requires the WebGL Javascript API in order to render images of Next Generation Clustered Heat Maps.<br><br>Instructions for enabling WebGL, based on browser type, can be found via a web search.");
	} else {
		NgChm.UHM.setMessageBoxText("<br>No WebGL context is available.  The NG-CHM Application requires the WebGL Javascript API in order to render images of Next Generation Clustered Heat Maps. Most web browsers and graphics processors support WebGL.<br><br>Please ensure that the browser that you are using and your computer's processor are WebGL compatible.");
	}
	NgChm.UHM.setMessageBoxButton(3, "images/prefCancel.png", "", "NgChm.UHM.messageBoxCancel");
	document.getElementById('msgBox').style.display = '';
}

/**********************************************************************************
 * FUNCTION - noWebGlContext: This function displays an error when no WebGl context
 * is available on the user's machine.
 **********************************************************************************/
NgChm.UHM.mapNotFound = function(heatMapName) {
	NgChm.UHM.initMessageBox();
	NgChm.UHM.setMessageBoxHeader("Requested Heat Map Not Found");
	NgChm.UHM.setMessageBoxText("<br>The Heat Map (" + heatMapName + ") that you requested cannot be found OR connectivity to the Heat Map repository has been interrupted.<br><br>Please check the Heat Map name and try again.");
	NgChm.UHM.setMessageBoxButton(3, "images/prefCancel.png", "", "NgChm.UHM.messageBoxCancel");
	document.getElementById('msgBox').style.display = '';
}

/**********************************************************************************
 * FUNCTION - linkoutError: This function displays a linkout error message.
 **********************************************************************************/
NgChm.UHM.linkoutError = function(msgText) {
	NgChm.UHM.initMessageBox();
	NgChm.UHM.setMessageBoxHeader("Heat Map Linkout"); 
	NgChm.UHM.setMessageBoxText(msgText);
	NgChm.UHM.setMessageBoxButton(3, "images/prefCancel.png", "", "NgChm.UHM.messageBoxCancel");
	document.getElementById('msgBox').style.display = '';
}


/**********************************************************************************
 * FUNCTION - invalidFileFormat: This function displays an error when the user selects
 * a file that is not an NG-CHM file.
 **********************************************************************************/
NgChm.UHM.invalidFileFormat = function() {
	NgChm.UHM.initMessageBox();
	NgChm.UHM.setMessageBoxHeader("Invalid File Format");
	NgChm.UHM.setMessageBoxText("<br>The file chosen is not an NG-CHM file.<br><br>Please select a .ngchm file and try again.");
	NgChm.UHM.setMessageBoxButton(3, "images/prefCancel.png", "", "NgChm.UHM.messageBoxCancel");
	document.getElementById('msgBox').style.display = '';
}

/**********************************************************************************
 * FUNCTIONS - MESSAGE BOX FUNCTIONS
 * 
 * We use a generic message box for most of the modal request windows in the 
 * application.  The following functions support this message box:
 * 1. initMessageBox - Initializes and hides the message box panel
 * 2. setMessageBoxHeader - Places text in the message box header bar.
 * 3. setMessageBoxText - Places text in the message box body.
 * 4. setMessageBoxButton - Configures and places a button on the message box.
 * 5. messageBoxCancel - Closes the message box when a Cancel is requested.  
 **********************************************************************************/
NgChm.UHM.initMessageBox = function() {
	var msgBox = document.getElementById('msgBox');
	var headerpanel = document.getElementById('mdaServiceHeader');
	document.getElementById('loader').style.display = 'none'
	msgBox.style.top = headerpanel.offsetTop + 15;
	
	document.getElementById('msgBox').style.display = 'none';
	document.getElementById('msgBoxBtnImg_1').style.display = 'none';
	document.getElementById('msgBoxBtnImg_2').style.display = 'none';
	document.getElementById('msgBoxBtnImg_3').style.display = 'none';
	document.getElementById('msgBoxBtnImg_4').style.display = 'none';
	document.getElementById('msgBoxBtnImg_1')['onclick'] = null;
	document.getElementById('msgBoxBtnImg_2')['onclick'] = null;
	document.getElementById('msgBoxBtnImg_3')['onclick'] = null;
	document.getElementById('msgBoxBtnImg_4')['onclick'] = null;
	var msgButton = document.getElementById('messageOpen_btn');
	msgButton.style.display = 'none'; 
}

NgChm.UHM.setMessageBoxHeader = function(headerText) {
	var msgBoxHdr = document.getElementById('msgBoxHdr');
	msgBoxHdr.innerHTML = headerText;
}

NgChm.UHM.setMessageBoxText = function(text) {
	var msgBoxTxt = document.getElementById('msgBoxTxt');
	msgBoxTxt.innerHTML = text;
}

NgChm.UHM.setMessageBoxButton = function(buttonId, imageSrc, altText, onClick) {
	var buttonImg = document.getElementById('msgBoxBtnImg_'+buttonId);
	buttonImg.style.display = '';
	buttonImg.src = imageSrc;
	buttonImg.alt = altText;
	var fn = eval("(function() {"+onClick+"();})");
	buttonImg.onclick=fn;
}

NgChm.UHM.messageBoxCancel = function() {
	NgChm.UHM.initMessageBox();
}

NgChm.UHM.openHelp = function() {
	NgChm.UHM.closeMenu();
	if (NgChm.MMGR.source !== NgChm.MMGR.WEB_SOURCE) {
		NgChm.UHM.widgetHelp();
	} else {
		var url = location.origin+location.pathname;
		window.open(url.replace("chm.html", "chmHelp.html"),'_blank');
	}
}

NgChm.UHM.openMenu = function(e) {
	var menu = document.getElementById('menuPanel');
	var parent = menu.parentElement;
	var parentTop = parent.offsetTop+50;
	menu.style.top = parentTop;
	if (menu.style.display === 'none') {
		menu.style.display = '';
		if (NgChm.MMGR.source !== NgChm.MMGR.WEB_SOURCE) {
			document.getElementById('menuAbout').style.display = 'none';
			document.getElementById('menuSpaceAbout').style.display = 'none';
			document.getElementById('spaceAboutBr').style.display = 'none';
			document.getElementById('aboutBr').style.display = 'none';
		}
	} else {
		menu.style.display = 'none';
	}
}

NgChm.UHM.closeMenu = function() {
	var barMenuBtn = document.getElementById('barMenu_btn');
	if (barMenuBtn !== null) {
		if (document.getElementById('barMenu_btn').mouseIsOver < 1) {
			var menu = document.getElementById('menuPanel');
			menu.style.display = 'none';
		}
	}
}

NgChm.UHM.menuOver = function(val) {
	var menuBtn = document.getElementById('barMenu_btn')
	if (val === 0) {
		menuBtn.setAttribute('src', 'images/barMenu.png');
	} else {
		menuBtn.setAttribute('src', 'images/barMenuHover.png');
	}
	menuBtn.mouseIsOver=val;
}

NgChm.UHM.colorOver = function(val) {
	var menuBtn = document.getElementById('colorMenu_btn')
	if (val === 0) {
		menuBtn.setAttribute('src', 'images/barColors.png');
	} else {
		menuBtn.setAttribute('src', 'images/barColorsHover.png');
	}
	menuBtn.mouseIsOver=val;
}


NgChm.UHM.fullBtnOver = function(btn,val) {
	if (NgChm.SEL.mode !=='NORMAL') {
		if (val === 0) {
			btn.setAttribute('src', 'images/full.png');
		} else {
			btn.setAttribute('src', 'images/fullHover.png');
		}
	}
}
NgChm.UHM.ribbonHBtnOver = function(btn,val) {
	if (NgChm.SEL.mode !=='RIBBONH') {
		if (val === 0) {
			btn.setAttribute('src', 'images/ribbonH.png');
		} else {
			btn.setAttribute('src', 'images/ribbonHHover.png');
		}
	}
}
NgChm.UHM.ribbonVBtnOver = function(btn,val) {
	if (NgChm.SEL.mode !=='RIBBONV') {
		if (val === 0) {
			btn.setAttribute('src', 'images/ribbonV.png');
		} else {
			btn.setAttribute('src', 'images/ribbonVHover.png');
		}
	}
}


/**********************************************************************************
 * FUNCTION - displayStartupWarnings: The purpose of this function is to display any
 * heat map startup warnings in a popup box when the user opens a heat map.  Multiple
 * possible warnings may be displayed in the box.
 **********************************************************************************/
NgChm.UHM.displayStartupWarnings = function() {
	NgChm.UHM.hlpC();
	NgChm.UHM.initMessageBox();
	var headingText = "NG-CHM Startup Warning";
	var warningText = "";
	var msgFound = false;
	var warningsFound = 1;
	if (NgChm.UTIL.getBrowserType() === 'IE') {
		warningText = "<br><b>Unsupported Browser Warning:</b> Your current browser is Internet Explorer. The NG-CHM application is optimized for use with the Google Chrome and Mozilla Firefox browsers.  While you may view maps in IE, the performance of the application cannot be guaranteed.<br><br>You may wish to switch to one of these supported browsers.";
		msgFound = true;
	} else {
		if (NgChm.DET.minLabelSize > 11) {
			if (msgFound) { warningText = warningText+"<br>" }
			warningText = warningText+"<br><b>Minimum Font Warning:</b> Current browser settings include a minimum font size setting that is too large. This will block the display of row, column, and covariate bar labels in the NG-CHM application. You may wish to turn off or adjust this setting in your browser."
			msgFound = true;
			warningsFound++;
		} 
		if (NgChm.DET.minLabelSize > 5) {
			if (msgFound) { warningText = warningText+"<br>" }
			warningText = warningText+"<br><b>Minimum Font Warning:</b> Current browser settings include a minimum font size setting. This may interfere with the display of row, column, and covariate bar labels in the NG-CHM application. You may wish to turn off or adjust this setting in your browser."
			msgFound = true;
			warningsFound++;
		}
	}
	if (warningsFound > 2) {
		headingText = headingText+"s"
	}
	NgChm.UHM.setMessageBoxHeader(headingText); 
	NgChm.UHM.setMessageBoxText(warningText);
	NgChm.UHM.setMessageBoxButton(3, "images/prefCancel.png", "", "NgChm.UHM.messageBoxCancel");
	document.getElementById('msgBox').style.display = '';
}

/*===========================================================
 * 
 * LINKOUT HELP MENU ITEM FUNCTIONS
 * 
 *===========================================================*/

/**********************************************************************************
 * FUNCTION - openLinkoutHelp: The purpose of this function is to construct an 
 * HTML tables for plugins associated with the current heat map AND plugins 
 * installed for the NG-CHM instance. Then the logic to display the linkout 
 * help box is called. 
 **********************************************************************************/
NgChm.UHM.openLinkoutHelp = function() {
	NgChm.UHM.closeMenu();
	var mapLinksTbl = NgChm.UHM.openMapLinkoutsHelp();
	var allLinksTbl = NgChm.UHM.openAllLinkoutsHelp();
	NgChm.UHM.linkoutHelp(mapLinksTbl,allLinksTbl);
}

/**********************************************************************************
 * FUNCTION - openMapLinkoutsHelp: The purpose of this function is to construct an 
 * HTML table object containing all of the linkout plugins that apply to a 
 * particular heat map. The table is created and then passed on to a linkout
 * popup help window.
 **********************************************************************************/
NgChm.UHM.openMapLinkoutsHelp = function() {
	var validPluginCtr = 0;
	var pluginTbl = document.createElement("TABLE");
	var rowLabels = NgChm.heatMap.getRowLabels().label_type;
	var colLabels = NgChm.heatMap.getColLabels().label_type;
	pluginTbl.insertRow().innerHTML = NgChm.UHM.formatBlankRow();
	var tr = pluginTbl.insertRow();
	var tr = pluginTbl.insertRow();
	for (var i=0;i<NgChm.CUST.customPlugins.length;i++) {
		var plugin = NgChm.CUST.customPlugins[i];
		var rowPluginFound = NgChm.UHM.isPluginFound(plugin, rowLabels);
		var colPluginFound = NgChm.UHM.isPluginFound(plugin, colLabels);
		var matrixPluginFound = NgChm.UHM.isPluginMatrix(plugin);
		var axesFound = matrixPluginFound && rowPluginFound && colPluginFound ? "Row, Column, Matrix" : rowPluginFound && colPluginFound ? "Row, Column" : rowPluginFound ? "Row" : colPluginFound ? "Column" : "None";
		//If there is at least one available plugin, fill table with plugin rows containing 5 cells
		if (rowPluginFound || colPluginFound) {
			//If first plugin being written to table, write header row.
			if (validPluginCtr === 0) {
				tr.className = "chmHdrRow";
				var td = tr.insertCell(0);
				td.innerHTML = "<b>Version</b>";
				td = tr.insertCell(0);
				td.innerHTML = "<b>Plugin Axes</b>";
				td = tr.insertCell(0);
				td.innerHTML = "<b>Description</b>";
				td = tr.insertCell(0);
				td.innerHTML = "<b>Name</b>";
				td = tr.insertCell(0);
				td.className = "chmHdrRow";
				td.innerHTML = "Website";
			}
			validPluginCtr++;
			var plugLogo;
			//If there is no plugin logo, replace it with hyperlink using plugin name
			var logoImage = typeof plugin.logo !== 'undefined' ? "<img src='"+ plugin.logo+"' width='100px'>" : plugin.name;
			var hrefSite = typeof plugin.site !== 'undefined' ? "<a href='"+plugin.site+"' target='_blank'> " : "<a>";
			var logo = hrefSite + logoImage + "</a>";
			var tr = pluginTbl.insertRow();
			tr.className = "chmTblRow";
			var tdLogo = tr.insertCell(0);
			tdLogo.className = "chmTblCell";
			tdLogo.innerHTML = logo;
			var tdName = tr.insertCell(1);
			tdName.className = "chmTblCell";
			tdName.style.fontWeight="bold";
			tdName.innerHTML = plugin.name;
			var tdDesc = tr.insertCell(2);
			tdDesc.className = "chmTblCell";
			tdDesc.innerHTML = plugin.description;
			var tdAxes = tr.insertCell(3);
			tdAxes.className = "chmTblCell";
			tdAxes.innerHTML = axesFound;
			var tdVersion = tr.insertCell(4);
			tdVersion.className = "chmTblCell";
			tdVersion.innerHTML = plugin.version;
		} 
	}
	if (validPluginCtr === 0) {
		var tr = pluginTbl.insertRow();
		tr.className = "chmTblRow";
		var tdLogo = tr.insertCell(0);
		tdLogo.className = "chmTblCell";
		tdLogo.innerHTML = "<B>NO AVAILABLE PLUGINS WERE FOUND FOR THIS HEATMAP</B>";

	}
	return pluginTbl;
}

/**********************************************************************************
 * FUNCTION - openAllLinkoutsHelp: The purpose of this function is to construct an 
 * HTML table object containing all of the linkout plugins that are installed for
 * the NG-CHM instance. The table is created and then passed on to a linkout
 * popup help window.
 **********************************************************************************/
NgChm.UHM.openAllLinkoutsHelp = function() {
	var validPluginCtr = 0;
	var pluginTbl = document.createElement("TABLE");
	pluginTbl.id = 'allPlugins';
	pluginTbl.insertRow().innerHTML = NgChm.UHM.formatBlankRow();
	var tr = pluginTbl.insertRow();
	var tr = pluginTbl.insertRow();
	for (var i=0;i<NgChm.CUST.customPlugins.length;i++) {
		var plugin = NgChm.CUST.customPlugins[i];
			//If first plugin being written to table, write header row.
			if (validPluginCtr === 0) {
				tr.className = "chmHdrRow";
				var td = tr.insertCell(0);
				td.innerHTML = "<b>Version</b>";
				td = tr.insertCell(0);
				td.innerHTML = "<b>Description</b>";
				td = tr.insertCell(0);
				td.innerHTML = "<b>Name</b>";
				td = tr.insertCell(0);
				td.className = "chmHdrRow";
				td.innerHTML = "Website";
			}
			validPluginCtr++;
			var plugLogo;
			//If there is no plugin logo, replace it with hyperlink using plugin name
			var logoImage = typeof plugin.logo !== 'undefined' ? "<img src='"+ plugin.logo+"' width='100px'>" : plugin.name;
			var hrefSite = typeof plugin.site !== 'undefined' ? "<a href='"+plugin.site+"' target='_blank'> " : "<a>";
			var logo = hrefSite + logoImage + "</a>";
			var tr = pluginTbl.insertRow();
			tr.className = "chmTblRow";
			var tdLogo = tr.insertCell(0);
			tdLogo.className = "chmTblCell";
			tdLogo.innerHTML = logo;
			var tdName = tr.insertCell(1);
			tdName.className = "chmTblCell";
			tdName.style.fontWeight="bold";
			tdName.innerHTML = plugin.name;
			var tdDesc = tr.insertCell(2);
			tdDesc.className = "chmTblCell";
			tdDesc.innerHTML = plugin.description;
			var tdVersion = tr.insertCell(3);
			tdVersion.className = "chmTblCell";
			tdVersion.innerHTML = plugin.version;
	}
	return pluginTbl;
}

/**********************************************************************************
 * FUNCTION - isPluginFound: The purpose of this function is to check to see if 
 * a given plugin is applicable for the current map based upon the label types.
 * Row or column label types are passed into this function.
 **********************************************************************************/
NgChm.UHM.isPluginFound = function(plugin,labels) {
	var pluginFound = false;
	if (plugin.name === "TCGA") {
		for (var l=0;l<labels.length;l++) {
			var tcgaBase = "bio.tcga.barcode.sample";
			if (labels[l] === tcgaBase) {
				pluginFound = true;
			}
			if (typeof NgChm.CUST.subTypes[tcgaBase] !== 'undefined') {
				for(var m=0;m<NgChm.CUST.subTypes[tcgaBase].length;m++) {
					var subVal = NgChm.CUST.subTypes[tcgaBase][m];
					if (labels[l] === subVal) {
						pluginFound = true;
					}
				}
			}
		}
	} else {
		for (var k=0;k<plugin.linkouts.length;k++) {
			var typeN = plugin.linkouts[k].typeName;
			for (var l=0;l<labels.length;l++) {
				var labelVal = labels[l];
				if (labelVal === typeN) {
					pluginFound = true;
				}
				if (typeof NgChm.CUST.superTypes[labelVal] !== 'undefined') {
					for(var m=0;m<NgChm.CUST.superTypes[labelVal].length;m++) {
						var superVal = NgChm.CUST.superTypes[labelVal][m];
						if (superVal === typeN) {
							pluginFound = true;
						}
					}
				}
			}
		}
	}
	return pluginFound;
}

/**********************************************************************************
 * FUNCTION - isPluginMatrix: The purpose of this function is to determine whether
 * a given plugin is also a Matrix plugin.
 **********************************************************************************/
NgChm.UHM.isPluginMatrix = function(plugin) {
	var pluginMatrix = false;
	if (typeof plugin.linkouts !== 'undefined') {
	for (var k=0;k<plugin.linkouts.length;k++) {
		var pluginName = plugin.linkouts[k].menuEntry;
		for (var l=0;l<linkouts.Matrix.length;l++) {
			var matrixName = linkouts.Matrix[l].title;
			if (pluginName === matrixName) {
				pluginMatrix = true;
			}
		}
	}
	}
	return pluginMatrix;
}

/**********************************************************************************
 * FUNCTION - linkoutHelp: The purpose of this function is to load and make visible
 * the linkout help popup window.
 **********************************************************************************/
NgChm.UHM.linkoutHelp = function(mapLinksTbl, allLinksTbl) {
	var linkBox = document.getElementById('linkBox');
	var linkBoxHdr = document.getElementById('linkBoxHdr');
	var linkBoxTxt = document.getElementById('linkBoxTxt');
	var linkBoxAllTxt = document.getElementById('linkBoxAllTxt');
	var pluginCtr = allLinksTbl.rows.length;
	var headerpanel = document.getElementById('mdaServiceHeader');
	document.getElementById('loader').style.display = 'none'
	linkBox.style.display = 'none';
	linkBox.style.top = headerpanel.offsetTop + 15;
	linkBox.style.right = "5%";
	linkBoxHdr.innerHTML = "NG-CHM Plug-in Information";
	linkBoxTxt.innerHTML = "";
	linkBoxTxt.appendChild(mapLinksTbl);
	mapLinksTbl.style.width = '100%';
	linkBoxAllTxt.innerHTML = "";
	linkBoxAllTxt.appendChild(allLinksTbl);
	allLinksTbl.style.width = '100%';
	NgChm.UHM.linkBoxSizing();
	NgChm.UHM.hideAllLinks();
	NgChm.UHM.showMapPlugins();
	document.getElementById('linkBox').style.display = '';
//	NgChm.UTIL.dragElement(document.getElementById("linkBox"));
}

/**********************************************************************************
 * FUNCTION - linkBoxCancel: The purpose of this function is to hide the linkout
 * help popup window.
 **********************************************************************************/
NgChm.UHM.linkBoxCancel = function() {
	var linkBox = document.getElementById('linkBox');
	linkBox.style.display = 'none';
}

/**********************************************************************************
 * FUNCTION - showMapPlugins: The purpose of this function is to show the map specific
 * plugins panel within the linkout help screen and toggle the appropriate
 * tab button.
 **********************************************************************************/
NgChm.UHM.showMapPlugins = function() {
	//Turn off all tabs
	NgChm.UHM.hideAllLinks();
	//Turn on map links div
	var linkBoxTxt = document.getElementById('linkBoxTxt');
	var mapLinksBtn = document.getElementById("mapLinks_btn");
	mapLinksBtn.setAttribute('src', 'images/mapLinksOn.png');
	linkBoxTxt.style.display="block";
}

/**********************************************************************************
 * FUNCTION - showAllPlugins: The purpose of this function is to show the all
 * plugins installed panel within the linkout help screen and toggle the appropriate
 * tab button.
 **********************************************************************************/
NgChm.UHM.showAllPlugins = function() {
	//Turn off all tabs
	NgChm.UHM.hideAllLinks();
	//Turn on all links div
	var linkBoxAllTxt = document.getElementById('linkBoxAllTxt');
	var allLinksBtn = document.getElementById("allLinks_btn");
	allLinksBtn.setAttribute('src', 'images/allLinksOn.png');
	linkBoxAllTxt.style.display="block";
}

/**********************************************************************************
 * FUNCTION - hideAllLinks: The purpose of this function is to hide the linkout
 * help boxes and reset the tabs associated with them.
 **********************************************************************************/
NgChm.UHM.hideAllLinks = function() {
	var linkBoxTxt = document.getElementById('linkBoxTxt');
	var linkBoxAllTxt = document.getElementById('linkBoxAllTxt');
	var mapLinksBtn = document.getElementById("mapLinks_btn");
	var allLinksBtn = document.getElementById("allLinks_btn");
	mapLinksBtn.setAttribute('src', 'images/mapLinksOff.png');
	linkBoxTxt.style.display="none";
	allLinksBtn.setAttribute('src', 'images/allLinksOff.png');
	linkBoxAllTxt.style.display="none";
}

/**********************************************************************************
 * FUNCTION - linkBoxSizing: The purpose of this function is to size the height
 * of the linkout help popup window depending on the number of plugins to be 
 * listed.
 **********************************************************************************/
NgChm.UHM.linkBoxSizing = function() {
	var linkBox = document.getElementById('linkBox');
	var pluginCtr = document.getElementById('allPlugins').rows.length;
	var linkBoxTxt = document.getElementById('linkBoxTxt');
	var linkBoxAllTxt = document.getElementById('linkBoxAllTxt');
	var contHeight = container.offsetHeight;
	if (pluginCtr === 0) {
		var boxHeight = contHeight *.30;
		var boxTextHeight = boxHeight * .40;
		if (boxHeight < 150) {
			boxHeight = contHeight *.35;
			boxTextHeight = boxHeight * .20;
		}
		linkBox.style.height = boxHeight;
		linkBoxTxt.style.height = boxTextHeight;
	} else {
		var boxHeight = contHeight *.92;
		linkBox.style.height = boxHeight;
		var boxTextHeight = boxHeight * .80;
		if (NgChm.MMGR.embeddedMapName !== null) {
			boxTextHeight = boxHeight *.60;
		}
		if (boxHeight < 400) {
			if (NgChm.MMGR.embeddedMapName !== null) {
				boxTextHeight = boxHeight *.60;
			} else {
				boxTextHeight = boxHeight * .70;
			}
		}
		linkBoxTxt.style.height = boxTextHeight;
		linkBoxAllTxt.style.height = boxTextHeight;
	}
}





