dojo.provide("ibm_soap.io.ws");							  
dojo.provide("ibm_soap.io.ws.soap");
dojo.require("dojox.data.dom");
dojo.require("dojox.xml.parser");

ibm_soap.io.ws.version='0.1';
ibm_soap.io.ws.copyright='Copyright 2009, IBM Corporation';

var tryThese = function(){
	// summary:	Tries various function calls until one succeeds
	// description:	Works like a try-catch for method calls.
	// returns:	The object returned by the original method call
	for(var x=0;x<arguments.length;x++){
		try{
			if(typeof arguments[x]=="function"){
				var ret=(arguments[x]());
				if(ret){
					return ret;
				}
			}
		}catch(e){
			// console.debug(e);
		}
	}
};


dojo.declare("ibm_soap.io.ws.XMLDocument",null,{
	constructor:function(){},
	createDocumentQName:function(/*QName*/qname){
	//	summary: Create an XML Document using a qualified name
	//	description: Create an XML Document using a qualified name
	//	returns: XML Document
		return this.createDocument(qname.namespace,qname.value_of()); //DOMDocument
	},
	createDocument:function(/*String*/namespace, /*String*/nodename){
	//	summary: Create an XML Document using the specified namespace and nodename				  			
	//	description: Create an XML Document using the specified namespace and nodename				  			
	//	returns: XML Document
        if(dojo.isIE){
			var dXml =  "<?xml version=\"1.0\" encoding=\"UTF-8\"?><" + nodename + "></" + nodename +">";
			if(namespace){
				var ns = nodename.substring(0,nodename.indexOf(":"));
				dXml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><" + nodename + " xmlns:" + ns + "=\"" + namespace +"\"></" + nodename +">";
			}
			var doc = dojox.xml.parser.parse(dXml);
			return doc; //DOMDocument
 		}else{
 			return document.implementation.createDocument(namespace,nodename,null); //DOMDocument
		}
	},
	createElementNS:function(/*XMLDocument*/xDocument,/*String*/nodename,/*String*/namespace){
	//	summary: Create an XML Element with the specified nodename and namespace
	//	description: Create an XML Document using the specified namespace and nodename				  			
	//	returns: XML Element
		var el = null;
		if(dojo.isIE){
			//IE does bad things, we have to remove namespaces. :-(
			namespace = null;
			nodename = nodename.substring(nodename.indexOf(":") + 1, nodename.length);
			return xDocument.createElement(nodename);
		} else {
			if(namespace){
				return xDocument.createElementNS(namespace,nodename);			
			}else{
				return xDocument.createElement(nodename);
			}
		}
		return false;
	},
	createElementQName:function(/*XMLDocument*/xDocument,/*QName*/qname){
	//	summary: Create an XML Element using the specified document and the qualified name 
	//	description: Create an XML Document using the specified document and the qualified name 				  			
	//	returns: XML Element
		return this.createElementNS(xDocument,qname.value_of(),qname.namespace); //XML Element
	},
	createAttributeNS:function(/*XML Document*/xDocument,/*String*/nodename,/*String*/namespace,/*String*/value){
	//	summary: Create an attribute with the given nodename and assign the given value to it
	//	description: Create an attribute with the given nodename and assign the given value to it		  			
	//	returns: XML attribute
		var attr = tryThese(
						function(){return xDocument.createNode(2,nodename,namespace)},
						function(){return xDocument.createAttributeNS(namespace,nodename)}
					)||false;
		attr.nodeValue = value;
		return attr; //XML Attribute

	},
 	createAttributeQName:function(/*XML Document*/xDocument,/*QName*/qname,/*String*/value){
 	//	summary: Create an attribute node with the given qualified name and assign the given value to it
	//	description: Create an attribute node with the given qualified name and assign the given value to it
	//	returns: XML attribute

		return this.createAttributeNS(xDocument,qname.value_of(),qname.namespace,value); //XML Attribute
	},
	createAttribute:function(/*XMLDocument*/xDocument,/*String*/nodename,/*anything*/value){
	//	summary: Create an attribute node with the given node name and assign the given value to it
	//	description: Create an attribute node with the given node name and assign the given value to it
	//	returns: XML attribute

		var attr = tryThese(
						function(){return xDocument.createNode(2,nodename)},
						function(){return xDocument.createAttribute(nodename)}
					)||false;
		attr.nodeValue = value;
		return attr; //XML attribute
	},
	createText:function(xDocument,value){
	//	summary: Create a text node with the given text value
	//	description: Create a text node with the given text value
	//	returns: Text node
		try{
			return xDocument.createTextNode(value);  //Text Node
		}catch(e){
			return false;
		}
	},
	createCDATA:function(xDocument,value){
	//	summary: Create a CDATA section node with the given value
	//	description: Create a CDATA section node with the given value
	//	returns: CDATA section node
		return tryThese(
					function(){return xDocument.createCDATASection(value)}
				)||false;
	},
	getElementsByQName:function(element, qname){
	//	summary: Retrieves all elements that match the given qualified name
	//	description: Browses the xml tree under the node specified by element and returns all
	//				 nodes that match the given qualified name
	//	returns: Array of nodes
		var nl = null;
		if(!element.getElementsByTagNameNS){
			nl = new Array();
			var nodes = element.getElementsByTagName(qname.value_of());
			for(var n=0;n<nodes.length;n++){
				if(nodes[n].namespaceURI == qname.namespace){
					nl.push(nodes[n]);
				}
			}
		}else{
			nl = element.getElementsByTagNameNS(qname.namespace,qname.localpart);
		}
		return nl;
	}
});	//End of dojo.declare

ibm_soap.io.ws.XML = new ibm_soap.io.ws.XMLDocument();

dojo.declare("ibm_soap.io.ws.QName",null,{
	constructor:function(localpart){
	//	summary: Initialize the qualified name with the given local part
	//	description: Initialize the qualified name with the given local part.
	//				Additional arguments can be provided.
	//				Argument 1 - namespace
	//				Argument 2 - prefix
		this.localpart = localpart;
		if(arguments[1]) 
			this.namespace = arguments[1];
		if(arguments[2])
			this.prefix = arguments[2];
	},
	to_string:function(){
	//	summary: Returns this qualified name as a string
	//	description: Returns this qualified name as a string
	//	returns: String
		return(this.namespace)?
				'{'+this.namespace + '}' + this.prefix:
				this.localpart;
	},
	value_of:function(){
	//	summary: Returns the value of this qualified name
	//	description: Returns the value of this qualified name
	//		If a prefix exists, the value returned is 
	//				<prefix>:<localpart>
	//		Otherwise, the value returned is
	//				<localpart>		
	//	returns: Value of this qualified name in the a:b format
		return((this.prefix)?this.prefix + ':':'') + this.localpart;
	},
	equals:function(obj){
	//	summary: Compares two QName objects for equality		
	//	description: Compares two QName objects for equality		
	//	returns: True or False
    	return (obj instanceof ibm_soap.io.ws.QName &&
				obj.localpart == this.localpart &&
				obj.namespace == this.namespace); //boolean
	}
});  //End of dojo.declar for ibm_soap.io.ws.QName

ibm_soap.io.ws.QName.fromElement = function() {
//	summary:Creates a qualified name using the information from an XML Element
//	description:Creates a qualified name using the information from an XML Element
//	returns: Qualified name
		var qname =	new ibm_soap.io.ws.QName((this.baseName)?this.baseName:this.localName,
									this.namespaceURI,
									this.prefix
					);
		return qname;
}

ibm_soap.io.ws.soap.version='1.1';
ibm_soap.io.ws.soap.URI='http://schemas.xmlsoap.org/soap/envelope/';
ibm_soap.io.ws.soap.XSI='http://www.w3.org/2000/10/XMLSchema-instance';
ibm_soap.io.ws.soap.XSIQNAME=new ibm_soap.io.ws.QName('type','http://www.w3.org/2000/10/XMLSchema-instance','xsi');
ibm_soap.io.ws.soap.XSINIL=new ibm_soap.io.ws.QName('nil','http://www.w3.org/2000/10/XMLSchema-instance','xsi');
ibm_soap.io.ws.soap.SOAPENCODING='http://schemas.xmlsoap.org/soap/encoding/';
ibm_soap.io.ws.soap.NOENCODING=null;
ibm_soap.io.ws.soap.ENCODINGSTYLE=new ibm_soap.io.ws.QName('encodingStyle','http://schemas.xmlsoap.org/soap/envelope/','s');

dojo.declare("ibm_soap.io.ws.soap.Element",null,{
	constructor:function(){
	// summary: Constructor
	// description: Initialize the object with any argments if present
		if(arguments[0]){
			this._initializeInternal(arguments[0]);
		}
	},
	_initializeInternal:function(element){
		this.element = element;
	},
	asElement:function(){
	//	summary: Returns this object as an XML element
	//	description: Returns this object as an XML element
	//	returns: XML element
    	return this.element;  //XML element
	},
	qname:function(){
	//	summary: Returns the associated qualified name
	//	description: Returns the associated qualified name
	//	returns: Qualified name
		return dojo.hitch(this.element, ibm_soap.io.ws.QName.fromElement)();
	},
	setEncodingStyle:function(/*String*/style){
	//	summary: Set the encoding style
	//	description: Set the encoding style
		this.setAttribute(ibm_soap.io.ws.soap.ENCODINGSTYLE,style);
	},
	declareNamespace:function(/*Object*/qname){
	//	summary: Declare the associated namespace
	//	description: Declare the associated namespace
		var ns = new ibm_soap.io.ws.QName(qname.prefix,'http://www.w3.org/2000/xmlns/','xmlns');
		var value = (qname.namespace) ? qname.namespace : '';
		var attr = ibm_soap.io.ws.XML.createAttributeQName(this.element.ownerDocument,ns,value);
		if(this.element.setAttributeNodeNS){
			this.element.setAttributeNodeNS(attr);
		}else{
			this.element.setAttributeNode(attr);
		}
	},
	setAttribute:function(/*Object*/qname, /*String*/value){
	//	summary: Create an attribute node
	//	description: Create an attribute node
		var attr = ibm_soap.io.ws.XML.createAttributeQName(this.element.ownerDocument, qname, value);
		if(this.element.setAttributeNodeNS){
			this.element.setAttributeNodeNS(attr);
		}else{
			this.element.setAttributeNode(attr);
		}
	},
	getAttribute:function(/*Object*/qname){
	//	summary: Retrieve the named attribute
	//	description: Retrieve the named attribute 	
	//  returns: Attrribute value
 		var val = null;
		for(var n = 0; n < this.element.attributes.length; n++){
			var attr = this.element.attributes[n];
			if(qname.equals(dojo.hitch(attr,ibm_soap.io.ws.QName.fromElement)())){
				val = attr.nodeValue;
				break;
			}
		}
		return val; //String
	},
	hasAttribute:function(/*Object*/qname){
	//	summary: Checks for the presence of an attribute
	//	description: Checks for the presence of an attribute
	//  returns: true or false
		var val = null;
		for(var n = 0; n < this.element.attributes.length; n++){
			var attr = this.element.attributes[n];
			if(qname.equals(dojo.hitch(attr,ibm_soap.io.ws.QName.fromElement)())){
				val = true;
				break;
			}
		}
		return val; //boolean
	},
	clearChildren:function(){
	//	summary: Removes all child nodes
	//	description: Removes all child nodes
		var nodes = this.element.childNodes;
		for(var n = 0; n < nodes.length; n++){
			this.element.removeChild(nodes[n]);
		}
	},
	setValue:function(value, usecdata){
	//	summary: Creates a data section with the given value
	//	description: Creates a data section with the given value
		var doc = this.element.ownerDocument;
		this.clearChildren();
		if(usecdata){
			this.element.appendChild(ibm_soap.io.ws.XML.createCDATA(doc,value));
		}else{
			this.element.appendChild(ibm_soap.io.ws.XML.createText(doc,value));
		}
	},
	getValue:function(){
	//	summary: Retrives the value of the first child
	//	description: Retrives the value of the first child
		return this.element.firstChild.nodeValue;
	},
	addChild:function(element){
	//	summary: Add a child node
	//	description: Add a child node
		var doc = this.element.ownerDocument;
		if(element instanceof ibm_soap.io.ws.soap.Element){
			this.element.appendChild(doc.importNode(element.element, true));
		}else{
			this.element.appendChild(doc.importNode(element, true));
		}
	},
	createChild:function(qname){
	//	summary: Add a child node
	//	description: Add a child node
		var doc = this.element.ownerDocument;
		var el = ibm_soap.io.ws.XML.createElementQName(doc, qname);
		this.element.appendChild(el);
 		var ret = new ibm_soap.io.ws.soap.Element(el);
		return ret;
	},
	getChildren:function(qname){
	//	summary: Return all child nodes specified by the qname
	//	description: Return all child nodes specified by the qname
	//	returns: Child nodes 
		var nodes = ibm_soap.io.ws.XML.getElementsByQName(this.element,qname);
		var childnodes = [];
		for(var n = 0; n < nodes.length; n++){
			childnodes.push(new ibm_soap.io.ws.soap.Element(nodes[n]));
		}
		return childnodes;
	},
	getAllChildren:function(){
	//	summary: Return all child nodes
	//	description: Return all child nodes
	//	returns: Child nodes 
		var nodes = this.element.childNodes;
		var childnodes = new Array();
		for(var n = 0; n < nodes.length; n++){
			if(nodes[n].nodeType == 1){
				childnodes.push(new ibm_soap.io.ws.soap.Element(nodes[n]));
			}
		}
    	return childnodes;
	},
	getBinder:function(){
	//	summary: Return the binder 
	//	description: Return the binder
	//	returns: Binder object 
		return ibm_soap.io.ws.Binder.getForQname(this.qname());
	}
}); //End of dojo.declare for ibm_soap.io.ws.soap.Element

dojo.declare("ibm_soap.io.ws.soap.Envelope",ibm_soap.io.ws.soap.Element,{
	constructor:function(){
	//	summary: Constructor
	//	description: Initializes the object with the parameters
		var element=arguments[0];
		if(!element){
			var xDocument=ibm_soap.io.ws.XML.createDocumentQName(ibm_soap.io.ws.soap.Envelope.QNAME);
			element=xDocument.documentElement;
		}
		this._initializeInternal(element);
	},
	setValue : null,
	getValue : null,
	createChild : null,
	createHeader : function(){
	//	summary: Creates the SOAP Header section
	//	description: Creates the SOAP Header section
	//	returns: SOAP Header
		if(!this.hasHeader()){
			var doc = this.element.ownerDocument;
			var el = ibm_soap.io.ws.XML.createElementQName(doc, ibm_soap.io.ws.soap.Header.QNAME);
			if(this.element.firstChild){
				this.element.insertBefore(el, this.element.firstChild);
			}else{
				this.element.appendChild(el);
			}
			var ret = new ibm_soap.io.ws.soap.Header(el);
			return ret;
	    }else{
			return this.getHeader();
		}
	},
	getHeader:function(){
	//	summary: Retrieves the SOAP Header section
	//	description: Retrieves the SOAP Header section
	//	returns: SOAP Header
		var val = null;
		for(var n = 0; n < this.element.childNodes.length; n++){
			if(this.element.childNodes[n].nodeType == 1){
				var el = this.element.childNodes[n];
				if(ibm_soap.io.ws.soap.Header.QNAME.equals(dojo.hitch(el,ibm_soap.io.ws.QName.fromElement)())){
					val = new ibm_soap.io.ws.soap.Header(el);
					break;
				}
			}
		}
    	return val;
	},
	hasHeader:function(){
	//	summary: Checks for the presence of a SOAP Header
	//	description: Checks for the presence of a SOAP Header
	//	returns: True or False
		var val = null;
		for(var n=0;n<this.element.childNodes.length;n++){
			if(this.element.childNodes[n].nodeType == 1){
				var el = this.element.childNodes[n];
				if(ibm_soap.io.ws.soap.Header.QNAME.equals(dojo.hitch(el,ibm_soap.io.ws.QName.fromElement)())){
					val = true;
					break;
				}
			}
		}
		return val;
	},
	createBody:function(){
	//	summary: Creates the SOAP Body section
	//	description: Creates the SOAP Body section
	//	returns: SOAP Body
		if(!this.hasBody()){
			var doc = this.element.ownerDocument;
			var el = ibm_soap.io.ws.XML.createElementQName(doc, ibm_soap.io.ws.soap.Body.QNAME);
			this.element.appendChild(el);
			var ret = new ibm_soap.io.ws.soap.Body(el);
			return ret;
		}else{
			return this.getBody();
		}
	},
	getBody:function(){
	//	summary: Retrieves the SOAP Body section
	//	description: Retrieves the SOAP Body section
	//	returns: SOAP Header
		var val = null;
		for(var n = 0; n < this.element.childNodes.length; n++){
			if(this.element.childNodes[n].nodeType == 1){
				var el = this.element.childNodes[n];
				if(ibm_soap.io.ws.soap.Body.QNAME.equals(dojo.hitch(el,ibm_soap.io.ws.QName.fromElement)())){
					val = new ibm_soap.io.ws.soap.Body(el);
					break;
				}
			}
		}
		return val;
	},
	hasBody:function(){
	//	summary: Checks for the presence of a SOAP Body
	//	description: Checks for the presence of a SOAP Body
	//	returns: True or False
		var val = null;
		for(var n = 0; n < this.element.childNodes.length; n++){
			if(this.element.childNodes[n].nodeType == 1){
				var el = this.element.childNodes[n];
				if(ibm_soap.io.soap.Body.QNAME.equals(dojo.hitch(el,ibm_soap.io.ws.QName.fromElement)())){
					val = true;
					break;
				}
			}
    	}
		return val;
	}
}); //End of dojo.declare for ibm_soap.io.ws.soap.Envelope

ibm_soap.io.ws.soap.Envelope.QNAME = new ibm_soap.io.ws.QName('Envelope',ibm_soap.io.ws.soap.URI,"soapenv");

dojo.declare("ibm_soap.io.ws.soap.Header",ibm_soap.io.ws.soap.Element,{
	constructor:function(element){
	//	summary: Constructor
	//	description: Initializes the object with the element passed in
		this._initializeInternal(element);
	},
	setValue:function(){/* Empty body */},
	getValue:function(){/* Empty body*/ }
}); //End of dojo.declare for ibm_soap.io.ws.soap.Header

ibm_soap.io.ws.soap.Header.QNAME = new ibm_soap.io.ws.QName('Header',ibm_soap.io.ws.soap.URI, "soapenv");

dojo.declare("ibm_soap.io.ws.soap.Body",ibm_soap.io.ws.soap.Element,{
	//	summary: Constructor
	//	description: Initializes the object with the element passed in
	constructor:function(element){
		this._initializeInternal(element);
	},
	setValue:function(){/* Empty body */},
	getValue:function(){/* Empty body */},
	setDocumentBody:function(method, params, encodingstyle){
	//	summary: Generates the contents of the SOAP body
	//	description: Generates the contents of the SOAP body
		if(encodingstyle){
			this.setEncodingStyle(encodingstyle);
		}
		if(!isNaN(params.nodeType)){
			this.copyChildren(method, params, this, encodingstyle);
		}else{
			this.copyParams(method, params, this, encodingstyle);
		}
	},
	setRpc:function(method, params, encodingstyle){
		var child = this.createChild(method);
		if(encodingstyle){
			child.setEncodingStyle(encodingstyle);
		}
		if(!isNaN(params.nodeType)){
			this.copyChildren(method, params, child, encodingstyle);
		}else{
			this.copyParams(method, params, child, encodingstyle);
		}
	},
	copyParams:function(method, params, child, encodingstyle){
	//summary: Copy the parameters to be included in the SOAP body
	//description: Copy the parameters to be included in the SOAP body
		console.log("ibm_soap.io.ws.soap.Body.copyParams...num of params = " + params.length);
		for(var n=0;n<params.length;n++){
			var param=params[n];
			var pchild=null;
			if(param.name instanceof ibm_soap.io.ws.QName){
				pchild=child.createChild(param.name);
			}else{
				pchild=child.createChild(new ibm_soap.io.ws.QName(param.name,method.namespace,method.prefix));
			}
			if(param.value){
				pchild.setValue(param.value);
			}else{
				pchild.setAttribute(ibm_soap.io.ws.soap.XSINIL,'true');
			}
			if(param.xsitype){
				pchild.setAttribute(ibm_soap.io.ws.soap.XSIQNAME,param.xsitype.value_of());
			}
			if(param.encodingstyle){
				pchild.setEncodingStyle(param.encodingstyle);
			}
		}
	},
	copyChildren:function(method, srcNode, child, encodingstyle){
	//summary: Copy the parameters to be included in the SOAP body
	//description: Copy the parameters to be included in the SOAP body		
		console.log("ibm_soap.io.ws.soap.Body.copyChildren");
  		if(!srcNode.childNodes){
			return;
		}
		var numChildren = srcNode.childNodes.length;
		for(var i=0;i<numChildren;i++){
			var param = srcNode.childNodes[i];
			if(param.nodeType != 1){
				continue;
			}			
			var pchild=null;
			var name = param.tagName;
			if(name instanceof ibm_soap.io.ws.QName){
				pchild=child.createChild(name);
			}else{
				pchild=child.createChild(new ibm_soap.io.ws.QName(name));
			}
			var value=null;
			if(param.childNodes.length == 1 && param.childNodes[0].nodeType == 3){
				value=param.childNodes[0].nodeValue;
			}
			if(value){
				pchild.setValue(value);
			}else{
				pchild.setAttribute(ibm_soap.io.ws.soap.XSINIL,'true');
			}
			if(param.xsitype){
				pchild.setAttribute(ibm_soap.io.ws.soap.XSIQNAME,param.xsitype.value_of());
			}
			if(param.encodingstyle){
				pchild.setEncodingStyle(param.encodingstyle);
			}
			this.copyChildren(method, param, pchild, encodingstyle);
		}
	}
}); //End of dojo.declare

ibm_soap.io.ws.soap.Body.QNAME = new ibm_soap.io.ws.QName('Body',ibm_soap.io.ws.soap.URI, "soapenv");

dojo.declare("ibm_soap.io.ws.Handler",null,{
	constructor:function(){},
	onRequest:function(call, envelope){},
	onResponse:function(call, envelope){},
	onError:function(call, envelope){}
});  //End of dojo.declare

dojo.declare("ibm_soap.io.ws.Binder",null,{
	constructor:function(){},
	toSoapElement:function(valueObject,envelope){},
	toValueObject:function(soapElement){}
});

ibm_soap.io.ws.Binder.register = function(qname,type,binder){
	if(!ibm_soap.io.ws.Binder.binders)ibm_soap.io.ws.Binder.binders = [];
		ibm_soap.io.ws.Binder.binders.push({qname:qname,type:type,binder:binder});
	}

ibm_soap.io.ws.Binder.getForQname = function(qname){
	if(!ibm_soap.io.ws.Binder.binders){
		return null;
	}
 	var binder = null;
 	for(var n = 0; n < this.binders.length; n++){
    	var b = this.binders[n];
		if(b.qname.equals(qname)){
			binder = b.binder;
			break;
		}
	}
	return binder;
}

ibm_soap.io.ws.Binder.getForType = function(type){
	if(!ibm_soap.io.ws.Binder.binders){
		return null;
	}
	var binder = null;
	for(var n=0;n<this.binders.length;n++){
		var b = this.binders[n];
		if(b.type == type){
			binder = b.binder;
			break;
		}
	}
	return binder;
}

InvokeHandlers = function(call,envelope,transport,state){
	dojo.forEach(this,
				function(value){
					switch(state){
						case 'request':
							try{
								value.on_request(call,envelope, transport);
							}catch(e){}
							break;
						case 'response':
							try{
								value.on_response(call,envelope, transport);
							}catch(e){}
							break;
						case 'error':
							try{
								value.on_error(call,envelope,transport);
							}catch(e){}
							break;
					}
				}
	)
}
  
dojo.declare("ibm_soap.io.ws.Call",null,{
	constructor:function(/*String*/ uri){
	//	summary: Constructor
	//	description: Initialize the class using the uri parameter
		this.uri = uri;
		this.handlers = [];
		this.invokeHandlers = dojo.hitch(this.handlers,InvokeHandlers);
	},
	addHandler:function(/*ibm_soap.io.ws.handler*/handler){
	//	summary: Add a handler to the list of handlers
	//	description: Add a handler to the list of handlers
		this.handlers.push(handler);
	},
	invokeRpc:function(/*String*/qname,/*Array*/params,/*String*/encodingstyle,/*Method name*/callback){
	//	summary: Create the SOAP envelope and invoke the service
	//	description: Create the SOAP envelope and invoke the service
		var env = new ibm_soap.io.ws.soap.Envelope();
		env.createBody().setRpc(qname,params,encodingstyle);
		this.invoke(env,callback);
	},
	invoke:function(envelope,callback){
	//	summary: Invoke the service
	//	description: Invoke the service
		this.invokeHandlers(this,envelope,null,'request');
		var call = this;
		var postBody = envelope.asElement().ownerDocument;
		var onComplete = function(/*String*/type, /*Object*/data, /*Object*/transport, /*Object*/kwArgs){
			var responseEnv = new ibm_soap.io.ws.soap.Envelope(data.documentElement);
			call.invokeHandlers(call,responseEnv,transport,'response');
			console.log("Call.invoke().onComplete..." + transport.responseText);
			callback(this,responseEnv,transport.responseText);
		};      
		var onError = function(/*String*/type, /*Object*/error, /*Object*/transport, /*Object*/kwArgs){
		};      
		var soapaction;
		if(this.soapAction){
			soapaction = '"' + this.soapAction + '"';
		}else{
			soapaction = '""';
		}

		if(typeof XMLSerializer != 'undefined'){
			console.log(new XMLSerializer().serializeToString(postBody));
		}
		var postHandler = dojo.rawXhrPost({
			url: this.uri,
			contentType: "application/xml",
			handleAs: "xml",
			headers: {SOAPAction:soapaction},
			postData: postBody
		});

		if(dojo.isIE){
			//There's a bug in IE's XML parser with namespaces, so ...
			//have to try to work around it.
			postHandler.handleAs = "text";
		}

		postHandler.addCallback(function(data){
			console.log("adding callback");
			// onComplete('response', data, this.ioArgs.xhr,keywordArgs);

			//Handle IE's issue.  Its XML parser will not handle XML with empty namespaces,
			//even though it's W3C valid.
			if(dojo.isIE){
				var regExp = new RegExp("xmlns:[A-Za-z0-9]+=([\"\'])\\1", "i");
				var loc = data.search(regExp);
				while(loc >= 0) {
					var i;
					var stop = -1;
					for(i = loc; i < data.length; i++){
						if(data.charAt(i) === '='){
							stop = i;
							break;
						}
					}
					if(stop > -1){
						var newString = data.substring(0,stop);
						newString += "=\"ieWorkaround_" + (new Date()).getTime() + "\"";
						newString += data.substring(stop + 3, data.length);
						data = newString;
					}
					loc = data.search(regExp);
				}
				data = dojox.data.dom.createDocument(data);
			}
			var transport = postHandler.ioArgs.xhr;   
			var responseEnv = new ibm_soap.io.ws.soap.Envelope(data.documentElement);
			call.invokeHandlers(call,responseEnv,transport,'response');
			callback(this,responseEnv,transport.responseXML);
		});
		postHandler.addErrback(function(error){
			console.log("adding errback");
			console.log("Call.invoke().onError..." + error);
			var transport = postHandler.ioArgs.xhr;   
			call.invokeHandlers(call,null,'error');
		});
	}
});
