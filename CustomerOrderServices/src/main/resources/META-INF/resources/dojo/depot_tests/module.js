dojo.provide("depot_tests.module");
dojo.registerModulePath("depot","../../dojo_depot/depot");
//This file loads in all the test definitions.  

try{
	dojo.require("depot_tests.tests.AccountControllerTest");
	dojo.require("depot_tests.tests.OrderHistoryTest");
     
}catch(e){
     doh.debug(e);
}
