dojo.provide("ibm_atom.io.atom");

dojo.require("dojox.data.dom");
dojo.require("dojo.string");
dojo.require("dojo.date.stamp");
dojo.requireLocalization("ibm_atom.io", "messages");

(function(){
	//Function to test and emit if this package is effectively deprecated at this dojo level
	//As it was contributed to dojo 1.3 and later.
	try{
		var v = dojo.version.toString();
		if(v){
			v = v.substring(0,3);
			v = parseFloat(v);
			if (v > 1.2) {
				dojo.deprecated("ibm_atom.io.atom", "Use dojox.atom.io.module and dojox.atom.io.Connection instead.");
			}
		}
	}catch(e){}
})();


ibm_atom.io.atom._Constants = {
	// summary: Container for general constants.
	// description: Container for general constants.
	"ATOM_URI": "http://www.w3.org/2005/Atom",
	"ATOM_NS": "http://www.w3.org/2005/Atom",
	"PURL_NS": "http://purl.org/atom/app#",
	"APP_NS": "http://www.w3.org/2007/app"
};

ibm_atom.io.atom._actions = {
	// summary: Container for tag handling functions.
	// description: Container for tag handling functions.  Each child of this container is
	//				a handler function for the given type of node. Each accepts two parameters:
	//		obj:  Object.
	//			  The object to insert data into.
	//		node: DOM Node.
	//			  The dom node containing the data

	"link": function(obj,node){
		if(obj.links === null){obj.links = [];}
		var link = new ibm_atom.io.atom.Link();
		link.buildFromDom(node);
		obj.links.push(link);
	},
	"author": function(obj,node){
		if(obj.authors === null){obj.authors = [];}
		var person = new ibm_atom.io.atom.Person("author");
		person.buildFromDom(node);
		obj.authors.push(person);
	},
	"contributor": function(obj,node){
		if(obj.contributors === null){obj.contributors = [];}
		var person = new ibm_atom.io.atom.Person("contributor");
		person.buildFromDom(node);
		obj.contributors.push(person);
	},
	"category": function(obj,node){
		if(obj.categories === null){obj.categories = [];}
		var cat = new ibm_atom.io.atom.Category();
		cat.buildFromDom(node);
		obj.categories.push(cat);
	},
	"icon": function(obj,node){
		obj.icon = dojox.data.dom.textContent(node);
	},
	"id": function(obj,node){
		obj.id = dojox.data.dom.textContent(node);
	},
	"rights": function(obj,node){
		obj.rights = dojox.data.dom.textContent(node);
	},
	"subtitle": function(obj,node){
		var cnt = new ibm_atom.io.atom.Content("subtitle");
		cnt.buildFromDom(node);
		obj.subtitle = cnt;
	},
	"title": function(obj,node){
		var cnt = new ibm_atom.io.atom.Content("title");
		cnt.buildFromDom(node);
		obj.title = cnt;
	},
	"updated": function(obj,node){
		obj.updated = ibm_atom.io.atom.util.createDate(node);
	},
	// Google news
	"issued": function(obj,node){
		obj.issued = ibm_atom.io.atom.util.createDate(node);
	},
	// Google news
	"modified": function(obj,node){
		obj.modified = ibm_atom.io.atom.util.createDate(node);
	},
	"published": function(obj,node){
		obj.published = ibm_atom.io.atom.util.createDate(node);	  
	},
	"entry": function(obj,node){
		if(obj.entries === null){obj.entries = [];}
		//The object passed in should be a Feed object, since only feeds can contain Entries
		var entry = obj.createEntry ? obj.createEntry() : new ibm_atom.io.atom.Entry();
		entry.buildFromDom(node);
		obj.entries.push(entry);	
	}, 
   "content": function(obj, node){
		var cnt = new ibm_atom.io.atom.Content("content");
		cnt.buildFromDom(node);
		obj.content = cnt;
	}, 
	"summary": function(obj, node){
		var summary = new ibm_atom.io.atom.Content("summary");
		summary.buildFromDom(node);
		obj.summary = summary;
	}, 

	"name": function(obj,node){
		obj.name = dojox.data.dom.textContent(node);
	},
	"email" : function(obj,node){
		obj.email = dojox.data.dom.textContent(node);
	},
	"uri" : function(obj,node){
		obj.uri = dojox.data.dom.textContent(node);
	},
	"generator" : function(obj,node){
		obj.generator = new ibm_atom.io.atom.Generator();
		obj.generator.buildFromDom(node);
	}
};

ibm_atom.io.atom.util = {
	createDate: function(node){
		// summary: Utility function to create a date from a DOM node's text content.
		// description: Utility function to create a date from a DOM node's text content.
		//
		// node: DOM node.
		//   The DOM node to inspect.
		// returns: Date object from a DOM Node containing a ISO-8610 string.
		var textContent = dojox.data.dom.textContent(node);
		if(textContent){
			return dojo.date.stamp.fromISOString(dojo.trim(textContent));
		}
		return null;
	},
	escapeHtml: function(str){
		// summary: Utility function to escape XML special characters in an HTML string.
		// description: Utility function to escape XML special characters in an HTML string.
		//
		// str: String.
		//   The string to escape
		// returns: HTML String with special characters (<,>,&, ", etc,) escaped.
		str = str.replace(/&/gm, "&amp;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/"/gm, "&quot;");
		str = str.replace(/'/gm, "&#39;"); 
		return str;
	},
	unEscapeHtml: function(str){
		// summary: Utility function to un-escape XML special characters in an HTML string.
		// description: Utility function to un-escape XML special characters in an HTML string.
		//
		// str: String.
		//   The string to un-escape.
		// returns: HTML String converted back to the normal text (unescaped) characters (<,>,&, ", etc,).
		str = str.replace(/&amp;/gm, "&").replace(/&lt;/gm, "<").replace(/&gt;/gm, ">").replace(/&quot;/gm, "\"");
		str = str.replace(/&#39;/gm, "'"); 
		return str;
	},
	getNodename: function(node){
		// summary: Utility function to get a node name and deal with IE's bad handling of namespaces
		//   on tag names.
		// description: Utility function to get a node name and deal with IE's bad handling of namespaces
		//   on tag names.
		//
		// node: DOM node.
		//   The DOM node whose name to retrieve.
		// returns: String
		//   The name without namespace prefixes.
		var name = null;
		if(node !== null){
			var name = node.localName ? node.localName: node.nodeName;
			if(name !== null){
				var nsSep = name.indexOf(":");
				if(nsSep !== -1){
					name = name.substring((nsSep + 1), name.length);
				}
			}
		}
		return name;
	}
}

// This could be declared as a class using dojo.declare, but a couple of its
// methods are copied to other types.  Easier to use standard JS declaration.
ibm_atom.io.atom.Node = function(name_space,name, attributes,content, shortNs){
	this.name_space = name_space;
	this.name = name;
	this.attributes = [];
	if(attributes){
		this.attributes = attributes;
	}
	this.content = [];
	this.rawNodes = [];
	this.textContent = null;
	if(content){
		this.content.push(content);
	}
	this.shortNs = shortNs;
	this._objName = "Node";//for debugging purposes
};
ibm_atom.io.atom.Node.prototype.buildFromDom = function(node){
	this._saveAttributes(node);
	this.name_space = node.namespaceURI;
	this.shortNs = node.prefix;
	this.name = ibm_atom.io.atom.util.getNodename(node);
	for(var x=0; x < node.childNodes.length; x++){
		var c = node.childNodes[x];
		if(ibm_atom.io.atom.util.getNodename(c) != "#text" ){
			this.rawNodes.push(c);
			var n = new ibm_atom.io.atom.Node();
			n.buildFromDom(c, true);
			this.content.push(n);
		}else{
			this.content.push(c.nodeValue);
		}
	}
	this.textContent = dojox.data.dom.textContent(node);
};
ibm_atom.io.atom.Node.prototype._saveAttributes = function(node){
	if(!this.attributes){this.attributes = [];}
	// Work around lack of hasAttributes() in IE
	var hasAttributes = function(node){
		var attrs = node.attributes;
		if(attrs === null){return false;}
		return (attrs.length !== 0);
	};

	if(hasAttributes(node) && this._getAttributeNames){
		var names = this._getAttributeNames(node);
		if(names && names.length > 0){
			for(x in names){
				var attrib = node.getAttribute(names[x]);
				if(attrib){this.attributes[names[x]] = attrib;}
			}
		}
	}
};
ibm_atom.io.atom.Node.prototype.addAttribute = function(name, value){this.attributes[name]=value;};
ibm_atom.io.atom.Node.prototype.getAttribute = function(name){return this.attributes[name];};
//if child objects want their attributes parsed, they should override
//to return an array of attrib names
ibm_atom.io.atom.Node.prototype._getAttributeNames = function(node){
	var names = [];
	for(var i =0; i<node.attributes.length; i++){
		names.push(node.attributes[i].nodeName);
	}
	return names;
};
ibm_atom.io.atom.Node.prototype._getNullAttributeNames = function(){return null;}; 
ibm_atom.io.atom.Node.prototype.toString = function(){
	var xml = [];
	var name = (this.shortNs?this.shortNs+":":'')+this.name;
	var cdata = (this.name == "#cdata-section");
	if(cdata){ 
		xml.push("<![CDATA[");
		xml.push(this.textContent);
		xml.push("]]>");
	}else{
		xml.push("<");
		xml.push(name);
		if(this.name_space){
			xml.push(" xmlns='" + this.name_space + "'");
		}
		if(this.attributes){
			for(x in this.attributes){
				xml.push(" " + x + "='" + this.attributes[x] + "'");
			}
		}
		if(this.content){
			xml.push(">");
			for (x in this.content) 
				xml.push(this.content[x]);
			xml.push("</" + name + ">\n");
		}else{
			xml.push("/>\n");
		}
	}
	return xml.join('');
};
ibm_atom.io.atom.Node.prototype.addContent = function(content){
	this.content.push(content);
}

//Types are as follows: links: array of Link, authors: array of Person, categories: array of Category
//contributors: array of Person, ico
dojo.declare("ibm_atom.io.atom.AtomItem",null,{
	 constructor: function(args){
		this.ATOM_URI = ibm_atom.io.atom._Constants.ATOM_URI;
		this.links = null;				  		//Array of Link
		this.authors = null;					//Array of Person
		this.categories = null;					//Array of Category
		this.contributors = null;				//Array of Person   
		this.icon = this.id = this.logo = this.xmlBase = this.rights = null; //String
		this.subtitle = this.title = null;		//Content
		this.updated = this.published = null;	//Date
		// Google news
		this.issued = this.modified = null;		//Date
		this.content =  null;					//Content
		this.extensions = null;					//Array of Node, non atom based
		this.entries = null;					//Array of Entry
		this.name_spaces = {};
		
		this._objName = "AtomItem";			 //for debugging purposes
	},
	// summary: Class container for generic Atom items.
	// description: Class container for generic Atom items.
	_saveAttributes: ibm_atom.io.atom.Node.prototype._saveAttributes,
	_getAttributeNames: ibm_atom.io.atom.Node.prototype._getNullAttributeNames,
	_accepts: {},
	accept: function(tag){return Boolean(this._accepts[tag]);},
	_postBuild: function(){},//child objects can override this if they want to be called after a Dom build
	buildFromDom: function(node){
		var c;
		for(var i=0; i<node.attributes.length; i++){
			c = node.attributes.item(i);
			if(c.prefix == "xmlns")
				this.addNamespace(c.nodeValue, ibm_atom.io.atom.util.getNodename(c));
		}
		c = node.childNodes;
		for(var i = 0; i< c.length; i++){
			if(c[i].nodeType == 1) {
				var name = ibm_atom.io.atom.util.getNodename(c[i]);
				if(!name){continue;}
				if(c[i].namespaceURI != ibm_atom.io.atom._Constants.ATOM_NS && name != "#text"){
					if(!this.extensions){this.extensions = [];}
					var extensionNode = new ibm_atom.io.atom.Node();
					extensionNode.buildFromDom(c[i]);
					this.extensions.push(extensionNode);
					//this.extensions.push(c[i]);
				}
				if(!this.accept(name.toLowerCase())){
					continue;
				}
				var fn = ibm_atom.io.atom._actions[name];
				if(fn) {
					fn(this,c[i]);
				}
			}
		}
		this._saveAttributes(node); 
		if(this._postBuild){this._postBuild();}
	},
	addNamespace: function(fullName, shortName){
		if(fullName && shortName){
			this.name_spaces[shortName] = fullName;
		}
	},
	addAuthor: function(name, email, uri){
		// summary: Function to add in an author to the list of authors.
		// description: Function to add in an author to the list of authors.
		//
		// name: String
		//   The author's name.
		// email: String
		//   The author's e-mail address.
		// uri: String
		//   A URI associated with the author.

		if(!this.authors){this.authors = [];}
		this.authors.push(new ibm_atom.io.atom.Person("author",name,email,uri));
	},
	addContributor: function(name, email, uri){
		// summary: Function to add in an author to the list of authors.
		// description: Function to add in an author to the list of authors.
		//
		// name: String
		//   The author's name.
		// email: String
		//   The author's e-mail address.
		// uri: String
		//   A URI associated with the author.

		if(!this.contributors){this.contributors = [];}
		this.contributors.push(new ibm_atom.io.atom.Person("contributor",name,email,uri));
	},
	addLink: function(href,rel,hrefLang,title,type){
		// summary: Function to add in a link to the list of links.
		// description: Function to add in a link to the list of links.
		//
		// href: String
		//   The href.
		// rel: String
		// hrefLang: String
		// title: String
		//   A title to associate with the link.
		// type: String
		//   The type of link is is.

		if(!this.links){this.links=[];}
		this.links.push(new ibm_atom.io.atom.Link(href,rel,hrefLang,title,type));
	},
	removeLink: function(href, rel){
		// summary: Function to remove a link from the list of links.
		// description: Function to remove a link from the list of links.
		//
		// href: String
		//   The href.
		// rel: String

		if(!this.links || !dojo.isArray(this.links)){return;}
		var count = 0;
		for(var i = 0;  i < this.links.length; i++){
			if((!href || this.links[i].href === href) && (!rel || this.links[i].rel === rel)){
				this.links.splice(i,1); count++;
			}
		}
		return count;
	},
	removeBasicLinks: function(){
		// summary: Function to remove all basic links from the list of links.
		// description: Function to remove all basic link from the list of links.

		if(!this.links){return;}
		var count = 0;
		for(var i = 0;  i < this.links.length; i++){
			if(!this.links[i].rel){this.links.splice(i,1); count++; i--;}
		}
		return count;
	},
	addCategory: function(scheme, term, label){
		// summary: Function to add in a category to the list of categories.
		// description: Function to add in a category to the list of categories.
		//
		// scheme: String
		// term: String
		// label: String

		if(!this.categories){this.categories = [];}
		this.categories.push(new ibm_atom.io.atom.Category(scheme,term,label));
	},
	getCategories: function(scheme){
		// summary: Function to get all categories that match a particular scheme.
		// description: Function to get all categories that match a particular scheme.
		//
		// scheme: String
		//   The scheme to filter on.

		if(!scheme){return this.categories;}
		//If categories belonging to a particular scheme are required, then create a new array containing these
		var arr = [];
		for(x in this.categories){
			if(this.categories[x].scheme === scheme){arr.push(this.categories[x]);}
		}
		return arr;
	},
	removeCategories: function(scheme, term){
		// summary: Function to remove all categories that match a particular scheme and term.
		// description: Function to remove all categories that match a particular scheme and term.
		//
		// scheme: String
		//   The scheme to filter on.
		// term: String
		//   The term to filter on.

		if(!this.categories){return;}
		var count = 0;
		for(var i=0; i<this.categories.length; i++){
			if((!scheme || this.categories[i].scheme === scheme) && (!term || this.categories[i].term === term)){
				this.categories.splice(i, 1);   count++; i--;
			}
		}
		return count;
	},
	setTitle: function(str, type){
		// summary: Function to set the title of the item.
		// description: Function to set the title of the item.
		//
		// str: String
		//   The title to set.
		// type: String
		//   The type of title format, text, xml, xhtml, etc.

		if(!str){return;}
		this.title = new ibm_atom.io.atom.Content("title");
		this.title.value = str;
		if(type){this.title.type = type;}
	},
	addExtension: function(name_space,name, attributes,content, shortNS){
		// summary: Function to add in an extension namespace into the item.
		// description: Function to add in an extension namespace into the item.
		//
		// name_space: String
		//   The namespace of the extension.
		// name: String
		//   The name of the extension
		// attributes: []
		//   The attributes associated with the extension.
		// content: String
		//   The content of the extension.

		if(!this.extensions){this.extensions=[];}
		this.extensions.push(new ibm_atom.io.atom.Node(name_space,name,attributes,content, shortNS || "ns"+this.extensions.length));
	},
	getExtensions: function(name_space, name){	   
		// summary: Function to get extensions that match a namespace and name.
		// description: Function to get extensions that match a namespace and name.
		//
		// name_space: String
		//   The namespace of the extension.
		// name: String
		//   The name of the extension

		var arr = [];
		if(!this.extensions){return arr;}
		for(x in this.extensions){
			if((this.extensions[x].name_space === name_space || this.extensions[x].shortNs === name_space) && (!name || this.extensions[x].name === name)){
				arr.push(this.extensions[x]);
			}
		}
		return arr;
	},
	removeExtensions: function(name_space,name){
		// summary: Function to remove extensions that match a namespace and name.
		// description: Function to remove extensions that match a namespace and name.
		//
		// name_space: String
		//   The namespace of the extension.
		// name: String
		//   The name of the extension

		if(!this.extensions){return;}
		for(var i=0; i< this.extensions.length; i++){
			if((this.extensions[i].name_space == name_space || this.extensions[i].shortNs === name_space) && this.extensions[i].name === name){
				this.extensions.splice(i,1);
				i--;
			}
		}
	},
	destroy: function() {
		this.links = null;						//Array of Link
		this.authors = null;					//Array of Person
		this.categories = null;					//Array of Category
		this.contributors = null;				//Array of Person   
		this.icon = this.id = this.logo = this.xmlBase = this.rights = null; //String
		this.subtitle = this.title = null;		//Content
		this.updated = this.published = null;	//Date
		// Google news
		this.issued = this.modified = null;		//Date
		this.content =  null;					//Content
		this.extensions = null;					//Array of Node, non atom based
		this.entries = null;					//Array of Entry
	}
});

dojo.declare("ibm_atom.io.atom.Category",null,{
	// summary: Class container for 'Category' types. 
	// description: Class container for 'Category' types.

	constructor: function(scheme, term, label){
		this.scheme = scheme; this.term = term; this.label = label;
		this._objName = "Category";//for debugging
	},
	_postBuild: function(){},
	_getAttributeNames: function(){
		return ["label","scheme","term"];
	},
	toString: function(){
		// summary: Function to construct string form of the category tag, which is an XML structure.
		// description: Function to construct string form of the category tag, which is an XML structure.

		var s = [];
		s.push('<category ');
		if(this.label){s.push(' label="'+this.label+'" ');}
		if(this.scheme){s.push(' scheme="'+this.scheme+'" ');}
		if(this.term){s.push(' term="'+this.term+'" ');}
		s.push('/>\n');
		return s.join('');
	},
	_saveAttributes: ibm_atom.io.atom.Node.prototype._saveAttributes,//copy the Node _saveAttributes function
	buildFromDom: function(node){
		// summary: Function to do construction of the Category data from the DOM node containing it.
		// description: Function to do construction of the Category data from the DOM node containing it.
		//
		// node: DOM node.
		//   The DOM node to process for content.

		this._saveAttributes(node);//just get the attributes from the node
		this.label = this.attributes.label;
		this.scheme = this.attributes.scheme;
		this.term = this.attributes.term;
		if(this._postBuild){this._postBuild();}
	}
});

dojo.declare("ibm_atom.io.atom.Content",null,{
	// summary: Class container for 'Content' types. Such as summary, content, username, and so on types of data.
	// description: Class container for 'Content' types. Such as summary, content, username, and so on types of data.

	constructor: function(tagName, value, src, type,xmlLang){
		this.tagName = tagName; this.value = value; this.src = src; this.type=type; this.xmlLang = xmlLang;
		this.HTML = "html"; this.TEXT = "text"; this.XHTML = "xhtml"; this.XML="xml";
		this._useTextContent = "true";
	},
	_getAttributeNames: function(){return ["type","src"];},
	_postBuild: function(){},
	_saveAttributes: ibm_atom.io.atom.Node.prototype._saveAttributes,//copy the Node _saveAttributes function

	buildFromDom: function(node){
		// summary: Function to do construction of the Content data from the DOM node containing it.
		// description: Function to do construction of the Content data from the DOM node containing it.
		//
		// node: DOM node.
		//   The DOM node to process for content.

		//Handle checking for XML content as the content type
		var type = node.getAttribute("type");
		if(type){
			type = type.toLowerCase();
			if(type == "xml" || "text/xml"){
				type = this.XML;
			}
		}else{
			type="text";
		}
		if(type === this.XML){
			if(node.firstChild){
				var i;
				this.value = "";
				for(i = 0; i < node.childNodes.length; i++){
					var c = node.childNodes[i];
					if(c){
						this.value += dojox.data.dom.innerXML(c);
					}
				}
			}
		} else if(node.innerHTML){
			this.value = node.innerHTML;
		}else{
			this.value = dojox.data.dom.textContent(node);
		}

		this._saveAttributes(node);

		if(this.attributes){
			this.type = this.attributes.type;
			this.scheme = this.attributes.scheme;
			this.term = this.attributes.term;
		}
		if(!this.type){this.type = "text";}

		//We need to unescape the HTML content here so that it can be displayed correctly when the value is fetched.
		var lowerType = this.type.toLowerCase();
		if(lowerType === "html" || lowerType === "text/html" || lowerType === "xhtml" || lowerType === "text/xhtml"){
			this.value = ibm_atom.io.atom.util.unEscapeHtml(this.value);
		}

		if(this._postBuild){this._postBuild()};
	},
	toString: function(){
		// summary: Function to construct string form of the content tag, which is an XML structure.
		// description: Function to construct string form of the content tag, which is an XML structure.

		var s = [];
		s.push('<'+this.tagName+' ');
		if(!this.type){this.type = "text";}
		if(this.type){s.push(' type="'+this.type+'" ');}
		if(this.xmlLang){s.push(' xml:lang="'+this.xmlLang+'" ');}
		if(this.xmlBase){s.push(' xml:base="'+this.xmlBase+'" ');}
		
		//all HTML must be escaped
		if(this.type.toLowerCase() == this.HTML){
			s.push('>'+ibm_atom.io.atom.util.escapeHtml(this.value)+'</'+this.tagName+'>\n');
		}else{
			s.push('>'+this.value+'</'+this.tagName+'>\n');
		}
		var ret = s.join('');
		return ret;
	}
});

dojo.declare("ibm_atom.io.atom.Link",null,{
	// summary: Class container for 'link' types.
	// description: Class container for 'link' types.

	constructor: function(href,rel,hrefLang,title,type){
		this.href = href; this.hrefLang = hrefLang; this.rel = rel; this.title = title;this.type = type;
	},
	_saveAttributes: ibm_atom.io.atom.Node.prototype._saveAttributes,//copy the Node _saveAttributes function
	_getAttributeNames: function(){return ["href","jrefLang","rel","title","type"];},
	_postBuild: function(){},
	buildFromDom: function(node){
		// summary: Function to do construction of the link data from the DOM node containing it.
		// description: Function to do construction of the link data from the DOM node containing it.
		//
		// node: DOM node.
		//   The DOM node to process for link data.

		this._saveAttributes(node);//just get the attributes from the node

		this.href = this.attributes.href;
		this.hrefLang = this.attributes.hreflang;
		this.rel = this.attributes.rel;
		this.title = this.attributes.title;
		this.type = this.attributes.type;

		if(this._postBuild){this._postBuild()};
	},
	toString: function(){
		// summary: Function to construct string form of the link tag, which is an XML structure.
		// description: Function to construct string form of the link tag, which is an XML structure.

		var s = []; 
		s.push('<link ');
		if(this.href){s.push(' href="'+this.href+'" ');}
		if(this.hrefLang){s.push(' hrefLang="'+this.hrefLang+'" ');}
		if(this.rel){s.push(' rel="'+this.rel+'" ');}
		if(this.title){s.push(' title="'+this.title+'" ');}
		if(this.type){s.push(' type = "'+this.type+'" ');}
		s.push('/>\n');
		return s.join('');
	}
});

dojo.declare("ibm_atom.io.atom.Person",null,{
	// summary: Class container for 'person' types, such as Author, controbutors, and so on.
	// description: Class container for 'person' types, such as Author, controbutors, and so on.

	constructor: function(personType, name, email, uri){
		this.author = "author";
		this.contributor = "contributor";
		if(!personType){
			personType = this.author;
		}
		this.personType = personType;
		this.name = name || '';
		this.email = email || '';
		this.uri = uri || '';
		this._objName = "Person";//for debugging
	},
	_saveAttributes: ibm_atom.io.atom.Node.prototype._saveAttributes,//copy the Node _saveAttributes function
	_getAttributeNames: ibm_atom.io.atom.Node.prototype._getNullAttributeNames,
	_postBuild: function(){},
	accept: function(tag){return Boolean(this._accepts[tag]);},//don't accept any child nodes
	buildFromDom: function(node){
		// summary: Function to do construction of the person data from the DOM node containing it.
		// description: Function to do construction of the person data from the DOM node containing it.
		//
		// node: DOM node.
		//   The DOM node to process for person data.

		var c = node.childNodes;
		for(var i = 0; i< c.length; i++){

			var name = ibm_atom.io.atom.util.getNodename(c[i]);
			
			if(!name){continue;}

			if(c[i].namespaceURI != ibm_atom.io.atom._Constants.ATOM_NS && name != "#text"){
				if(!this.extensions){this.extensions = [];}
				var extensionNode = new ibm_atom.io.atom.Node();
				extensionNode.buildFromDom(c[i]);
				this.extensions.push(extensionNode);
			}
			if(!this.accept(name.toLowerCase())){
				continue;
			}
			var fn = ibm_atom.io.atom._actions[name];
			if(fn) {
				fn(this,c[i]);
			}
		}
		this._saveAttributes(node); 
		if(this._postBuild){this._postBuild();}
	},
	_accepts: {
		'name': true,
		'uri': true,
		'email': true
	},
	toString: function(){
		// summary: Function to construct string form of the Person tag, which is an XML structure.
		// description: Function to construct string form of the Person tag, which is an XML structure.

		var s = [];
		s.push('<'+this.personType+'>\n');
		if(this.name){s.push('\t<name>'+this.name+'</name>\n');}
		if(this.email){s.push('\t<email>'+this.email+'</email>\n');}
		if(this.uri){s.push('\t<uri>'+this.uri+'</uri>\n');}
		s.push('</'+this.personType+'>\n');
		return s.join('');
	}
});

dojo.declare("ibm_atom.io.atom.Generator",null,{
	// summary: Class container for 'Generator' types.
	// description: Class container for 'Generator' types.

	constructor: function(uri, version, value){
		this.uri = uri;
		this.version = version;
		this.value = value;
	},
	_postBuild: function(){},
	_saveAttributes: ibm_atom.io.atom.Node.prototype._saveAttributes,//copy the Node _saveAttributes function
	buildFromDom: function(node){
		// summary: Function to do construction of the generator data from the DOM node containing it.
		// description: Function to do construction of the generator data from the DOM node containing it.
		//
		// node: DOM node.
		//   The DOM node to process for link data.

		this.value = dojox.data.dom.textContent(node);
		this._saveAttributes(node);

		this.uri = this.attributes.uri; 
		this.version = this.attributes.version;

		if(this._postBuild){this._postBuild()};
	},
	toString: function(){
		// summary: Function to construct string form of the Generator tag, which is an XML structure.
		// description: Function to construct string form of the Generator tag, which is an XML structure.

		var s = [];
		s.push('<generator ');  
		if(this.uri){s.push(' uri="'+this.uri+'" ');}
		if(this.version){s.push(' version="'+this.version+'" ');}
		s.push('>'+this.value+'</generator>\n');
		var ret = s.join('');
		return ret;
	}
});

dojo.declare("ibm_atom.io.atom.Entry",ibm_atom.io.atom.AtomItem,{
	// summary: Class container for 'Entry' types.
	// description: Class container for 'Entry' types.

	constructor: function(id){
		this.id = id; this._objName = "Entry"; this.feedUrl = null;
	},
	_saveAttributes: ibm_atom.io.atom.Node.prototype._saveAttributes,
	_getAttributeNames: ibm_atom.io.atom.Node.prototype._getNullAttributeNames,
	_accepts: {
		'author': true,
		'content': true,
		'category': true,
		'contributor': true,
		'created': true,
		'id': true,
		'link': true,
		'published': true,
		'rights': true,
		'summary': true,
		'title': true,
		'updated': true,
		'xmlbase': true,
		'issued': true,
		'modified': true
	},
	toString: function(amPrimary){
		// summary: Function to construct string form of the entry tag, which is an XML structure.
		// description: Function to construct string form of the entry tag, which is an XML structure.

		var s = [];
		if(amPrimary){
			s.push("<?xml version='1.0' encoding='UTF-8'?>");
			s.push("<entry xmlns='"+ibm_atom.io.atom._Constants.ATOM_URI+"'");
		}else{s.push("<entry");}
		if(this.xmlBase){s.push(' xml:base="'+this.xmlBase+'" ');}
		for(i in this.name_spaces){s.push(' xmlns:'+i+'="'+this.name_spaces[i]+'"');}
		s.push('>\n');
		s.push('<id>' + (this.id ? this.id: '') + '</id>\n'); 
		if(this.issued && !this.published){this.published = this.issued;}
		if(this.published){s.push('<published>'+dojo.date.stamp.toISOString(this.published)+'</published>\n');}
		if(this.created){s.push('<created>'+dojo.date.stamp.toISOString(this.created)+'</created>\n');}
		//Google News
		if(this.issued){s.push('<issued>'+dojo.date.stamp.toISOString(this.issued)+'</issued>\n');}

		//Google News
		if(this.modified){s.push('<modified>'+dojo.date.stamp.toISOString(this.modified)+'</modified>\n');}

		if(this.modified && !this.updated){this.updated = this.modified;}
		if(this.updated){s.push('<updated>'+dojo.date.stamp.toISOString(this.updated)+'</updated>\n');}
		if(this.rights){s.push('<rights>'+this.rights+'</rights>\n');}
		if(this.title){s.push(this.title.toString());}
		if(this.summary){s.push(this.summary.toString());}
		var arrays = [this.authors,this.categories,this.links,this.contributors,this.extensions];
		for(x in arrays){
			if(arrays[x]){
				for(y in arrays[x]){
					s.push(arrays[x][y]);
				}
			}
		}
		if(this.content){s.push(this.content.toString());}
		s.push("</entry>\n");
		return s.join('');
	},
	getEditHref: function(){
		// summary: Function to get the href that allows editing of this feed entry.
		// description: Function to get the href that allows editing of this feed entry.
		//
		// returns: The href that specifies edit capability.

		if(this.links === null || this.links.length === 0){
			return null;
		}
		for(x in this.links){
			if(this.links[x].rel && this.links[x].rel == "edit"){
				return this.links[x].href;
			}
		}
		return null;
	}
});

dojo.declare("ibm_atom.io.atom.Feed",ibm_atom.io.atom.AtomItem,{
	// summary: Class container for 'Feed' types.
	// description: Class container for 'Feed' types.
	_accepts: {
		'author': true,
		'content': true,
		'category': true,
		'contributor': true,
		'created': true,
		'id': true,
		'link': true,
		'published': true,
		'rights': true,
		'summary': true,
		'title': true,
		'updated': true,
		'xmlbase': true,
		'entry': true,
		'logo': true,
		'issued': true,
		'modified': true,
		'icon': true,
		'subtitle': true
	},
	addEntry: function(entry){
		// summary: Function to add an entry to this feed.
		// description: Function to add an entry to this feed.
		// entry: object
		//   The entry object to add.
		if(!entry.id){
			var _nlsResources = dojo.i18n.getLocalization("ibm_atom.io", "messages");
			throw new Error(_nlsResources.noId);
			return;
		}
		if(!this.entries){this.entries = [];}
		entry.feedUrl = this.getSelfHref();
		this.entries.push(entry);
	},
	getFirstEntry: function(){
		// summary: Function to get the first entry of the feed.
		// description: Function to get the first entry of the feed.
		//
		// returns: The first entry in the feed.

		if(!this.entries || this.entries.length === 0){return null;}
		return this.entries[0];
	},
	getEntry: function(entryId){
		// summary: Function to get an entry by its id.
		// description: Function to get an entry by its id.
		//
		// returns: The entry desired, or null if none.

		if(!this.entries){return null;}
		for(x in this.entries){
			if(this.entries[x].id == entryId){
				return this.entries[x];
			}
		}
		return null;
	},
	removeEntry: function(entry){
		// summary: Function to remove an entry from the list of links.
		// description: Function to remove an entry from the list of links.
		//
		// entry: Object
		//   The entry.

		if(!this.entries){return;}
		var count = 0;
		for(var i = 0;  i < this.entries.length; i++){
			if(this.entries[i] === entry){
				this.entries.splice(i,1);
				count++;
			}
		}
		return count;
	},
	setEntries: function(arrayOfEntry){
		// summary: Function to add a set of entries to the feed.
		// description: Function to get an entry by its id.
		//
		// arrayOfEntry: object[]
		//   An array of entry objects to add to the feed.

		for(x in arrayOfEntry){
			this.addEntry(arrayOfEntry[x]);
		}
	},
	toString: function(){
		// summary: Function to construct string form of the feed tag, which is an XML structure.
		// description: Function to construct string form of the feed tag, which is an XML structure.

		var s = [];
		s.push('<?xml version="1.0" encoding="utf-8"?>\n');
		s.push('<feed xmlns="'+ibm_atom.io.atom._Constants.ATOM_URI+'"');
		if(this.xmlBase){s.push(' xml:base="'+this.xmlBase+'"');}
		for(i in this.name_spaces){s.push(' xmlns:'+i+'="'+this.name_spaces[i]+'"');}
		s.push('>\n');
		s.push('<id>' + (this.id ? this.id: '') + '</id>\n'); 
		if(this.title){s.push(this.title);}
		if(this.copyright && !this.rights){this.rights = this.copyright;}
		if(this.rights){s.push('<rights>' + this.rights + '</rights>\n');}
		
		// Google news
		if(this.issued){s.push('<issued>'+dojo.date.stamp.toISOString(this.issued)+'</issued>\n');}
		if(this.modified){s.push('<modified>'+dojo.date.stamp.toISOString(this.modified)+'</modified>\n');}

		if(this.modified && !this.updated){this.updated=this.modified;}
		if(this.updated){s.push('<updated>'+dojo.date.stamp.toISOString(this.updated)+'</updated>\n');}
		if(this.published){s.push('<published>'+dojo.date.stamp.toISOString(this.published)+'</published>\n');}
		if(this.icon){s.push('<icon>'+this.icon+'</icon>\n');}
		if(this.language){s.push('<language>'+this.language+'</language>\n');}
		if(this.logo){s.push('<logo>'+this.logo+'</logo>\n');}
		if(this.subtitle){s.push(this.subtitle.toString());}
		if(this.tagline){s.push(this.tagline.toString());}
		//TODO: need to figure out what to do with xmlBase
		var arrays = [this.alternateLinks,this.authors,this.categories,this.contributors,this.otherLinks,this.extensions,this.entries];
		for(i in arrays){
			if(arrays[i]){
				for(x in arrays[i]){
					s.push(arrays[i][x]);
				}
			}
		}
		s.push('</feed>');
		return s.join('');
	},
	createEntry: function(){
		// summary: Function to Create a new entry object in the feed.
		// description: Function to Create a new entry object in the feed.
		// returns: An empty entry object in the feed.

		var entry = new ibm_atom.io.atom.Entry();
		entry.feedUrl = this.getSelfHref();
		return entry;
	},
	getSelfHref: function(){
		// summary: Function to get the href that refers to this feed.
		// description: Function to get the href that refers to this feed.
		// returns: The href that refers to this feed or null if none.

		if(this.links === null || this.links.length === 0){
			return null;
		}
		for(x in this.links){
			if(this.links[x].rel && this.links[x].rel == "self"){
				return this.links[x].href;
			}
		}
		return null;
	}
});

dojo.declare("ibm_atom.io.atom.Service",null,{
	// summary: Class container for 'Feed' types.
	// description: Class container for 'Feed' types.

	constructor: function(href){
		this.href = href;
	},
	//builds a Service document.  each element of this, except for the namespace, is the href of 
	//a service that the server supports.  Some of the common services are:
	//"create-entry" , "user-prefs" , "search-entries" , "edit-template" , "categories"
	buildFromDom: function(node){
		// summary: Function to do construction of the Service data from the DOM node containing it.
		// description: Function to do construction of the Service data from the DOM node containing it.
		//
		// node: DOM node.
		//   The DOM node to process for content.

		var href;
		var len = node.childNodes ? node.childNodes.length : 0;
		this.workspaces = [];
		if(node.tagName != "service"){
			// FIXME: Need 0.9 DOM util...
			//node = dojox.data.dom.firstElement(node,"service");
			//if(!node){return;}
			return;
		}
		if(node.namespaceURI != ibm_atom.io.atom._Constants.PURL_NS && node.namespaceURI != ibm_atom.io.atom._Constants.APP_NS){return;}
		var ns = node.namespaceURI;
		this.name_space = node.namespaceURI;
		//find all workspaces, and create them
		var workspaces ;
		if(typeof(node.getElementsByTagNameNS)!= "undefined"){
			workspaces = node.getElementsByTagNameNS(ns,"workspace");
		}else{
			// This block is IE only, which doesn't have a 'getElementsByTagNameNS' function
			workspaces = new Array();
			var temp = node.getElementsByTagName('workspace');
			for(var i=0; i<temp.length; i++){
				if(temp[i].namespaceURI == ns)
					workspaces.push(temp[i]);
			}
		}
		if(workspaces && workspaces.length > 0){
			var wkLen = 0;
			var workspace;
			for(var i = 0; i< workspaces.length; i++){
				workspace = (typeof(workspaces.item)==="undefined"?workspaces[i]:workspaces.item(i));
				var wkspace = new ibm_atom.io.atom.Workspace();
				wkspace.buildFromDom(workspace);
				this.workspaces[wkLen++] = wkspace;
			}
		}
	},
	getCollection: function(url){
		// summary: Function to collections that match a specific url.
		// description: Function to collections that match a specific url.
		//
		// url: String
		//   The URL to match collections against.

		for(var i=0;i<this.workspaces.length;i++){
			var coll=this.workspaces[i].collections;
			for(var j=0;j<coll.length;j++){
				if(coll[j].href == url){
					return coll;
				}
			}
		}
		return null;
	}
});

dojo.declare("ibm_atom.io.atom.Workspace",null,{
	// summary: Class container for 'Workspace' types.
	// description: Class container for 'Workspace' types.

	constructor: function(title){
		this.title = title;
		this.collections = [];
	},

	buildFromDom: function(node){
		// summary: Function to do construction of the Workspace data from the DOM node containing it.
		// description: Function to do construction of the Workspace data from the DOM node containing it.
		//
		// node: DOM node.
		//   The DOM node to process for content.

		var name = ibm_atom.io.atom.util.getNodename(node);
		if(name != "workspace"){return;}
		var c = node.childNodes;
		var len = 0;
		for(var i = 0; i< c.length; i++){
			var child = c[i];
			if(child.nodeType === 1){
				name = ibm_atom.io.atom.util.getNodename(child);
				if(child.namespaceURI == ibm_atom.io.atom._Constants.PURL_NS || child.namespaceURI == ibm_atom.io.atom._Constants.APP_NS){
					if(name === "collection"){
						var coll = new ibm_atom.io.atom.Collection();
						coll.buildFromDom(child);
						this.collections[len++] = coll;
					}
				}else if(child.namespaceURI === ibm_atom.io.atom._Constants.ATOM_NS){
					if(name === "title"){
						this.title = dojox.data.dom.textContent(child);
					}
				}else{/*Only accept the PURL name_space for now */
					var _nlsResources = dojo.i18n.getLocalization("ibm_atom.io", "messages");
					throw new Error(_nlsResources.badNS);
				}
			}
		}
	}
});

dojo.declare("ibm_atom.io.atom.Collection",null,{
	// summary: Class container for 'Collection' types.
	// description: Class container for 'Collection' types.
	constructor: function(href, title){
		this.href = href;
		this.title = title;
		this.attributes = [];
		this.features = [];
		this.children = [];
		this.memberType = null;
		this.id = null;
	},

	buildFromDom: function(node){
		// summary: Function to do construction of the Collection data from the DOM node containing it.
		// description: Function to do construction of the Collection data from the DOM node containing it.
		//
		// node: DOM node.
		//   The DOM node to process for content.

		this.href = node.getAttribute("href");
		var c = node.childNodes;
		for(var i = 0; i< c.length; i++){
			var child = c[i];
			if(child.nodeType === 1){
				var name = ibm_atom.io.atom.util.getNodename(child);
				if(child.namespaceURI == ibm_atom.io.atom._Constants.PURL_NS || child.namespaceURI == ibm_atom.io.atom._Constants.APP_NS){
					if(name === "member-type"){
						this.memberType = dojox.data.dom.textContent(child);
					}else if(name == "feature"){//this IF stmt might need some more work
						if(child.getAttribute("id")){this.features.push(child.getAttribute("id"));}
					}else{
						var unknownTypeChild = new ibm_atom.io.atom.Node();
						unknownTypeChild.buildFromDom(child);
						this.children.push(unknownTypeChild);
					}
				}else if(child.namespaceURI === ibm_atom.io.atom._Constants.ATOM_NS){
					if(name === "id"){
						this.id = dojox.data.dom.textContent(child);
					}else if(name === "title"){
						this.title = dojox.data.dom.textContent(child);
					}
				}
			}
		}
	}
});

dojo.declare("ibm_atom.io.atom.AtomIO",null,{
	// summary: This object implements a transport layer for working with ATOM feeds and ATOM publishing protocols.
	// description: This object implements a transport layer for working with ATOM feeds and ATOM publishing protocols.
	//   Specifically, it provides a mechanism by which feeds can be fetched and entries can be fetched, created
	//   deleted, and modified.  It also provides access to the introspection data.

	constructor: function(/* Boolean */sync){
		// summary: initializer
		this.sync = sync;
	},

	useCache: false,
	alertsEnabled: false,

	getFeed: function(/*String*/url, /*Function*/callback, /*Function*/errorCallback, scope){
		// summary: Function to obtain a s specific ATOM feed from a given ATOM Feed url.
		// description: This function takes the URL for a specific ATOM feed and returns 
		//   the data from that feed to the caller through the use of a callback
		//   handler.
		//
		// url: String
		//   The URL of the ATOM feed to fetch.
		// callback: Function
		//   A function reference that will handle the feed when it has been retrieved.
		//   The callback should accept two parameters:  The feed object and the original complete DOM object.
		// scope: Object
		//	 The scope to use for all callbacks.
		//
		// returns:  Nothing. The return is handled through the callback handler.
		this._getXmlDoc(url, "feed", new ibm_atom.io.atom.Feed(), callback, /*handleDocumentRetrieved,*/ errorCallback, scope);
	},
	
	getService: function(url, callback, errorCallback, scope){  
		 // summary: Function to retrieve an introspection document from the given URL.
		 // description: This function takes the URL for an ATOM item and feed and returns 
		 //   the introspection document.
		 //
		 // url: String
		 //   The URL of the ATOM document to obtain the introspection document of.
		 // callback: Function 
		 //   A function reference that will handle the introspection document when it has been retrieved.
		 //   The callback should accept two parameters:  The introspection document object and the original complete DOM object.
		 //
		 // returns:  Nothing. The return is handled through the callback handler.
		 
		//_getXmlDoc now uses Dojo.io.bind under the covers...
		this._getXmlDoc(url, "service", new ibm_atom.io.atom.Service(url), callback, errorCallback, scope);
	},
	
	getEntry: function(url, callback, errorCallback, scope){
		// summary: Function to retrieve a single entry from an ATOM feed from the given URL.
		// description: This function takes the URL for an ATOM entry and returns the constructed ibm_atom.io.atom.Entry object through
		//	the specified callback.
		//
		// url: String
		//   The URL of the ATOM Entry document to parse.
		// callback: Function
		//   A function reference that will handle the Entry object obtained.   
		//   The callback should accept two parameters, the ibm_atom.io.atom.Entry object and the original dom.
		//
		// returns:  Nothing. The return is handled through the callback handler.
		//_getXmlDoc now uses Dojo.io.bind under the covers...
		this._getXmlDoc(url, "entry", new ibm_atom.io.atom.Entry(), callback, errorCallback, scope);
	},

	_getXmlDoc: function(url, nodeName, newNode, callback, errorCallback, scope){
		// summary: Internal Function to retrieve an XML document and pass the results to a callback.
		// description: This internal function takes the URL for an XML document and and passes the 
		//	parsed contents to a specified callback.
		//
		// url: String
		//   The URL of the XML document to retrieve
		// callback: Function
		//	A function reference that will handle the retrieved XML data.
		//   The callback should accept one parameter, the DOM of the parsed XML document.
		//
		// returns:  Nothing. The return is handled through the callback handler.
		if(!scope){
			scope = dojo.global;
		}
		var ae = this.alertsEnabled;
		var bindArgs = {
			url: url,
			handleAs: "xml",
			sync: this.sync,
			load: function(data, args){
				var node	 = null;
				var evaldObj = data;
				if(evaldObj){
					//find the first node of the appropriate name
					if(typeof(evaldObj.getElementsByTagNameNS)!= "undefined"){
						var nodes = evaldObj.getElementsByTagNameNS(ibm_atom.io.atom._Constants.ATOM_NS,nodeName);
						if(nodes && nodes.length > 0){
							node = nodes.item(0);
                            }else if(evaldObj.lastChild){
							// name_spaces can be used without declaration of atom (for example
							// gooogle feeds often returns iTunes name_space qualifiers on elements)
							// Treat this situation like name_spaces not enabled.
							node = evaldObj.lastChild;
						} 
					}else if(evaldObj.lastChild){
						function findNode(nname, sNode){
							var locatedNode;
							var n = ibm_atom.io.atom.util.getNodename(sNode);
							if(n == nname){
								locatedNode = sNode;
							}else{
								if(sNode.childNodes){
									var i;
									for(i = 0; i < sNode.childNodes.length; i++){
										var c = sNode.childNodes[i];
										n = ibm_atom.io.atom.util.getNodename(c);
										if (n == nname) {
											locatedNode = c;
											break;
										}
                                    }
									if(!locatedNode){
										for(i = 0; i < sNode.childNodes.length; i++){
											locatedNode = findNode(nname, sNode.childNodes[i]);
											if(locatedNode){
												break;
											}
										}
									}
								}
							}
							return locatedNode;
						}
						node = findNode(nodeName, evaldObj.lastChild);
					}else{
						callback.call(scope, null, null, args);
						return;
					}
					newNode.buildFromDom(node);
					if(callback){
						callback.call(scope, newNode, evaldObj, args);
					}else if(ae){
						var _nlsResources = dojo.i18n.getLocalization("ibm_atom.io", "messages");
						throw new Error(_nlsResources.noCallback);
					}
				}else{
					callback.call(scope, null, null, args);
				}
			}
		};

		if(this.user && this.user !== null){
			bindArgs.user = this.user;
		}
		if(this.password && this.password !== null){
			bindArgs.password = this.password;
		}

		if(errorCallback){
			bindArgs.error = function(error, args){errorCallback.call(scope, error, args);}
		}else{
			bindArgs.error = function(){
				var _nlsResources = dojo.i18n.getLocalization("ibm_atom.io", "messages");
				throw new Error(_nlsResources.failedXhr);
			};
		}
		dojo.xhrGet(bindArgs);
	},

	updateEntry: function(entry, callback, errorCallback, retrieveUpdated, xmethod, scope){
		// summary: Function to update a specific ATOM entry by putting the new changes via APP.
		// description: This function takes a specific ibm_atom.io.atom.Entry object and pushes the 
		//   changes back to the provider of the Entry.
		//   The entry MUST have a link tag with rel="edit" for this to work.
		//
		// entry: Object
		//   The ibm_atom.io.aton.Entry object to update.
		// callback: Function
		//   A function reference that will handle the results from the entry update.
		//   The callback should accept two parameters:  The first is an Entry object, and the second is the URL of that Entry
		//   Either can be null, depending on the value of retrieveUpdated.
		// retrieveUpdated: boolean
		//   A boolean flag denoting if the entry that was updated should then be 
		//   retrieved and returned to the caller via the callback.
		// xmethod: boolean
		//	 Whether to use POST for PUT/DELETE items and send the X-Method-Override header.
		// scope: Object
		//	 The scope to use for all callbacks.
		//
		// returns:  Nothing. The return is handled through the callback handler.
		if(!scope){
			scope = dojo.global;
		}

		entry.updated = new Date();

		var url = entry.getEditHref();
		if(!url){
			var _nlsResources = dojo.i18n.getLocalization("ibm_atom.io", "messages");
			throw new Error(_nlsResources.missingEditUrl);
			return;
		}

		var self = this;
		var ae = this.alertsEnabled;
		var bindArgs = {
			url: url,
			handleAs: "text",
			contentType: "text/xml",
			sync: this.sync,
			load: function(data, args){
				var location = null;
				if(retrieveUpdated){
					location = args.xhr.getResponseHeader("Location");
					if(!location){location = url;}

					//Function to handle the callback mapping of a getEntry after an update to return the
					//entry and location.
					function handleRetrieve(entry, dom, args){
						if(callback){
							callback.call(scope, entry, location, args);
						}else if(ae){
							var _nlsResources = dojo.i18n.getLocalization("ibm_atom.io", "messages");
							throw new Error(_nlsResources.noCallback);
						}
					}
					self.getEntry(location,handleRetrieve);
				}else{
					if(callback){
						callback.call(scope, entry, args.xhr.getResponseHeader("Location"), args);
					}else if(ae){
						var _nlsResources = dojo.i18n.getLocalization("ibm_atom.io", "messages");
						throw new Error(_nlsResources.noCallback);
					}
				}
				return data;
			}
		};
		
		if(this.user && this.user !== null){
			bindArgs.user = this.user;
		}
		if(this.password && this.password !== null){
			bindArgs.password = this.password;
		}

		if(errorCallback){
			bindArgs.error = function(error, args){errorCallback.call(scope, error, args);};
		}else{
			bindArgs.error = function(){
				var _nlsResources = dojo.i18n.getLocalization("ibm_atom.io", "messages");
				throw new Error(_nlsResources.failedXhr);
			};
		}

		if(xmethod){
			bindArgs.postData = entry.toString(true); //Set the content to send.
			bindArgs.headers = {"X-Method-Override": "PUT"};
			dojo.rawXhrPost(bindArgs);
		}else{
			bindArgs.putData = entry.toString(true); //Set the content to send.
			xhr = dojo.rawXhrPut(bindArgs);
		}
	},

	addEntry: function(entry, url, callback, errorCallback, retrieveEntry, scope){
		// summary: Function to add a new ATOM entry by posting the new entry via APP.
		// description: This function takes a specific ibm_atom.io.atom.Entry object and pushes the 
		//   changes back to the provider of the Entry.
		//
		// entry: Object
		//   The ibm_atom.io.aton.Entry object to publish.
		// callback: Function
		//   A function reference that will handle the results from the entry publish.
		//   The callback should accept two parameters:   The first is an ibm_atom.io.atom.Entry object, and the second is the location of the entry
		//   Either can be null, depending on the value of retrieveUpdated.
		// retrieveEntry: boolean
		//   A boolean flag denoting if the entry that was created should then be 
		//   retrieved and returned to the caller via the callback.
		// scope: Object
		//	 The scope to use for all callbacks.
		//
		// returns:  Nothing. The return is handled through the callback handler.
		if(!scope)
			scope = dojo.global;

		entry.published = new Date();
		entry.updated = new Date();

		var feedUrl = entry.feedUrl;
		var ae = this.alertsEnabled;

		//Determine which URL to use for the post.
		if(!url && feedUrl){url = feedUrl;}
		if(!url){
			if(ae){
				var _nlsResources = dojo.i18n.getLocalization("ibm_atom.io", "messages");
				throw new Error(_nlsResources.missingUrl);
			}
			return;
		}

		var self = this;
		var bindArgs = {
			url: url,
			handleAs: "text",
			contentType: "text/xml",
			sync: this.sync,
			postData: entry.toString(true),
			load: function(data, args){
				var location = args.xhr.getResponseHeader("Location");
				if(!location){
					location = url;
				}
				if(!args.retrieveEntry){
					if(callback){
						callback.call(scope, entry, location, args);
					}else if(ae){
						var _nlsResources = dojo.i18n.getLocalization("ibm_atom.io", "messages");
						throw new Error(_nlsResources.noCallback);
					}
				}else{
					//Function to handle the callback mapping of a getEntry after an update to return the
					//entry and location.
					function handleRetrieve(entry, dom, args) {
						if(callback){
							callback.call(scope, entry, location, args);
						}else if(ae){
							var _nlsResources = dojo.i18n.getLocalization("ibm_atom.io", "messages");
							throw new Error(_nlsResources.noCallback);
						}
					}
					self.getEntry(location,handleRetrieve);  
				}
				return data;
			}
		};

		if(this.user && this.user !== null){
			bindArgs.user = this.user;
		}
		if(this.password && this.password !== null){
			bindArgs.password = this.password;
		}

		if(errorCallback){
			bindArgs.error = function(error, args){errorCallback.call(scope, error, args);};
		}else{
			bindArgs.error = function(){
				var _nlsResources = dojo.i18n.getLocalization("ibm_atom.io", "messages");
				throw new Error(_nlsResources.failedXhr);
			};
		}
		dojo.rawXhrPost(bindArgs);
	},

	deleteEntry: function(entry,callback,errorCallback,xmethod,scope){
		// summary: Function to delete a specific ATOM entry via APP.
		// description: This function takes a specific ibm_atom.io.atom.Entry object and calls for a delete on the
		//   service housing the ATOM Entry database.
		//   The entry MUST have a link tag with rel="edit" for this to work.
		//
		// entry: Object
		//   The ibm_atom.io.aton.Entry object to delete.
		// callback: Function
		//   A function reference that will handle the results from the entry delete.
		//   The callback should accept one parameters:   The callback is passed true if delete is successful, false otherwise.
		//
		// returns:  Nothing. The return is handled through the callback handler.
		if(!scope){
			scope = dojo.global;
		}

		var url = null;
		if(typeof(entry)=="string"){
			url = entry;
		}else{
			url = entry.getEditHref();
		}
		if(!url){
			var _nlsResources = dojo.i18n.getLocalization("ibm_atom.io", "messages");
			throw new Error(_nlsResources.missingUrl);
			callback.call(scope, false, null);
		}

		var bindArgs = {
			url: url,
			handleAs: "text",
			sync: this.sync,
			load: function(data, args){
				callback.call(scope,true, args);
				return data;
			}
		};

		if(this.user && this.user !== null){
			bindArgs.user = this.user;
		}
		if(this.password && this.password !== null){
			bindArgs.password = this.password;
		}

		if(errorCallback){
			bindArgs.error = function(error, args){errorCallback.call(scope, error, args);};
		}else{
			bindArgs.error = function(){
				var _nlsResources = dojo.i18n.getLocalization("ibm_atom.io", "messages");
				throw new Error(_nlsResources.failedXhr);
			};
		}
		if(xmethod){
			bindArgs.headers = {"X-Method-Override": "DELETE"};
			dojo.xhrPost(bindArgs);
		}else{
			dojo.xhrDelete(bindArgs);
		}
	} 
});
