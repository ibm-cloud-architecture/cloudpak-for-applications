dojo.provide("depot_tests.tests.AccountControllerTest");
dojo.registerModulePath("depot","../../dojo_depot/depot");
dojo.require("doh.runner");

dojo.require("depot.AccountController");
var accountController = new depot.AccountController();

doh.register("depot_tests.tests.AccountControllerTest", [
{
        name:"testOnLoadOrder",
        timeout:5000,
        runTest:function()
        {
              var deferred = accountController.loadAccount();
              var dohDeferred = new doh.Deferred();

              deferred.addCallback(function ()
              {       		
                  	try
                  	{
                       	doh.assertFalse("" == accountController.etag);
                       	doh.assertEqual("Roland Barcia",accountController.account.name);
                        doh.assertEqual("RESIDENTIAL",accountController.account.type);
                        doh.assertTrue(accountController.account.frequentCustomer);
                        doh.assertTrue(accountController.account.address);
                       dohDeferred.callback(true);
                  	}
                  	catch(e)
                  	{
                  		dohDeferred.errback("Bad result",e.message);
                  	}
              });
                         
                         
              return dohDeferred;
        }
}
]);