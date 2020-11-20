dojo.provide("ibm_gauge.widget.AnalogGauge");

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
				dojo.deprecated("ibm_gauge.widget.AnalogGauge", "Use dojox.widget.AnalogGauge instead.");
			}
		}
	}catch(e){}
})();

dojo.declare("ibm_gauge.widget.AnalogGauge",ibm_gauge.widget._Gauge,{
	// summary:
	//		a gauge built using the dojox.gfx package.
	//
	// description:
	//		using dojo.gfx (and thus either SVG or VML based on what is supported), this widget
	//		builds a gauge component, used to display numerical data in a familiar format 
	//
	// usage:
	//		<script type="text/javascript">
	//			dojo.require("ibm_gauge.widget.AnalogGauge");
	//			dojo.require("dijit.util.parser");
	//		</script>
	//		...
	//		<div	dojoType="ibm_gauge.widget.AnalogGauge"
	//				id="testGauge"
	//				gaugeWidth="300"
	//				gaugeHeight="200"
	//				cx=150
	//				cy=175
	//				radius=125
	//				image="gaugeOverlay.png"
	//				imageOverlay="false"
	//				imageWidth="280"
	//				imageHeight="155"
	//				imageX="12"
	//				imageY="38">
	//		</div>

	// gaugeWidth: Number
	// the width of the gauge (default is 300)
	gaugeWidth: 300,

	// gaugeHeight: Number
	// the height of the gauge (default is 200)
	gaugeHeight: 200,

	// startAngle: Number
	// angle (in degrees) for start of gauge (default is -90)
	startAngle: -90,

	// endAngle: Number
	// angle (in degrees) for end of gauge (default is 90)
	endAngle: 90,

	// cx: Number
	// center of gauge x coordinate (default is gauge width / 2)
	cx: 0,

	// cy: Number
	// center of gauge x coordinate (default is gauge height / 2)
	cy: 0,

	// radius: Number
	// radius of gauge (default is smaller of cx-25 or cy-25)
	radius: 0,

	startup: function(){
		// handle settings from HTML by making sure all the options are
		// converted correctly to numbers and that we calculate defaults
		// for cx, cy and radius
		// also connects mouse handling events

		if(this.getChildren){
			dojo.forEach(this.getChildren(), function(child){ child.startup(); });
		}

		this.startAngle = Number(this.startAngle);
		this.endAngle = Number(this.endAngle);

		this.cx = Number(this.cx);
		if(!this.cx){this.cx = this.gaugeWidth/2;}
		this.cy = Number(this.cy);
		if (!this.cy){this.cy = this.gaugeHeight/2;}
		this.radius = Number(this.radius);
		if(!this.radius){this.radius = Math.min(this.cx,this.cy) - 25;}

		ibm_gauge.widget.AnalogGauge.superclass.startup();

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
				}
			}
		}
	},

	getAngle: function(/*Number*/value){
		// summary:
		// 		This is a helper function used to determine the angle that represents
		// 		a given value on the gauge
		// value:	Number
		//			A value to be converted to an angle for this gauage.
		return (value - this.min)/(this.max - this.min)*(this.endAngle - this.startAngle) + this.startAngle;
	},

	getValueForAngle: function(/*Number*/angle){
		// summary:
		//		This is a helper function used to determie the value represented by a
		//		given angle on the gauge
		// angle:	Number
		//			A angle to be converted to a value for this gauge.
		return (angle - this.startAngle)*(this.max - this.min)/(this.endAngle - this.startAngle) + this.min;
	},

	getRadians: function(/*Number*/angle){
		// summary:
		//		This is a helper function than converts degrees to radians
		// angle:	Number
		//			An angle, in degrees, to be converted to radians.
		return angle*Math.PI/180;
	},

	getDegrees: function(/*Number*/radians){
		// summary:
		//		This is a helper function that converts radians to degrees
		// radians:	Number
		//			An angle, in radians, to be converted to degrees.
		return radians*180/Math.PI;
	},

	draw: function(){
		// summary:
		//		This function is used to draw (or redraw) the gauge.
		// description:
		//		Draws the gauge by drawing the surface, the ranges, and the indicators.
		if (!this.surface){this.createSurface();}

		var i;
		if (this.rangeData){
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

	drawRange: function(/*Object*/range) {
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
		//			size?:	Number
		//					the size of the range arc
		if(range.shape) {
			this.surface.remove(range.shape);
			range.shape = null;
		}
		if((range.low == this.min) && (range.high == this.max) && ((this.endAngle - this.startAngle) == 360)){
			path = this.surface.createCircle({cx: this.cx, cy: this.cy, r: this.radius});
		}else{
			var a1 = this.getRadians(this.getAngle(range.low));
			var a2 = this.getRadians(this.getAngle(range.high));
			var x1=this.cx+this.radius*Math.sin(a1);
			var y1=this.cy-this.radius*Math.cos(a1);
			var x2=this.cx+this.radius*Math.sin(a2);
			var y2=this.cy-this.radius*Math.cos(a2);
			var big=0;
			if((a2-a1)>Math.PI){big=1;}

			path = this.surface.createPath();
			if(range.size){
				path.moveTo(this.cx+(this.radius-range.size)*Math.sin(a1),
							this.cy-(this.radius-range.size)*Math.cos(a1));
			}else{
				path.moveTo(this.cx,this.cy);
			}
			path.lineTo(x1,y1);
			path.arcTo(this.radius,this.radius,0,big,1,x2,y2);
			if(range.size){
				path.lineTo(this.cx+(this.radius-range.size)*Math.sin(a2),
							this.cy-(this.radius-range.size)*Math.cos(a2));
				path.arcTo((this.radius-range.size),(this.radius-range.size),0,big,0,
							this.cx+(this.radius-range.size)*Math.sin(a1),
							this.cy-(this.radius-range.size)*Math.cos(a1));
			}
			path.closePath();
		}

		if(dojo.isArray(range.color) || dojo.isString(range.color)){
			path.setStroke({color: range.color});
			path.setFill(range.color);
		}else{
			// We've defined a style rather than an explicit color
			path.setStroke({color: "green"});	// Arbitrary color, just have to indicate
			path.setFill("green");				// that we want it filled
			path.getEventSource().setAttribute("class", range.color.style);
		}
		if(range.hover){
			path.getEventSource().setAttribute('hover',range.hover);
		}
		range.shape = path;
	},

	drawIndicator: function(/*Object*/indicator){
		// summary:
		//		this function is used to draw an indicator, or, if it already exists, call the move function
		// description:
		//		This method adds an indicator, such as a tick mark or needle, if it doesn't exist.  If it does,
		//		the existing indicator gets moved.
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

		if(!this.surface){this.createSurface();}

		if(indicator.shapes){
			this.moveIndicator(indicator);
		}else{
			if(indicator.text){
				this.surface.rawNode.removeChild(indicator.text);
				indicator.text = null;
			}

			var v = indicator.value;
			if(v < this.min){v = this.min;}
			if(v > this.max){v = this.max;}
			var a = this.getAngle(v);

			// save original settings
			var iColor = indicator.color;
			var iLength = indicator.length;
			var iWidth = indicator.width;
			var iOffset = indicator.offset;
			var iHighlight = indicator.highlight;

			// modify indicator with defaults 
			if(!indicator.color){indicator.color = '#000000';}
			if(!indicator.length){indicator.length = this.radius;}
			if(!indicator.width){indicator.width = 1;}
			if(!indicator.offset){indicator.offset = 0;}
			if(!indicator.highlight){indicator.highlight = '#d0d0d0';}

			indicator.shapes = indicator.getShapes(this, indicator);

			// restore original settings after callback
			indicator.color = iColor;
			indicator.length = iLength;
			indicator.width = iWidth;
			indicator.offset = iOffset;
			indicator.highlight = iHighlight;

			if(indicator.shapes){
				for(var s = 0; s < indicator.shapes.length; s++){
					indicator.shapes[s].setTransform([{dx:this.cx,dy:this.cy}, dojox.gfx.matrix.rotateg(a)]);
					if(indicator.hover){
						indicator.shapes[s].getEventSource().setAttribute('hover',indicator.hover);
					}
					if(indicator.onDragMove){
						//TODO
						this.connect(indicator.shapes[s].getEventSource(), 'onmousedown', this.handleMouseDown);
						indicator.shapes[s].getEventSource().style.cursor = 'pointer';
					}
				}
			}

			if(indicator.label){
				var len=indicator.length+indicator.offset;
				var x=this.cx+(len+5)*Math.sin(this.getRadians(a));
				var y=this.cy-(len+5)*Math.cos(this.getRadians(a));
				var align = 'left';
				if(a < 0){align = 'right';}
				var vAlign = 'bottom';
				if((a < -90) || (a > 90)){vAlign = 'top';}
				indicator.text = this.drawText(''+indicator.label, x, y, align,vAlign);
			}
			indicator.currentValue = indicator.value; 
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
		if(v < this.min){v = this.min;}
		if(v > this.max){v = this.max;}

		var c = indicator.currentValue;

		if(c!=v){
			if(c<v){
				if(v-c>1000){c+=100;
				}else if(v-c>100){c+=10;
				}else if(v-c>10){c+=1;
				}else if(v-c>5){c+=0.5;
				}else if(v-c<1){c=v;
				}else{c+=0.25;}
			}else if(c>v){
				if(c-v>1000){c-=100;
				}else if(c-v>100){c-=10;
				}else if(c-v>10){c-=1;
				}else if(c-v>5){c-=0.5;
				}else if(c-v<1){c=v;
				}else{c-=0.25;}
			}
			for(var i in indicator.shapes){
				indicator.shapes[i].setTransform([{dx:this.cx,dy:this.cy}, dojox.gfx.matrix.rotateg(this.getAngle(c))]);
				if(indicator.hover){
					indicator.shapes[i].getEventSource().setAttribute('hover',indicator.hover);
				}
			}
			indicator.currentValue = c;
			setTimeout(dojo.hitch(this, function(){this.moveIndicator(indicator)}), 5);
		}
	},

	_getLineShapes: function(/*Object*/gauge, /*Object*/indicator){
		// summary:
		//		This function is used to create the shapes for a basic indicator type
		//		of "line".
		// gauge:	Object
		//			The gauge object (this) to add the given indicator to
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
		var shapes = new Array();
		if(indicator.width == 1){
			shapes[0] = gauge.surface.createLine({x1: 0, y1: -indicator.offset, 
												  x2: 0, y2: -indicator.length-indicator.offset});
			shapes[0].setStroke({color: indicator.color});
		}
		if(indicator.width > 1){
			var x = Math.floor(indicator.width/2);
			var odd = (indicator.width & 1);
			var points = [{x:-x,	y:-indicator.offset},
						  {x:-x,	y:-indicator.length-indicator.offset},
						  {x:x+odd, y:-indicator.length-indicator.offset},
						  {x:x+odd, y:-indicator.offset},
			 			  {x:-x,	y:-indicator.offset}];
			shapes[0] = gauge.surface.createPolyline(points);
			shapes[0].setStroke({color: indicator.color});
			shapes[0].setFill(indicator.color);	
		}
		return shapes;
	},

	_getArrowShapes: function(/*Object*/gauge, /*Object*/indicator){
		// summary:
		//		This function is used to create the shapes for a basic indicator type
		//		of "arrow".
		// gauge:	Object
		//			The gauge object (this) to add the given indicator to
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
		var x = Math.floor(indicator.width/2);
		var head = indicator.width * 5;
		var odd = (indicator.width & 1);
		var shapes = new Array();
		var points = [{x:-x,	 y:0},
					  {x:-x,	 y:-indicator.length+head},
					  {x:-x-3,	 y:-indicator.length+head},
					  {x:0,		 y:-indicator.length},
					  {x:x+odd+3,y:-indicator.length+head},
					  {x:x+odd,	 y:-indicator.length+head},
					  {x:x+odd,	 y:0},
					  {x:-x,	 y:0}];
		shapes[0] = gauge.surface.createPolyline(points);
		shapes[0].setStroke({color: indicator.color});
		shapes[0].setFill(indicator.color);
		shapes[1] = gauge.surface.createLine({ x1:-x, y1: 0, x2: -x, y2:-indicator.length+head });
		shapes[1].setStroke({color: indicator.highlight});
		shapes[2] = gauge.surface.createLine({ x1:-x-3, y1: -indicator.length+head, x2: 0, y2:-indicator.length });
		shapes[2].setStroke({color: indicator.highlight});
		shapes[3] = gauge.surface.createCircle({cx: 0, cy: 0, r: x+3+1});
		shapes[3].setStroke({color: indicator.color});
		shapes[3].setFill(indicator.color);
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
		var y = event.clientY - pos.y;
		var r = Math.sqrt((y - this.cy)*(y - this.cy) + (x - this.cx)*(x - this.cx));
		if(r < this.radius){
			var angle = this.getDegrees(Math.atan2(y - this.cy, x - this.cx) + Math.PI/2);
			if(angle > 180){angle = angle - 360;}
			var value = this.getValueForAngle(angle);
			for(var i=0; (i<this.rangeData.length) && !range; i++){
				if((Number(this.rangeData[i].low) <= value) && (Number(this.rangeData[i].high) >= value)){
					range = this.rangeData[i];
				}
			}
		}
		return range;
	},

	_dragIndicator: function(/*Object*/ widget, /*Object*/ event){
		// get angle for mouse position
		var pos = dojo.coords(widget.gaugeContent);
		var x = event.clientX - pos.x;
		var y = event.clientY - pos.y;
		var angle = widget.getDegrees(Math.atan2(y - widget.cy, x - widget.cx) + Math.PI/2);
		if(angle > 180){angle = angle - 360;}
		// get value and restrict to our min/max
		var value = widget.getValueForAngle(angle);
		if(value < widget.min){value = widget.min;}
		if(value > widget.max){value = widget.max;}
		// update the indicator
		widget.drag.value = value;
		widget.drag.currentValue = value;
		// callback
		widget.drag.onDragMove(widget.drag);
		// rotate indicator
		for(var i=0; i<widget.drag.shapes.length; i++){
			widget.drag.shapes[i].setTransform([{dx:widget.cx,dy:widget.cy}, dojox.gfx.matrix.rotateg(widget.getAngle(widget.drag.value))]);
			if(widget.drag.hover){
				widget.drag.shapes[i].getEventSource().setAttribute('hover',widget.drag.hover);
			}
		}
		dojo.stopEvent(event);
	}
});