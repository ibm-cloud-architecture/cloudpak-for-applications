dojo.provide("ibm_soap.widget.SoapService");

dojo.require("ibm_soap.rpc.SoapService");
dojo.require("ibm_soap.util.WsdlParser");
dojo.require("ibm_soap.widget.RpcService");

dojo.declare("ibm_soap.widget.SoapService",ibm_soap.widget.RpcService,
{
	//	summary: A widget for 'SoapService' service
	//	description: This widget represents 'SoapService'.
	
	//	summary:
	//		A flag to denote how the SoapService class should try to
	//		determine the wsdl structure (from wsdl file or from SMD)
	//		Default is by 'extension', which means it expects the url to end
	//		.wsdl.  
	//		
	//		Alternate is 'wsdl', which means assume that the url is to a wsdl
	//		file and parse it that way.  This works well with things that might do:
	//		?wsdl on the url instead of just .wsdl.
	parserMode: "extension",

	_createService: function() {
		//summary: Creates an instance of ibm_soap.rpc.SoapService
		// description: Creates an instance of ibm_soap.rpc.SoapService
		var url = this.url;
		if(dojo.isString(url)){
			var parser;
			if(this.parserMode === "extension"){
				var extension = url.substring(url.lastIndexOf(".")+1);

				// If the url is a .wsdl file, instantiate the WsdlParser to parse
				// the wsdl and instantiate the service using the returned smd object
				if(extension === "wsdl"){
					parser=new ibm_soap.util.WsdlParser();
					parser.parse(url);
					return new ibm_soap.rpc.SoapService(parser.smdObj); // SoapService
				}
			}else if(this.parserMode === "wsdl"){
				parser = new ibm_soap.util.WsdlParser();
				parser.parse(url);
				return new ibm_soap.rpc.SoapService(parser.smdObj); // SoapService
			}
		}
		return new ibm_soap.rpc.SoapService(url); //SoapService
	}
});
