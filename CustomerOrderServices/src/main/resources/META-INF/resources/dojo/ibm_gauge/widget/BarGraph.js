dojo.provide("ibm_gauge.widget.BarGraph");

dojo.require("dojox.gfx");
dojo.require("ibm_gauge.widget._Gauge");

(function(){
	//Function to test and emit if this package is effectively deprecated at this dojo level
	//As it was contributed to dojo 1.3 and later.
	try{
		var v = dojo.version.toString();
		if(v){
			v = v.substring(0,3);
			v = parseFloat(v);
			if (v > 1.2) {
				dojo.deprecated("ibm_gauge.widget.BarGraph", "Use dojox.widget.BarGauge instead.");
			}
		}
	}catch(e){}
})();

dojo.declare("ibm_gauge.widget.BarGraph",ibm_gauge.widget._Gauge,{
	// summary:
	//		a bar graph built using the dojox.gfx package.
	//
	// description:
	//		using dojo.gfx (and thus either SVG or VML based on what is supported), this widget
	//		builds a bar graph component, used to display numerical data in a familiar format.
	//
	// usage:
	//		<script type="text/javascript">
	//			dojo.require("ibm_gauge.widget.BarGraph");
	//			dojo.require("dijit.util.parser");
	//		</script>
	//		...
	//		<div 	dojoType="ibm_gauge.widget.BarGraph"
	//				id="testBarGraph"
	//				barGraphHeight="55"
	//				dataY="25"
	//				dataHeight="25"
	//				dataWidth="225">
	//		</div>

	// barGraphWidth: Number
	// the width of the barGraph (default is 250)
	gaugeWidth: 250,

	// barGraphHeight: Number
	// the height of the barGraph (default is 35)
	gaugeHeight: 35,

	// dataX: Number
	// x position of data area (default 5)
	dataX: 5,

	// dataY: Number
	// y position of data area (default 5)
	dataY: 5,

	// dataWidth: Number
	// width of data area (default is bar graph width - 10)
	dataWidth: 0,

	// dataHeight: Number
	// height of data area (default is bar graph width - 10)
	dataHeight: 0,

	startup: function(){
		// handle settings from HTML by making sure all the options are
		// converted correctly to numbers 
		//
		// also connects mouse handling events

		if(this.getChildren){
			dojo.forEach(this.getChildren(), function(child){ child.startup(); });
		}

		if(this.dataX){this.dataX = Number(this.dataX);}
		if(this.dataY){this.dataY = Number(this.dataY);}
		if(this.dataWidth){this.dataWidth = Number(this.dataWidth);}
		if(this.dataHeight){this.dataHeight = Number(this.dataHeight);}

		if(!this.dataWidth){this.dataWidth = this.gaugeWidth - 10;}
		if(!this.dataHeight){this.dataHeight = this.gaugeHeight - 10;}

		ibm_gauge.widget.BarGraph.superclass.startup();

		this.connect(this.gaugeContent, 'onmousemove', this.handleMouseMove);
		this.connect(this.gaugeContent, 'onmouseover', this.handleMouseOver);
		this.connect(this.gaugeContent, 'onmouseout', this.handleMouseOut);
		this.connect(this.gaugeContent, 'onmouseup', this.handleMouseUp);

		if(this.hasChildren()){
			var children = this.getChildren();
			for(var i=0; i<children.length; i++){
				switch(children[i].declaredClass){
					case "ibm_gauge.widget.Range":
						this.addRange(children[i]);
						break;
					case "ibm_gauge.widget.Gradient":
						var tmp = children[i].getFillObject();
						if(tmp.x1 == -1){tmp.x1 = this.gaugeWidth;}
						if(tmp.x2 == -1){tmp.x2 = this.gaugeWidth;}
						if(tmp.y1 == -1){tmp.y1 = this.gaugeHeight;}
						if(tmp.y2 == -1){tmp.y2 = this.gaugeHeight;}
						this.gaugeBackground = tmp;
						this.draw();
						break;
					case "ibm_gauge.widget.Indicator":
						this.addIndicator(children[i]);
						break;
					case "ibm_gauge.widget.GradientColor":
					default:
						break;
				}
			}
		}
	},

	getPosition: function(/*Number*/value){
		// summary:
		//		This is a helper function used to determine the position that represents
		//		a given value on the bar graph
		// value:	Number
		//			A value to be converted to a position for this bar graph.

		return this.dataX + Math.floor((value - this.min)/(this.max - this.min)*this.dataWidth);
	},

	getValueForPosition: function(/*Number*/pos){
		// summary:
		//		This is a helper function used to determine the value represented by
		//		a position on the bar graph
		// pos:		Number
		//			A position to be converted to a value.
		return (pos - this.dataX)*(this.max - this.min)/this.dataWidth + this.min;
	},

	draw: function(){
		// summary:
		//		This function is used to draw (or redraw) the bar graph
		// description:
		//		Draws the bar graph by drawing the surface, the ranges, and the indicators.

		if (!this.surface) this.createSurface();

		var i;
		if(this.rangeData){
			for(i=0; i<this.rangeData.length; i++){
				this.drawRange(this.rangeData[i]);
			}
			if(this.img && this.imageOverlay){
				this.img.moveToFront();
			}
		}
		if(this.indicatorData){
			for(i=0; i<this.indicatorData.length; i++){
				this.drawIndicator(this.indicatorData[i]);
			}
		}
	},

	drawRange: function(/*Object*/range){
		// summary:
		//		This function is used to draw (or redraw) a range
		// description:
		//		Draws a range (colored area on the background of the gauge) 
		//		based on the given arguments.
		// range:
		//		A range is an object with the following contents:
		//		low: 	Number
		//					the low value of the range 
		//		high:	Number
		//					the high value of the range 
		//			hover:	String
		//					hover text
		//		color?:	String
		//					the color of the range

		if(range.shape){
			this.surface.remove(range.shape);
			range.shape = null;
		}

		var x1 = this.getPosition(range.low);
		var x2 = this.getPosition(range.high);
		
		path = this.surface.createRect({x:x1, 
										y:this.dataY, 
										width:x2-x1, 
										height:this.dataHeight});
		if(dojo.isArray(range.color) || dojo.isString(range.color)){
			path.setStroke({color: range.color});
			path.setFill(range.color);
		}else{
			// We've defined a style rather than an explicit color
			path.setStroke({color: "green"});	// Arbitrary color, just have to indicate
			path.setFill("green");				// that we want it filled
			path.getEventSource().setAttribute("class", range.color.style);
		}
		path.setStroke({color: range.color});
		path.setFill(range.color);
		if(range.hover){
			path.getEventSource().setAttribute('hover',range.hover);
		}
		range.shape = path;
	},

	drawIndicator: function(/*Object*/indicator, /*Boolean?*/dragging){
		// summary:
		// 		this function is used to draw an indicator, or, if it already exists, call the move or resize functions
		// description:
		//		This method adds an indicator, such as a tick mark or needle, if it doesn't exist.  If it does,
		//		the existing indicator gets moved or resized based on type.
		// indicator:
		//		An object with the following contents:
		//		value:		Number
		//						the value of the indicator. This generally refers to the location.
		//			type?:		String
		//						a string indicating on of the basic types provided by the widget for an indicator.
		//					Valid values for type are:
		//							"line"
		//							"bar"
		//			color?:		String
		//						color of indicator
		//			highlight?:	String
		//						highlight color of indicator
		//			length?:	Number
		//						length of the indicator
		//			width?:		Number
		//						width of the indicator
		//			offset?:	Number
		//						offset of indicator from center
		//			getShapes?:	String
		//						a callback function to create an array of shapes used to draw the indicator.
		//						The gauge widget and indicator will be passed as parameters to the callback 
		//			hover?:		String
		//						hover text
		//			label?:		String
		//						label text
		//			onDragMove?:String
		//						a callback function to allow the user to move an indicator
		//						by dragging it with the mouse.
		//						The indicator object will be updated wih a new value before 
		//						the callback and then passed as a parameter.  The callback 
		//						may modify the value and change the hover text.
		// dragging:	Boolean
		//				indicates whether we're currently dragging (whether this function
		//				was called by the mouse handling functions).  we don't want to try to
		//				animate while dragging, we'll just redraw.

		if(!this.surface){this.createSurface();}
		if(!dragging && indicator.shapes){
			this.moveIndicator(indicator);
		}else{
			if(indicator.shapes){
				for(var i=0; i<indicator.shapes.length; i++){
					this.surface.remove(indicator.shapes[i]);
				}
				indicator.shapes = null;
			}
			if(indicator.text) {
				this.surface.rawNode.removeChild(indicator.text);
				indicator.text = null;
			}

			// save original settings
			var iColor = indicator.color;
			var iLength = indicator.length;
			var iWidth = indicator.width;
			var iOffset = indicator.offset;
			var iHighlight = indicator.highlight;

			// modify indicator with defaults 
			if(!indicator.color){indicator.color = '#000000';}
			if(!indicator.length){indicator.length = this.dataHeight;}
			if(!indicator.width){indicator.width = 3;}
			if(!indicator.offset){indicator.offset = 0;}
			if(!indicator.highlight){indicator.highlight = '#4d4d4d';}
			if(!indicator.highlight2){indicator.highlight2 = '#a3a3a3';}

			indicator.shapes = indicator.getShapes(this, indicator);

			if(indicator.label){
				var v = indicator.value;
				if(v < this.min){v = this.min;}
				if(v > this.max){v = this.max;}
				var pos = this.getPosition(v);
				indicator.text = this.drawText(''+indicator.label, pos, this.dataY + indicator.offset - 5, 'left','bottom');
			}

			// restore original settings after callback
			indicator.color = iColor;
			indicator.length = iLength;
			indicator.width = iWidth;
			indicator.offset = iOffset;
			indicator.highlight = iHighlight;

			for(var i=0; i<indicator.shapes.length; i++){
				if(indicator.hover){
					indicator.shapes[i].getEventSource().setAttribute('hover',indicator.hover);
				}
				if(indicator.onDragMove){
					this.connect(indicator.shapes[i].getEventSource(), 'onmousedown', this.handleMouseDown);
					indicator.shapes[i].getEventSource().style.cursor = 'pointer';
				}
			}
		}
	},

	moveIndicator: function(/*Object*/indicator){
		// summary:
		//		Moves an existing indicator
		// description:
		//		If a indicator already exists, the drawIndicator function calls this function to move it
		//		rather than destroying and re-drawing.
		// indicator:
		//		An object with the following contents:
		//		value:		Number
		//						the value of the indicator. This generally refers to the location.
		//			type?:		String
		//						a string indicating on of the basic types provided by the widget for an indicator.
		//					Valid values for type are:
		//							"line"
		//							"bar"
		//						However, the moveIndicator function is only called for "line"-type indicators.
		//			color?:		String
		//						color of indicator
		//			highlight?:	String
		//						highlight color of indicator
		//			length?:	Number
		//						length of the indicator
		//			width?:		Number
		//						width of the indicator
		//			offset?:	Number
		//						offset of indicator from center
		//			getShapes?:	String
		//						a callback function to create an array of shapes used to draw the indicator.
		//						The gauge widget and indicator will be passed as parameters to the callback 
		//			hover?:		String
		//						hover text
		//			label?:		String
		//						label text
		//			onDragMove?:String
		//						a callback function to allow the user to move an indicator
		//						by dragging it with the mouse.
		//						The indicator object will be updated wih a new value before 
		//						the callback and then passed as a parameter.  The callback 
		//						may modify the value and change the hover text.
		if(indicator.type == 'bar'){
			this.resizeIndicator(indicator);
		}else{
			var v = indicator.value ;
			if(v < this.min){v = this.min;}
			if(v > this.max){v = this.max;}
			v = this.getPosition(v);

			var c = indicator.shapes[0].shape.x;
			if(indicator.shapes[0].matrix){c = c + indicator.shapes[0].matrix.dx;}
			if(c!=v){
				var jump ;
				if(c<v){
					if(v-c>30){jump = 15;
					}else if(v-c>15){jump = 10;
					}else if(v-c>10){jump = 5;
					}else if(v-c<1){jump = v-c;
					}else{jump = 1;}
				}else if(c>v){
					if(c-v>30){jump = -15;
					}else if(c-v>15){jump = -10;
					}else if(c-v>10){jump = -5;
					}else if(c-v<1){jump = c-v;
					}else{jump = -1;}
				}
				indicator.shapes[0].applyTransform(dojox.gfx.matrix.translate(jump,0));
				setTimeout(dojo.hitch(this, function(){this.moveIndicator(indicator)}), 5);
			}
		}
	},

	resizeIndicator: function(/*Object*/indicator){
		// summary:
		//		Resizes an existing indicator
		// description:
		//		If a indicator already exists, the drawIndicator function calls this function to resize it
		//		rather than destroying and re-drawing.
		// indicator:
		//		An object with the following contents:
		//		value:		Number
		//						the value of the indicator. This generally refers to the location.
		//			type?:		String
		//						a string indicating on of the basic types provided by the widget for an indicator.
		//					Valid values for type are:
		//							"line"
		//							"bar"
		//						However, the resizeIndicator function is only called for "bar"-type indicators
		//			color?:		String
		//						color of indicator
		//			highlight?:	String
		//						highlight color of indicator
		//			length?:	Number
		//						length of the indicator
		//			width?:		Number
		//						width of the indicator
		//			offset?:	Number
		//						offset of indicator from center
		//			getShapes?:	String
		//						a callback function to create an array of shapes used to draw the indicator.
		//						The gauge widget and indicator will be passed as parameters to the callback 
		//			hover?:		String
		//						hover text
		//			label?:		String
		//						label text
		//			onDragMove?:String
		//						a callback function to allow the user to move an indicator
		//						by dragging it with the mouse.
		//						The indicator object will be updated wih a new value before 
		//						the callback and then passed as a parameter.  The callback 
		//						may modify the value and change the hover text.
		var changed = false;
		var c;

		var v = indicator.value ;
		if(v < this.min){v = this.min;}
		if(v > this.max){v = this.max;}
		v = this.getPosition(v)-this.dataX;

		for(var i in indicator.shapes){
			i = indicator.shapes[i];
			if(i.shape.type == "line"){
				c = i.shape.x2-i.shape.x1;
			}else if(i.shape.type == "rect"){
				c = i.shape.width;
			}

			if(c != v){
				changed = true;
				var newShape = new Object();
				for(var j in i){
					newShape[j] = i[j];
				}
				if(c<v){
					if(v-c>30){c+=15;
					}else if(v-c>15){c+=10;
					}else if(v-c>5){c+=5;
					}else if(v-c<1){c=v;
					}else{c+=1;}
				}else if(c>v){
					if(c-v>30){c-=15;
					}else if(c-v>15){c-=10;
					}else if(c-v>5){c-=5;
					}else if(c-v<1){c=v;
					}else{c-=1;}
				}
				if(i.shape.type == "line"){
					newShape.shape.x2 = c+newShape.shape.x1;
				}else if(i.shape.type == "rect"){
					newShape.width = c;
				}
				i.setShape(newShape);
			}
		}
		if(changed){
			setTimeout(dojo.hitch(this, function(){this.resizeIndicator(indicator)}), 5);
		}
	},

	_getLineShapes: function(/*Object*/barGraph, /*Object*/indicator){
		// summary:
		//		This function is used to create the shapes for a basic indicator type
		//		of "line".
		// gauge:	Object
		//			The bar graph object (this) to add the given indicator to
		// indicator:
		//		An object with the following contents:
		//		value:		Number
		//						the value of the indicator. This generally refers to the location.
		//			type?:		String
		//						a string indicating on of the basic types provided by the widget for an indicator.
		//					Valid values for type are:
		//							"line"
		//							"arrow"
		//			color?:		String
		//						color of indicator
		//			highlight?:	String
		//						highlight color of indicator
		//			length?:	Number
		//						length of the indicator
		//			width?:		Number
		//						width of the indicator
		//			offset?:	Number
		//						offset of indicator from center
		//			getShapes?:	String
		//						a callback function to create an array of shapes used to draw the indicator.
		//						The gauge widget and indicator will be passed as parameters to the callback 
		//			hover?:		String
		//						hover text
		//			label?:		String
		//						label text
		//			onDragMove?:String
		//						a callback function to allow the user to move an indicator
		//						by dragging it with the mouse.
		//						The indicator object will be updated wih a new value before 
		//						the callback and then passed as a parameter.  The callback 
		//						may modify the value and change the hover text.
		var v = indicator.value;
		if(v < barGraph.min){v = barGraph.min;}
		if(v > barGraph.max){v = barGraph.max;}
		var pos = barGraph.getPosition(v);

		shapes = new Array();
		if(indicator.width > 1){
			shapes[0] = barGraph.surface.createRect({x:pos, 
													 y:barGraph.dataY + indicator.offset,
													 width:indicator.width, 
													 height:indicator.length});
			shapes[0].setStroke({color: indicator.color});
			shapes[0].setFill(indicator.color);
		}else{
			shapes[0] = barGraph.surface.createLine({ x1:pos, 
													  y1:barGraph.dataY + indicator.offset,
													  x2:pos, 
													  y2:barGraph.dataY + indicator.offset + indicator.length});
			shapes[0].setStroke({color: indicator.color});
		}
		return shapes;
	},

	_getBarShapes: function(/*Object*/barGraph, /*Object*/indicator){
		// summary:
		//		This function is used to create the shapes for a basic indicator type
		//		of "bar".
		// gauge:	Object
		//			The bar graph object (this) to add the given indicator to
		// indicator:
		//		An object with the following contents:
		//		value:		Number
		//						the value of the indicator. This generally refers to the location.
		//			type?:		String
		//						a string indicating on of the basic types provided by the widget for an indicator.
		//					Valid values for type are:
		//							"line"
		//							"arrow"
		//			color?:		String
		//						color of indicator
		//			highlight?:	String
		//						highlight color of indicator
		//			length?:	Number
		//						length of the indicator
		//			width?:		Number
		//						width of the indicator
		//			offset?:	Number
		//						offset of indicator from center
		//  		getShapes?:	String
		//						a callback function to create an array of shapes used to draw the indicator.
		//						The gauge widget and indicator will be passed as parameters to the callback 
		//			hover?:		String
		//						hover text
		//			label?:		String
		//						label text
		//			onDragMove?:String
		//						a callback function to allow the user to move an indicator
		//						by dragging it with the mouse.
		//						The indicator object will be updated wih a new value before 
		//						the callback and then passed as a parameter.  The callback 
		//						may modify the value and change the hover text.
		var v = indicator.value;
		if(v < barGraph.min){v = barGraph.min;}
		if(v > barGraph.max){v = barGraph.max;}
		var pos = barGraph.getPosition(v);
		if(pos == this.dataX){pos = this.dataX+1;}
		var y = barGraph.dataY + Math.floor((barGraph.dataHeight - indicator.width)/2) + indicator.offset;

		shapes = new Array();
		shapes[0] = barGraph.surface.createRect({x:barGraph.dataX, y:y, width:pos - barGraph.dataX, height:indicator.width});
		shapes[0].setStroke({color: indicator.color});
		shapes[0].setFill(indicator.color);
		shapes[1] = barGraph.surface.createLine({ x1:barGraph.dataX, y1:y, x2:pos, y2:y });
		shapes[1].setStroke({color: indicator.highlight});
		if(indicator.highlight2){
			y--;
			shapes[2] = barGraph.surface.createLine({ x1:barGraph.dataX, y1:y, x2:pos, y2:y });
			shapes[2].setStroke({color: indicator.highlight2});
		}

		return shapes;
	},

	getRangeUnderMouse: function(/*Object*/event){
		// summary:
		//		Determines which range the mouse is currently over
		// event:	Object
		//			The event object as received by the mouse handling functions below.
		var range = null;
		var pos = dojo.coords(this.gaugeContent);
		var x = event.clientX - pos.x;
		var value = widget.getValueForPosition(x);
		for(var i=0; (i<this.rangeData.length) && !range; i++) {
			if((Number(this.rangeData[i].low) <= value) && (Number(this.rangeData[i].high) >= value)){
				range = this.rangeData[i];
			}
		}
		return range;
	},

	_dragIndicator: function(/*Object*/ widget, /*Object*/ event){
		// get new value based on mouse position
		//var pos = dojo.html.abs(widget.barGraphContent);
		var pos = dojo.coords(widget.gaugeContent);
		var x = event.clientX - pos.x;
		var value = widget.getValueForPosition(x);
		if(value < widget.min){value = widget.min;}
		if(value > widget.max){value = widget.max;}
		// update the indicator
		widget.drag.value = value;
		// callback
		widget.drag.onDragMove(widget.drag);
		// redraw/move indicator(s)
		var found = false;
		for(var i=0; i<widget.indicatorData.length; i++){
			if(found) widget.moveIndicatorToFront(widget.indicatorData[i]);
			if(widget.indicatorData[i] == widget.drag){
				if(dojox.gfx.vml){
					widget.drawIndicator(widget.drag, true);
				}else{
					widget.drawIndicator(widget.drag);
				}
				found = true;
			}
		}
		dojo.stopEvent(event);
	}
});