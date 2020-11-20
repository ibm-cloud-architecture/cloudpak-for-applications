dojo.provide("ibm_soap.util.WsdlParser");

dojo.require("dojox.data.dom");

ibm_soap.util.SOAPNAMESPACE="http://schemas.xmlsoap.org/wsdl/soap/";
ibm_soap.util.WSDLNAMESPACE = "http://schemas.xmlsoap.org/wsdl/";
ibm_soap.util.SCHEMANAMESPACE = "http://www.w3.org/2001/XMLSchema";

dojo.declare("ibm_soap.util.WsdlParser",null,{
		constructor:function(args){
			if(args){
				// Do nothing
			}
		},
		wsdlObj:null,
		wsdlString:null,

		smdObj:null,
		smdString:null,

		parse:function(args){
		//summary: Convert WSDL to SMD
		//description: Retrieve the .WSDL file at the specified URL or the WSDL content passed in
		//			as a string and convert the contents to SMD
		if(args){
			//if the arg is a string, we assume it is a url to retrieve an WSDL definition from
			if(dojo.isString(args)){
				var def = dojo.xhrGet({
					url: args,
					handleAs: "text", // Temporary patch? needs to be changed back to xml?
					sync: true
				});

				def.addCallback(this, "_processWsdl");
				def.addErrback(function() {
					throw new Error("Unable to load WSDL from " . args);					
				});

			}else if(args["wsdlStr"]){
				this._processWsdl(dojo.eval("("+args.wsdlStr+")"));
			}
			return def;
			
		}
		
	},
	_processWsdl: function(obj) {
    // summary: Process the WSDL string passed in
    // description: Process the WSDL string passed in, and store the WSDL object and the 
	//		converted smd information in the various members
		this.wsdlString = obj;
		this.wsdlObj = dojox.data.dom.createDocument(this.wsdlString);
		this.smdObj = this._convertWsdlToSmd(this.wsdlObj);
		this.smdString = dojo.toJson(this.smdObj);
	},
	
	_convertWsdlToSmd: function(/*DOM Document*/ doc) {
    // summary: Convert the WSDL document to SMD and return the SMD object
    // description: Convert the WSDL document to SMD and return the SMD object
    // returns: An SMD Object

		var servicesAsJson = new Array();
		var defaultNamespace = doc.documentElement.getAttribute("targetNamespace");
		this.namespaces = this._retrieveNameSpaces(doc.documentElement);
		var types = this._retrieveTypes(doc);
		var messages = this._retrieveMessages(doc);
		var portTypes = this._retrievePortTypes(doc);
		
		var services = this._getElementsByQualifiedTagName(doc,"service",ibm_soap.util.WSDLNAMESPACE);
		for (var i=0;i<services.length;i++) {
			var service = new Object();
			service.serviceType = "SOAP";
			service.name = services[i].getAttribute("name");
			var ports = this._getElementsByQualifiedTagName(services[i],"port",ibm_soap.util.WSDLNAMESPACE);
			for (var j=0;j<ports.length;j++){
				var portName = ports[j].getAttribute("name");
				var portBindingQName = ports[j].getAttribute("binding");
				var soapPort = this._getElementsByQualifiedTagName(ports[j],"address",ibm_soap.util.SOAPNAMESPACE)[0];
				if(soapPort == null) { continue; }
				service.serviceURL = soapPort.getAttribute("location");
				
				
				// Dig deeper into the binding
				var wsdlBinding = this._getElementsByQualifiedTagNameWithAttributeValue(doc,"binding",ibm_soap.util.WSDLNAMESPACE,"name", this._getLocalpart(portBindingQName))[0];
				
				//Process only if it contains a SOAP binding
				var soapBindings = this._getElementsByQualifiedTagName(wsdlBinding,"binding",ibm_soap.util.SOAPNAMESPACE);
				if(soapBindings.length == 0) { continue; }
				var portTypeName = this._getLocalpart(wsdlBinding.getAttribute("type"))
				var portType = portTypes[portTypeName];
				var operations = this._getElementsByQualifiedTagName(portType,"operation",ibm_soap.util.WSDLNAMESPACE);
				var methods = new Array();
				for(var k=0; k<operations.length;k++) {
					var method = new Object();
					method._soapBindingParameters = new Object();
					method.name = operations[k].getAttribute("name");
					method.httpVerb = "POST";
					method.parameters = new Array();
					var inputNode = this._getElementsByQualifiedTagName(operations[k],"input",ibm_soap.util.WSDLNAMESPACE)[0];
					var outputNode = this._getElementsByQualifiedTagName(operations[k],"output",ibm_soap.util.WSDLNAMESPACE)[0];
					var outputMessageQName = outputNode.getAttribute("message");
					var outputMessage = messages[this._getLocalpart(outputMessageQName)];
					var outputPart = this._getElementsByQualifiedTagName(outputMessage,"part",ibm_soap.util.WSDLNAMESPACE)[0];
					method.result = new Object();
					method.result.contentType = "text/xml";
					var resultType;
					if (outputPart.getAttribute("element")) {
						resultType = outputPart.getAttribute("element");
					} else if(outputPart.getAttribute("type")) {
						resultType = outputPart.getAttribute("type");
					}
					if(this._parseTypeForJson(resultType) == "obj"){
						method.result.schema = resultType;
					}else{
						method.result.type = this._parseTypeForJson(resultType);
					}
					var inputMessageQName = inputNode.getAttribute("message");
					var inputMessage = messages[this._getLocalpart(inputMessageQName)];
					var parts = this._getElementsByQualifiedTagName(inputMessage,"part",ibm_soap.util.WSDLNAMESPACE);
					for (var l=0;l<parts.length;l++) {
						var parmName = parts[l].getAttribute("name");
						if (parts[l].getAttribute("element")) {
							var type = types[this._getLocalpart(parts[l].getAttribute("element"))];
							// Check for namespace
							if (type.parentNode.getAttribute("targetNamespace")) {
								method._soapBindingParameters.namespace = type.parentNode.getAttribute("targetNamespace");
							}
							for(var i=0;i<type.childNodes.length;i++) {
								var complexType = this._getLocalpart(type.tagName) == "complexType"
												 ? type : type.childNodes[i];
								if (complexType.nodeType != 1) continue;
								for(var i=0;i<complexType.childNodes.length;i++){
									var node = complexType.childNodes[i];
									if (node.nodeType != 1) continue; 
									switch(this._getLocalpart(node.tagName)){
										case 'sequence':
										case 'all':
											for(var m=0;m<node.childNodes.length;m++) {
												if (node.childNodes[m].nodeType != 1) continue;
												var parm = new Object();
												var attribList = node.childNodes[m].attributes;
												for (var n=0;n<attribList.length;n++) {
													var attribute = attribList[n];
														parm[attribute.nodeName] = (attribute.nodeName == 'type' ? this._parseTypeForJson(attribute.nodeValue):attribute.nodeValue) ;
												}
												method["parameters"].push(parm);
											}
											break;
										case 'choice':
											var parm = new Object();
											parm.name = "variableParameter";
											parm.type = "obj";
											method["parameters"].push(parm);
											break;
									};
								}
							}
						} else if(parts[l].getAttribute("type")) {
							var parmType = parts[l].getAttribute("type");
							var parm = new Object();
							parm.name = parmName;
							parm.type = this._parseTypeForJson(parmType);
							method["parameters"].push(parm);
						}
						
					}
					// Deal with the binding		
					var wsdlOperation = this._getElementsByQualifiedTagNameWithAttributeValue(wsdlBinding,"operation",ibm_soap.util.WSDLNAMESPACE,"name", method.name)[0];
					var soapOperation = this._getElementsByQualifiedTagName(wsdlOperation,"operation",ibm_soap.util.SOAPNAMESPACE)[0];
					var soapAction = soapOperation ? soapOperation.getAttribute("soapAction") : "";
					method._soapBindingParameters.soapAction = soapAction ? soapAction : "" ;
					methods.push(method);
				}

				service["methods"] = methods;
			}
			servicesAsJson.push(service);
		}	
		return servicesAsJson[0];  //TODO Make it work for multiple services	
	},
	
	_retrieveTypes: function(/*DOM Document*/ doc) {
	// summary: Parses the document for all types
    // description: Parses the document, and retrieves the first "types" tag under the WSDL namespace.
    //				It then parses its children and builds an associative array of all the type nodes 
    // 				and uses the "name" attribute of the node as the key to the node itself in the array.
    // returns:	An array of all type nodes	
	
		var types = new Array();
		var nodes = this._getElementsByQualifiedTagName(doc.documentElement, "types", ibm_soap.util.WSDLNAMESPACE);
		if (nodes.length > 0) {
			nodes = this._getElementsByQualifiedTagName(nodes[0],"schema",ibm_soap.util.SCHEMANAMESPACE)[0].childNodes;
			for (var i=0;i<nodes.length;i++){
				node = nodes[i];
				if (node.nodeType == 1){
					types[node.getAttribute("name")] = node;
				}
			}
		}

		return types; //Node[]
	},
	_retrieveNameSpaces: function(/*DOM Document*/ node){
    // summary: Parses the node for all "namespace" attributes
    // description: Parses the node, and retrieves all "namespace" attributes.
    //				It then builds an associative array and uses the namespace URL
    //				as the key to the node itself in the array. The value is the prefix
    //				used as the qualifier for the namespace
    // returns:	An array of  namespace definitions
		var namespaces = new Array();
		var attribList = node.attributes;
		for (var i=0;i<attribList.length;i++){
			var name = attribList[i].nodeName;
			var value = attribList[i].nodeValue;
			if (name.split(':')[0] == 'xmlns') {
				namespaces[value] = name.split(':')[1];
			}	
		}
		return namespaces; //String[]
	},
	_retrieveMessages: function(/*DOM Document*/ doc){
    // summary: Parses the document for all "message" tags
    // description: Parses the document, and retrieves all "message" tags under the WSDL namespace.
    //				It then builds an associative array of all the message nodes and uses the "name"
    //				attribute of the node as the key to the node itself in the array.
    // returns:	An array of all message nodes	
		var messages = new Array();
		var nl = this._getElementsByQualifiedTagName(doc,"message",ibm_soap.util.WSDLNAMESPACE);
		for (var i=0;i<nl.length;i++) {
			node = nl[i];
			messages[node.getAttribute("name")] = node;
		}
		return messages; //Node[]
	},
	_retrievePortTypes: function(/*DOM Document*/ doc){
    // summary: Parses the document for all "portType" tags
    // description: Parses the document, and retrieves all "portType" tags under the SOAP namespace.
    //				It then builds an associative array of all the portType nodes and uses the "name"
    //				attribute of the node as the key to the node itself in the array.
    // returns:	An array of all portType nodes
		var portTypes = new Array();
		var nl = this._getElementsByQualifiedTagName(doc,"portType",ibm_soap.util.WSDLNAMESPACE);
		for (var i=0;i<nl.length;i++) {
			node = nl[i];
			portTypes[node.getAttribute("name")] = node;
		}
		return portTypes;  //Node[]
	},
	_getElementsByQualifiedTagNameWithAttributeValue: function(/*DOM Document*/ doc, /*String*/ tagName, /*String*/ namespace, /*String*/ attributeName, /*String*/ attributeValue){
    // summary: Gets all the element nodes under the doc root that have the given tagname and attribute value
    // description: Gets all the element nodes under the doc root that have the given tagname and attribute value
    // returns: Array of nodes that satisfy the given condition
		var nl = new Array();
	    var nodes = this._getElementsByQualifiedTagName(doc,tagName,namespace);
	    for(i=0; i<nodes.length; i++){
	        if(nodes[i].getAttribute(attributeName) == attributeValue){
    	      nl.push(nodes[i]);
       		}
      	}
      	return nl;  //Node[]
    },
    _getLocalpart: function(/*String*/ qName) {
    // summary: Parses a qualified name of the form 'foo:bar' and returns the local part 'bar'
    // description: Parses a qualified name of the form 'foo:bar' and returns the local part 'bar'
    // returns: The local part 
    	return (qName.indexOf(':') == -1) ? qName : qName.split(':')[1]; //String
    
    },
    _getPrefix: function(/*String*/ qName) {
    // summary: Parses a qualified name of the form 'foo:bar' and returns the prefix foo
    // description: Parses a qualified name of the form 'foo:bar' and returns the prefix foo
    // returns: The prefix
    	return (qName.indexOf(':') == -1) ? qName : qName.split(':')[0];  //String
    
    },
    _parseTypeForJson: function(/*String*/ type) {
    // summary: Returns the 'type' to be specified in the SMD format 
    // description:
    // 		Provides a map for various types from the description in WSDL to 
    // 		the specification in the SMD format. 
    // returns: Data type
    	var type = this._getLocalpart(type);
    	switch(type){
   		case 'string':
    				return "str";  //String
    				break;
		case 'boolean':
					return "bit"; //String
					break;
		case 'decimal':
		case 'float':
		case 'double':
		case 'decimal':
		case 'integer':
					return "num"; //String
					break;
		};
		return "obj"; //String
    },
    
    _getElementsByQualifiedTagName:function(/*DOM Node*/ node, /*String*/ tagName, /*String*/namespace){
    // summary: Retrieves all elements with the given tagname and namespace
    // description:
    // 		Retrieves all elements with the given tagname and namespace. The function performs the 
    //		same function as getElementsByTagNameNS providing additional logic to work in IE
    // returns: Array of nodes
    	if(node.getElementsByTagNameNS){
    		return node.getElementsByTagNameNS(namespace,tagName);
   		}else{
			var qualifiedTagName = this.namespaces[namespace] + ":" + tagName;
			var nodes = new Array();
			var resultNodeList = new Array();

 			nodes = node.getElementsByTagName(tagName);
			for(var n=0;n<nodes.length;n++){
				if(nodes[n].namespaceURI == namespace){
					resultNodeList.push(nodes[n]);
				}
			}

			nodes = node.getElementsByTagName(qualifiedTagName);
			for(var n=0;n<nodes.length;n++){
				if(nodes[n].namespaceURI == namespace){
					resultNodeList.push(nodes[n]);
				}
			}
			return resultNodeList;  // Node[]
		}
    }
  }
);
