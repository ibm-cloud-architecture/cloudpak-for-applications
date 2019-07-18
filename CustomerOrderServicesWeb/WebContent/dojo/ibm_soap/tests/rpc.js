dojo.provide("ibm_soap.tests.rpc");

dojo.require("ibm_soap.rpc.SoapService");

tests.register("ibm_soaptests.tests.rpc", 
	[ 
		{
			name: "LoadSmdFromUrl",
			setUp: function(){
				this.svc = new ibm_soap.rpc.SoapService("../resources/testClass.smd");
			},
			runTest: function(){

				if (this.svc.serviceType="SOAP") {
					return true;
				} else {
					return new Error("Error loading and/or parsing an smd file");
				}
			}
		},
		{
			name: "LoadSmdFromString",
			setUp: function(){
			    var smdStr = '{"serviceType": "SOAP","serviceURL": "service.url.serviceprovider.com/soap","methods": [{"name": "getSomething","parameters": [{"name": "parm1","type": "str"}, {"name": "parm2","type": "str"}]}]}';
				this.svc = new ibm_soap.rpc.SoapService(smdStr);
			},
			runTest: function(){

				if (this.svc.serviceType="SOAP") {
					return true;
				} else {
					return new Error("Error loading the service as an smd string");
				}
			}
		},
		{
			name: "LoadSmdFromObject",
			setUp: function(){
				var smdObj = new Object();
				smdObj.serviceType = "SOAP";
				smdObj.serviceURL = "service.url.serviceprovider.com/soap";
				smdObj.methods = new Array();

				var method = new Object();
				method.name = "getSomething";
				method.parameters = new Array();

				var parm1 = new Object();
				parm1.name = "parm1";
				parm1.type = "str";
				
				var parm2 = new Object();
				parm2.name = "parm2";
				parm2.type = "str";
				
				method.parameters.push(parm1);
				method.parameters.push(parm2);
				smdObj.methods.push(method);
				
				this.svc = new ibm_soap.rpc.SoapService(smdObj);
			},
			runTest: function(){

				if (this.svc.serviceType="SOAP") {
					return true;
				} else {
					return new Error("Error loading the service as an smd string");
				}
			}
		}
	]
);


