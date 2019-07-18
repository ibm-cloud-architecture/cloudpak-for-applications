/*
	Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["depot.AccountController"]){dojo._hasResource["depot.AccountController"]=true;dojo.provide("depot.AccountController");dojo.declare("depot.AccountController",null,{account:{},etag:"",ACCOUNT_LOAD:"AccountLoaded",loadAccount:function(){console.debug("Loading Account Controller");var _1={url:"/CustomerOrderServicesWeb/jaxrs/Customer",handleAs:"json",load:dojo.hitch(this,this.loadAccountSuccess),error:dojo.hitch(this,this.loadAccountError)};return dojo.xhrGet(_1);},loadAccountSuccess:function(_2,_3){console.debug("Account Controller Loaded",_2);this.account=_2;if(_3.xhr.getResponseHeader("ETag")){this.etag=_3.xhr.getResponseHeader("ETag");}dojo.publish(this.ACCOUNT_LOAD,[this.account]);console.debug("Published");},loadAccountError:function(e){console.error("Error Loading Account",e);}});}