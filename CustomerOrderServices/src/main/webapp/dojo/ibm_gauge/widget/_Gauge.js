dojo.provide("ibm_gauge.widget._Gauge");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit._Container");

(function(){
	try{
		var v = dojo.version.toString();
		if(v){
			v = v.substring(0,3);
			v = parseFloat(v);
			if (v > 1.2) {
				//1.3 split this out, so we have to try to load it now.
				dojo.require("dijit._Contained");
			}
		}
	}catch(e){}
})();

dojo.require("dijit.Tooltip");
dojo.require("dojox.gfx");

dojo.declare("ibm_gauge.widget._Gauge",[dijit._Widget, dijit._Templated, dijit._Container],{
	// summary:
	//		a gauge built using the dojox.gfx package.
	//
	// description:
	//		using dojo.gfx (and thus either SVG or VML based on what is supported), this widget
	//		builds a gauge component, used to display numerical data in a familiar format 
	//
	// usage:
	//		this widget is not to be used alone. it is meant to be subclassed, such as
	//		ibm_gauge.widget.BarGraph or ibm_gauge.widget.AnalogGauge

	// gaugeWidth: Number
	// the width of the gauge (default is 300)
	gaugeWidth: 0,

	// gaugeHeight: Number
	// the height of the gauge (default is 200)
	gaugeHeight: 0,

	// gaugeBackground: Object|String
	// background color.  if this parameter is an object, it is
	// interpreted as a 'fill' object to set a gradient on the background.
	gaugeBackground: '#e0e0e0',

	// gaugeMin: Number
	// minimum value displayed by gauge (default is lowest range value)
	gaugeMin: 0,

	// gaugeMax: Number
	// maximum value displayed by gauge (default is largest range value)
	gaugeMax: 0,

	// image: String
	// background image for gauge (default is no image)
	image: '',

	// imageX: Number
	// position of background image x coordinate (default is 0)
	imageX: -1,

	// imageY: Number
	// position of background image y coordinate (default is 0)
	imageY: -1,

	// imageWidth: Number
	// width of background image (default is gauge width)
	imageWidth: 0,

	// imageHeight: Number
	// height of background image (default is gauge width)
	imageHeight: 0,

	// imageOverlay: Boolean
	// indicates background image is overlay (default is false)
	imageOverlay: false,

	// useRangeStyles: Number
	// indicates whether to use given css classes (ibmGaugeRangeXX)
	// to determine the color (and other style attributes?) of the ranges
	// this value should be the number of ibmGaugeRange classes that are 
	// defined, starting at ibmGaugeRange1 (0 indicates falling to default
	// hardcoded colors)
	useRangeStyles: 0,

	// hideValues: Boolean
	// indicates whether the text boxes showing the value of the gauge (as text 
	// content) should be hidden or shown.  Default is not hidden, aka shown.
	hideValues: false,

	// useTooltip: Boolean
	// indicates whether tooltips should be displayed for ranges, indicators, etc.
	useTooltip: true,

	// internal data
	gaugeContent: undefined,
	templatePath: dojo.moduleUrl("ibm_gauge", "widget/templates/_Gauge.html"),

	defaultColors: [[0x00,0x54,0xAA,1],
			[0x44,0x77,0xBB,1],
			[0x66,0x99,0xCC,1],
			[0x99,0xBB,0xEE,1],
			[0x99,0xCC,0xFF,1],
			[0xCC,0xEE,0xFF,1],
			[0xDD,0xEE,0xFF,1]],
	min: null,
	max: null,
	surface: null,
	rangeData: null,
	indicatorData: null,
	drag: null,
	img: null,
	overOverlay: false,
	lastHover: '',

	startup: function(){
		// handle settings from HTML by making sure all the options are
		// converted correctly to numbers and that we calculate defaults
		// for cx, cy and radius
		this.gaugeWidth = Number(this.gaugeWidth);
		this.gaugeHeight = Number(this.gaugeHeight);
		if(this.gaugeMin){this.min = Number(this.gaugeMin)};
		if(this.gaugeMax){this.max = Number(this.gaugeMax)};

		if(this.imageX != -1){this.imageX = Number(this.imageX)};
		if(this.imageY != -1){this.imageY = Number(this.imageY)};
		if(this.imageWidth){this.imageWidth = Number(this.imageWidth)};
		if(this.imageHeight){this.imageHeight = Number(this.imageHeight)};
	},

	postCreate: function(){
		if(this.hideValues){
			dojo.style(this.containerNode, "display", "none");
		}
		dojo.style(this.mouseNode, 'width', '0');
		dojo.style(this.mouseNode, 'height', '0');
		dojo.style(this.mouseNode, 'position', 'absolute');
		dojo.style(this.mouseNode, 'z-index', '100');
		if(this.useTooltip){
			dijit.showTooltip('test',this.mouseNode);
			dijit.hideTooltip(this.mouseNode);
		}
	},

	createSurface: function(){
		// summary:
		//		internal method used by the gauge to create the graphics surface area
		this.gaugeContent.style.width = this.gaugeWidth + 'px';
		this.gaugeContent.style.height = this.gaugeHeight + 'px';
		this.surface = dojox.gfx.createSurface(this.gaugeContent, this.gaugeWidth, this.gaugeHeight);
		if(dojox.gfx.vml){
			this.surface.rawNode.style.position = 'absolute';
		}
		var background = this.surface.createRect({x: 0, y: 0, width: this.gaugeWidth, height: this.gaugeHeight });
		background.setFill(this.gaugeBackground);

		if(this.image){
			var w = this.gaugeWidth;
			var h = this.gaugeHeight;
			if(this.imageWidth){w = this.imageWidth};
			if(this.imageHeight){h = this.imageHeight};
			this.img = this.surface.createImage({width: w, height: h, src: this.image});
			if(this.imageOverlay){
				this.img.getEventSource().setAttribute('overlay',true);
			}
			if(dojox.gfx.vml){
				try{
					//See if we can set transparency on the overlay, needed for dojo 1.2 or earlier.
					//1.3 this errors and thats okay, we can ignore.
					var end = this.image.substring(this.image.length - 3);
					if((end == 'png') || (end == 'PNG')){
						// use DirectX filter to correctly handle PNG transparency
						this.img.rawNode.firstChild.src = '';
						this.img.rawNode.firstChild.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+this.image+"',sizingMethod='scale');";
					}
				}catch(e){/*squelch*/}
			}
			var x = 0;
			if(this.imageX != -1){x = this.imageX;}
			if(this.imageY != -1){y = this.imageY;}
			if(x || y){this.img.setTransform({dx: x, dy: y});}
		}
	},

	addRange: function(/*Object*/range){
		// summary:
		// 		This method is used to add a range to the gauge.
		// description:
		//		Creates a range (colored area on the background of the gauge)
		//		based on the given arguments.
		// range:
		//		A range is either a ibm_gauge.widget.Range object, or a object
		//		with the following contents:
		//	  	low: 	Number
		//				the low value of the range 
		//	  	high:	Number
		//				the high value of the range 
		//		hover:	String
		//				hover text
		//	  	color?:	String
		//				the color of the range
		//		size?:	Number
		//				the size of the range arc
		this.addRanges([range]);
	},

	addRanges: function(/*Array*/ranges){
		// summary:
		// 		This method is used to add ranges to the gauge.  
		// description:
		//		Creates a range (colored area on the background of the gauge) 
		//		based on the given arguments.
		// range:
		//		A range is either a ibm_gauge.widget.Range object, or a object 
		//		with the following contents:
		//	  	low: 	Number
		//				the low value of the range 
		//	  	high:	Number
		//				the high value of the range 
		//		hover:	String
		//				hover text
		//	  	color?:	String
		//				the color of the range
		//		size?:	Number
		//				the size of the range arc
		if (!this.rangeData) this.rangeData = new Array();
		var range;
		for(var i=0; i<ranges.length; i++){
			range = ranges[i];
			if((this.min == null) || (range.low < this.min)){this.min = range.low;}
			if((this.max == null) || (range.high > this.max)){this.max = range.high;}

			if(!range.color){
				var colorIndex = this.rangeData.length % this.defaultColors.length;
				if(dojox.gfx.svg && this.useRangeStyles > 0){
					var colorIndex = (this.rangeData.length % this.useRangeStyles)+1;
					range.color = {style: "ibmGaugeRange"+colorIndex};
				}else{
					var colorIndex = this.rangeData.length % this.defaultColors.length;
					range.color = this.defaultColors[colorIndex];
				}
			}
			this.rangeData[this.rangeData.length] = range;
		}
		this.draw();
	},

	addIndicator: function(/*Object*/indicator){
		// summary:
		//		This method is used to add an indicator to the bar graph.
		// description:
		//		This method adds an indicator, such as a tick mark or needle,
		//		to the bar graph.
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
		//						length of "line" type indicators
		//			width?:		Number
		//						width of the indicator
		//			offset?:	Number
		//						offset of indicator from center
		//			getShapes?:	String
		//						a callback function to create an array of shapes used to draw the indicator.
		//						The bar graph widget and indicator will be passed as parameters to the callback 
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
		//		The ibm_gauge.widget.Indicator widget fulfills these qualifications.

		indicator._gauge = this;
		if(indicator.declaredClass !== 'ibm_gauge.widget.Indicator'){
			indicator = new ibm_gauge.widget.Indicator(indicator);
		}
		if(indicator.domNode.parentNode === null){
			this.containerNode.appendChild(indicator.domNode);
		}
		if(!this.indicatorData){this.indicatorData = new Array();}
		
		if(!indicator.getShapes){
			if(indicator.type == "line"){indicator.getShapes = this._getLineShapes;}
			if(indicator.type == "arrow"){indicator.getShapes = this._getArrowShapes;}
			if(indicator.type == "bar"){indicator.getShapes = this._getBarShapes;}
			if(!indicator.getShapes){indicator.getShapes = this._getLineShapes;}
		}

		this.indicatorData[this.indicatorData.length] = indicator;
		this.drawIndicator(indicator);
	},

	moveIndicatorToFront: function(/*Object*/indicator){
		// summary:
		//		This function is used to move an indicator the the front (top)
		//		of the gauge
		// indicator:
		//		An object with the following contents:
		//	  	value:		Number
		//					the value of the indicator. This generally refers to the location.
		//		type?:		String
		//					a string indicating on of the basic types provided by the widget for an indicator.
		//				  	Valid values for type are:
		//						"line"
		//			 			"arrow"
		//		color?:		String
		//					color of indicator
		//		highlight?:	String
		//					highlight color of indicator
		//		length?:	Number
		//					length of the indicator
		//		width?:		Number
		//					width of the indicator
		//		offset?:	Number
		//					offset of indicator from center
		//  	getShapes?:	String
		//					a callback function to create an array of shapes used to draw the indicator.
		//					The gauge widget and indicator will be passed as parameters to the callback 
		//		hover?:		String
		//					hover text
		//		label?:		String
		//					label text
		//		onDragMove?:String
		//					a callback function to allow the user to move an indicator
		//					by dragging it with the mouse.
		//					The indicator object will be updated wih a new value before 
		//					the callback and then passed as a parameter.  The callback 
		//					may modify the value and change the hover text.
		if(indicator.shapes){
			for(var i=0; i<indicator.shapes.length; i++){
				indicator.shapes[i].moveToFront();
			}
		}
	},

	drawText: function(/*String*/txt, /*Number*/x, /*Number*/y, /*String?*/align, /*String?*/vAlign){
		// summary:
		// 		This function is used draw text onto the gauge.  The text object
		// 		is also returned by the function so that may be removed later
		// 		by calling removeText
		// txt:		String
		//			The text to be drawn
		// x:		Number
		//			The x coordinate at which to place the text
		// y:		Number
		//			The y coordinate at which to place the text
		// align?:	String
		//			Indicates how to align the text
		//			Valid value is 'right', otherwise text is left-aligned
		// vAlign?:	String
		//			Indicates how to align the text vertically.
		//			Valid value is 'top', otherwise text is bottom-aligned

		var t = null;

		// VML version
		if(dojox.gfx.vml){
			// When using VML use a child DIV element
			// to contain the text since using VML text
			// shapes causes the parent span to reshape
			var t = document.createElement('div');
			t.style.position = 'absolute';
			if (align == 'right'){
				t.style.posRight = this.gaugeWidth - x;
			}else{
				t.style.posLeft = x;
			}
			if(vAlign == 'top'){
				t.style.posTop = y;
			}else{
				t.style.posBottom = this.gaugeHeight - y;
			}
		}

		// SVG version
		if(dojox.gfx.svg){
			var t = document.createElementNS("http://www.w3.org/2000/svg",'text');
			if(align == 'right'){
				t.setAttribute("text-anchor", "end");
			}
			t.setAttribute("x", x);
			if(vAlign == 'top'){
				t.setAttribute("y", y + 8);
			}else{
				t.setAttribute("y", y);
			}
		}

		if(t){
			t.appendChild(document.createTextNode(txt));
			this.surface.rawNode.appendChild(t);
		}

		return t;
	},

	removeText:function(/*String*/t){
		// summary:
		//		Removes a text element from the gauge.
		// t: 	String
		//		The text to remove.
		this.surface.rawNode.removeChild(t);
	},

	updateTooltip: function(/*String*/txt, /*Event*/ e){
		// summary:
		//		Updates the tooltip for the gauge to display the given text.
		// txt:		String
		//			The text to put in the tooltip.
		if(this.lastHover != txt){
			if(txt != ''){ 
				dijit.hideTooltip(this.mouseNode);
				dijit.showTooltip(txt,this.mouseNode);
			}else{
				dijit.hideTooltip(this.mouseNode);
			}
			this.lastHover = txt;
		}
	},

	handleMouseOver: function(/*Object*/event){
		// summary:
		//		This is an internal handler used by the gauge to support 
		//		hover text
		// event:	Object
		//			The event object
		var hover = event.target.getAttribute('hover');
		if(event.target.getAttribute('overlay')){
			this.overOverlay = true;
			var r = this.getRangeUnderMouse(event);
			if(r && r.hover){
				hover = r.hover;
			}
		}
		if(this.useTooltip && !this.drag){
			if(hover){
				this.updateTooltip(hover, event);
			}else{
				this.updateTooltip('', event);
			}
		}
	},

	handleMouseOut: function(/*Object*/event){
		// summary:
		//		This is an internal handler used by the gauge to support 
		//		hover text
		// event:	Object
		//			The event object
		if(event.target.getAttribute('overlay')){
			this.overOverlay = false;
		}
		if(this.useTooltip && this.mouseNode){
			dijit.hideTooltip(this.mouseNode);
		}
	},

	handleMouseDown: function(/*Object*/event){
		// summary:
		//		This is an internal handler used by the gauge to support using
		//		the mouse to drag an indicator to modify it's value
		// event:	Object
		//			The event object

		// find the indicator being dragged
		for(var i=0; i<this.indicatorData.length; i++){
			var shapes = this.indicatorData[i].shapes;
			for(var s=0; s<shapes.length; s++){
				if(shapes[s].getEventSource() == event.target){
					 this.drag = this.indicatorData[i];
					 s = shapes.length;
					 i = this.indicatorData.length;
				}
			}
		}
		dojo.stopEvent(event);
	},

	handleMouseUp: function(/*Object*/event){
		// summary:
		//		This is an internal handler used by the gauge to support using
		//		the mouse to drag an indicator to modify it's value
		// event:	Object
		//			The event object
		this.drag = null;
		dojo.stopEvent(event);
	},

	handleMouseMove: function(/*Object*/event){
		// summary:
		//		This is an internal handler used by the gauge to support using
		//		the mouse to drag an indicator to modify it's value
		// event:	Object
		//			The event object
		if(event){
			dojo.style(this.mouseNode, 'left', event.pageX+1+'px');
			dojo.style(this.mouseNode, 'top', event.pageY+1+'px');
		}
		if(this.drag){
			this._dragIndicator(this, event);
		}else{
			if(this.useTooltip && this.overOverlay){
				var r = this.getRangeUnderMouse(event);
				if(r && r.hover){
					this.updateTooltip(r.hover, event);
				}else{
					this.updateTooltip('', event);
				}
			}
		}
	}
});

dojo.declare("ibm_gauge.widget.Range",[dijit._Widget, dijit._Contained],{
	// summary:
	//		a range to be used in a _Gauge
	//
	// description:
	//		a range widget, which has given properties.  drawn by a _Gauge.
	//
	// usage:
	//		<script type="text/javascript">
	//			dojo.require("ibm_gauge.widget.AnalogGauge");
	//			dojo.require("ibm_gauge.widget.Range");
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
	//			<div	dojoType="ibm_gauge.widget.Range"
	//					low=5
	//					high=10
	//					hover="5 - 10"
	//			></div>
	//			<div	dojoType="ibm_gauge.widget.Range"
	//					low=10
	//					high=20
	//					hover="10 - 20"
	//			></div>
	//		</div>
	
	// low: Number
	// the low value of the range 
	low: 0,
	
	// high: Numbe
	// the high value of the range
	high: 0,
	
	// hover: String
	// the text to put in the tooltip for the gauge
	hover: '',
	
	// color: String|Gradient
	// the color of the range.  this could be a string or a ibm_gauge.widget.Gradient
	color: '',
	
	// size: Number
	// for a circular gauge (such as an AnalogGauge), this dictates the size of the arc 
	size: 0
});

dojo.declare("ibm_gauge.widget.Gradient",[dijit._Widget, dijit._Templated, dijit._Container, dijit._Contained],{
	// summary:
	//		a gradient background, to be used by a _Gauge
	//
	// description:
	//		a gradient background, which has given properties.  drawn by a _Gauge.
	//
	// usage:
	//		<script type="text/javascript">
	//			dojo.require("ibm_gauge.widget.AnalogGauge");
	//			dojo.require("ibm_gauge.widget.Range");
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
	//			<div	dojoType="ibm_gauge.widget.Gradient"
	//					type="linear"
	//					x1=0
	//					x2=0
	//					y2=0>
	//				<div	dojoType="ibm_gauge.widget.GradientColor"
	//						offset=0
	//						color="#ECECEC"></div>
	//				<div	dojoType="ibm_gauge.widget.GradientColor"
	//						offset=1
	//						color="white"></div>
	//			</div>
	//		</div>
	templateString: '<div type="${type}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" dojoattachpoint="containerNode"></div>',

	// type: String
	// type of gradient, see dojox.gfx.*
	type: "linear",

	// x1: Number?
	// x coordinate of where the gradient should start. if ommitted, during startup
	// this will be initialized to the parent gauge's width
	x1: -1,

	// x2: Number?
	// x coordinate of where the gradient should end.  if ommitted, during startup
	// this will be initialized to the parent gauge's width
	x2: -1,

	// y1: Number?
	// y coordinate of where the gradient should start.  if ommitted, during startup
	// this will be initialized to the parent gauge's height
	y1: -1,

	// y2: Number?
	// y coordinate of where the gradient should end.  if ommitted, during startup
	// this will be initialized to the parent gauge's height
	y2: -1,

	// colors: Array
	// array of colors to be used in the gradient.  this is initialized during startup()
	colors: [],

	startup: function(){
		if(this.getChildren){
			dojo.forEach(this.getChildren(), function(child){ child.startup(); });
		}

		colors = new Array();

		if(this.hasChildren()){
			var children = this.getChildren();
			for(var i=0; i<children.length; i++){
				if(children[i].declaredClass === "ibm_gauge.widget.GradientColor"){
					this.colors.push(children[i].getColorObject());
				}
			}
		}
	},

	getFillObject: function(){
		var fill = new Object();
		fill.type = this.type;
		fill.x1 = this.x1;
		fill.x2 = this.x2;
		fill.y1 = this.y1;
		fill.y2 = this.y2;
		fill.colors = new Array();
		for(var i=0; i<this.colors.length; i++){
			fill.colors.push(this.colors[i]);
		}
		return fill ;
	}
});

dojo.declare("ibm_gauge.widget.GradientColor",[dijit._Widget, dijit._Contained],{
	// summary:
	//		a color to be used in a Gradient
	//
	// description:
	//		a gradient color widget, which has given properties.  drawn by a gradient. 
	//
	// usage:
	//		<script type="text/javascript">
	//			dojo.require("ibm_gauge.widget.AnalogGauge");
	//			dojo.require("ibm_gauge.widget.Range");
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
	//			<div	dojoType="ibm_gauge.widget.Gradient"
	//					type="linear"
	//					x1=0
	//					x2=0
	//					y2=0>
	//				<div	dojoType="ibm_gauge.widget.GradientColor"
	//						offset=0
	//						color="#ECECEC"></div>
	//				<div	dojoType="ibm_gauge.widget.GradientColor"
	//						offset=1
	//						color="white"></div>
	//			</div>
	//		</div>

	// offset: Number
	// the offset of this color (normally 0 or 1)
	offset: -1,

	// color: String
	// the color!
	color: "white",

	getColorObject: function(){
		return {offset: this.offset, color: this.color};
	}
});

dojo.declare("ibm_gauge.widget.Indicator",[dijit._Widget, dijit._Contained, dijit._Templated],{
	// summary:
	//		a indicator to be used in a gauge
	//
	// description:
	//		an indicator widget, which has given properties.  drawn by a gauge. 
	//
	// usage:
	//		<script type="text/javascript">
	//			dojo.require("ibm_gauge.widget.AnalogGauge");
	//			dojo.require("ibm_gauge.widget.Range");
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
	//			<div 	dojoType="ibm_gauge.widget.Indicator"
	//					value=17
	//					type="arrow"
	//					length=135
	//					width=3
	//					hover="Value: 17"
	//					onDragMove="handleDragMove">
	//			</div>
	//		</div>

	// value: Number
	// The value (on the gauge) that this indicator should be placed at
	value: 0,

	// type: String
	// The type of indicator to draw.  Varies by gauge type.  Some examples include
	// "line", "arrow", and "bar"
	type: '',

	// color: String
	// The color of the indicator.
	color: '',

	// label: String
	// The text label for the indicator.
	label: '',

	// length: Number
	// The length of the indicator.  In the above example, the radius of the AnalogGauge
	// is 125, but the length of the indicator is 135, meaning it would project beyond
	// the edge of the AnalogGauge
	length: 0,

	// width: Number
	// The width of the indicator.
	width: 0,

	// offset: Number
	// The offset of the indicator
	offset: 0,

	// hover: String
	// The string to put in the tooltip when this indicator is hovered over.
	hover: '',

	// front: boolean
	// Keep this indicator at the front
	front: false,

	// onDragMove: String
	// The function to call when this indicator is moved by dragging.
	//onDragMove: '',
	_gauge: null,
	title: "",

	templatePath: dojo.moduleUrl("ibm_gauge", "widget/templates/Indicator.html"),

	startup: function() {
		if( this.onDragMove )
			this.onDragMove = dojo.hitch(this.onDragMove);
	},

	postCreate: function() {
		if(this.title === "")
			dojo.style(this.domNode, "display", "none");
	},

	_updateIndicator: function(event){
		var value = this.valueNode.value;
		if(value == ''){
			this.value = null;
		}else{
			this.value = Number(value);
			this.hover = this.title+': '+value;
		}
		if(this._gauge && this._gauge.drawIndicator){
			if(this.value < this._gauge.min){
				this.valueNode.value = this._gauge.min;
				this.value = this._gauge.min;
			}else if(this.value > this._gauge.max){
				this.valueNode.value = this._gauge.max;
				this.value = this._gauge.max;
			}
			this._gauge.drawIndicator(this);
			if((this.title == 'Target' || this.front) && this._gauge.moveIndicator){
				// if re-drawing value, make sure target is still on top
				this._gauge.moveIndicatorToFront(this);
			}
		}
	},

	update: function(value){
		this.valueNode.value = value;
		this._updateIndicator();
	},

	onDragMove: function(){
		this.value = Math.floor(this.value);
		this.valueNode.value = this.value;
		this.hover = this.title+': '+this.value;
	}
});