dojo.provide("ibm_atom.tests.data.module");

try{
	dojo.requireIf(dojo.isBrowser, "ibm_atom.tests.data.stores.AppStore");
}catch(e){
	doh.debug(e);
}

