/*
	Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/

/*
	This is an optimized version of Dojo, built for deployment and not for
	development. To get sources and documentation, please visit:

		http://dojotoolkit.org
*/

if(!dojo._hasResource["dojox.string.Builder"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.string.Builder"] = true;
dojo.provide("dojox.string.Builder");

dojox.string.Builder = function(/*String?*/str){
	//	summary:
	//		A fast buffer for creating large strings.
	//
	//	length: Number
	//		The current length of the internal string.

	//	N.B. the public nature of the internal buffer is no longer
	//	needed because the IE-specific fork is no longer needed--TRT.
	var b = "";
	this.length = 0;
	
	this.append = function(/* String... */s){ 
		// summary: Append all arguments to the end of the buffer 
		if(arguments.length>1){
			/*  
				This is a loop unroll was designed specifically for Firefox;
				it would seem that static index access on an Arguments
				object is a LOT faster than doing dynamic index access.
				Therefore, we create a buffer string and take advantage
				of JS's switch fallthrough.  The peformance of this method
				comes very close to straight up string concatenation (+=).

				If the arguments object length is greater than 9, we fall
				back to standard dynamic access.

				This optimization seems to have no real effect on either
				Safari or Opera, so we just use it for all.

				It turns out also that this loop unroll can increase performance
				significantly with Internet Explorer, particularly when 
				as many arguments are provided as possible.

				Loop unroll per suggestion from Kris Zyp, implemented by 
				Tom Trenka.

				Note: added empty string to force a string cast if needed.
			 */
			var tmp="", l=arguments.length;
			switch(l){
				case 9: tmp=""+arguments[8]+tmp;
				case 8: tmp=""+arguments[7]+tmp;
				case 7: tmp=""+arguments[6]+tmp;
				case 6: tmp=""+arguments[5]+tmp;
				case 5: tmp=""+arguments[4]+tmp;
				case 4: tmp=""+arguments[3]+tmp;
				case 3: tmp=""+arguments[2]+tmp;
				case 2: {
					b+=""+arguments[0]+arguments[1]+tmp;
					break;
				}
				default: {
					var i=0;
					while(i<arguments.length){
						tmp += arguments[i++];
					}
					b += tmp;
				}
			}
		} else {
			b += s;
		}
		this.length = b.length;
		return this;	//	dojox.string.Builder
	};
	
	this.concat = function(/*String...*/s){
		//	summary:
		//		Alias for append.
		return this.append.apply(this, arguments);	//	dojox.string.Builder
	};
	
	this.appendArray = function(/*Array*/strings) {
		//	summary:
		//		Append an array of items to the internal buffer.

		//	Changed from String.prototype.concat.apply because of IE.
		return this.append.apply(this, strings);	//	dojox.string.Builder
	};
	
	this.clear = function(){
		//	summary: 
		//		Remove all characters from the buffer.
		b = "";
		this.length = 0;
		return this;	//	dojox.string.Builder
	};
	
	this.replace = function(/* String */oldStr, /* String */ newStr){
		// 	summary: 
		//		Replace instances of one string with another in the buffer.
		b = b.replace(oldStr,newStr);
		this.length = b.length;
		return this;	//	dojox.string.Builder
	};
	
	this.remove = function(/* Number */start, /* Number? */len){
		//	summary:
		//		Remove len characters starting at index start.  If len
		//		is not provided, the end of the string is assumed.
		if(len===undefined){ len = b.length; }
		if(len == 0){ return this; }
		b = b.substr(0, start) + b.substr(start+len);
		this.length = b.length;
		return this;	//	dojox.string.Builder
	};
	
	this.insert = function(/* Number */index, /* String */str){
		//	summary: 
		//		Insert string str starting at index.
		if(index == 0){
			b = str + b;
		}else{
			b = b.slice(0, index) + str + b.slice(index);
		}
		this.length = b.length;
		return this;	//	dojox.string.Builder
	};
	
	this.toString = function(){
		//	summary:
		//		Return the string representation of the internal buffer.
		return b;	//	String
	};

	//	initialize the buffer.
	if(str){ this.append(str); }
};

}

if(!dojo._hasResource["dojox.string.tokenize"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.string.tokenize"] = true;
dojo.provide("dojox.string.tokenize");

dojox.string.tokenize = function(/*String*/ str, /*RegExp*/ re, /*Function?*/ parseDelim, /*Object?*/ instance){
	// summary:
	//		Split a string by a regular expression with the ability to capture the delimeters
	// parseDelim:
	//		Each group (excluding the 0 group) is passed as a parameter. If the function returns
	//		a value, it's added to the list of tokens.
	// instance:
	//		Used as the "this" instance when calling parseDelim
	var tokens = [];
	var match, content, lastIndex = 0;
	while(match = re.exec(str)){
		content = str.slice(lastIndex, re.lastIndex - match[0].length);
		if(content.length){
			tokens.push(content);
		}
		if(parseDelim){
			if(dojo.isOpera){
				var copy = match.slice(0);
				while(copy.length < match.length){
					copy.push(null);
				}
				match = copy;
			}
			var parsed = parseDelim.apply(instance, match.slice(1).concat(tokens.length));
			if(typeof parsed != "undefined"){
				tokens.push(parsed);
			}
		}
		lastIndex = re.lastIndex;
	}
	content = str.slice(lastIndex);
	if(content.length){
		tokens.push(content);
	}
	return tokens;
}

}

if(!dojo._hasResource["dojox.dtl._base"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.dtl._base"] = true;
dojo.provide("dojox.dtl._base");




dojo.experimental("dojox.dtl");

(function(){
	var dd = dojox.dtl;

	dd.TOKEN_BLOCK = -1;
	dd.TOKEN_VAR = -2;
	dd.TOKEN_COMMENT = -3;
	dd.TOKEN_TEXT = 3;

	dd._Context = dojo.extend(function(dict){
		// summary: Pass one of these when rendering a template to tell the template what values to use.
		if(dict){
			dojo._mixin(this, dict);
			if(dict.get){
				// Preserve passed getter and restore prototype get
				this._getter = dict.get;
				delete this.get;
			}
		}
	},
	{
		push: function(){
			var last = this;
			var context = dojo.delegate(this);
			context.pop = function(){ return last; }
			return context;
		},
		pop: function(){
			throw new Error("pop() called on empty Context");
		},
		get: function(key, otherwise){
			var n = this._normalize;

			if(this._getter){
				var got = this._getter(key);
				if(typeof got != "undefined"){
					return n(got);
				}
			}

			if(typeof this[key] != "undefined"){
				return n(this[key]);
			}

			return otherwise;
		},
		_normalize: function(value){
			if(value instanceof Date){
				value.year = value.getFullYear();
				value.month = value.getMonth() + 1;
				value.day = value.getDate();
				value.date = value.year + "-" + ("0" + value.month).slice(-2) + "-" + ("0" + value.day).slice(-2);
				value.hour = value.getHours();
				value.minute = value.getMinutes();
				value.second = value.getSeconds();
				value.microsecond = value.getMilliseconds();
			}
			return value;
		},
		update: function(dict){
			var context = this.push();
			if(dict){
				dojo._mixin(this, dict);
			}
			return context;
		}
	});

	var smart_split_re = /("(?:[^"\\]*(?:\\.[^"\\]*)*)"|'(?:[^'\\]*(?:\\.[^'\\]*)*)'|[^\s]+)/g;           
	var split_re = /\s+/g;
	var split = function(/*String|RegExp?*/ splitter, /*Integer?*/ limit){
		splitter = splitter || split_re;
		if(!(splitter instanceof RegExp)){
			splitter = new RegExp(splitter, "g");
		}
		if(!splitter.global){
			throw new Error("You must use a globally flagged RegExp with split " + splitter);
		}
		splitter.exec(""); // Reset the global

		var part, parts = [], lastIndex = 0, i = 0;
		while(part = splitter.exec(this)){
			parts.push(this.slice(lastIndex, splitter.lastIndex - part[0].length));
			lastIndex = splitter.lastIndex;
			if(limit && (++i > limit - 1)){
				break;
			}
		}
		parts.push(this.slice(lastIndex));
		return parts;
	}

	dd.Token = function(token_type, contents){
		this.token_type = token_type;
		this.contents = new String(dojo.trim(contents));
		this.contents.split = split;
		this.split = function(){
			return String.prototype.split.apply(this.contents, arguments);
		}
	}
	dd.Token.prototype.split_contents = function(/*Integer?*/ limit){
		var bit, bits = [], i = 0;
		limit = limit || 999;
		while(i++ < limit && (bit = smart_split_re.exec(this.contents))){
			bit = bit[0];
			if(bit.charAt(0) == '"' && bit.slice(-1) == '"'){
				bits.push('"' + bit.slice(1, -1).replace('\\"', '"').replace('\\\\', '\\') + '"');
			}else if(bit.charAt(0) == "'" && bit.slice(-1) == "'"){
				bits.push("'" + bit.slice(1, -1).replace("\\'", "'").replace('\\\\', '\\') + "'");
			}else{
				bits.push(bit);
			}
		}
		return bits;
	}

	var ddt = dd.text = {
		_get: function(module, name, errorless){
			// summary: Used to find both tags and filters
			var params = dd.register.get(module, name.toLowerCase(), errorless);
			if(!params){
				if(!errorless){
					throw new Error("No tag found for " + name);
				}
				return null;
			}

			var fn = params[1];
			var require = params[2];

			var parts;
			if(fn.indexOf(":") != -1){
				parts = fn.split(":");
				fn = parts.pop();
			}

			dojo["require"](require);

			var parent = dojo.getObject(require);

			return parent[fn || name] || parent[name + "_"] || parent[fn + "_"];
		},
		getTag: function(name, errorless){
			return ddt._get("tag", name, errorless);
		},
		getFilter: function(name, errorless){
			return ddt._get("filter", name, errorless);
		},
		getTemplate: function(file){
			return new dd.Template(ddt.getTemplateString(file));
		},
		getTemplateString: function(file){
			return dojo._getText(file.toString()) || "";
		},
		_resolveLazy: function(location, sync, json){
			if(sync){
				if(json){
					return dojo.fromJson(dojo._getText(location)) || {};
				}else{
					return dd.text.getTemplateString(location);
				}
			}else{
				return dojo.xhrGet({
					handleAs: (json) ? "json" : "text",
					url: location
				});
			}
		},
		_resolveTemplateArg: function(arg, sync){
			if(ddt._isTemplate(arg)){
				if(!sync){
					var d = new dojo.Deferred();
					d.callback(arg);
					return d;
				}
				return arg;
			}
			return ddt._resolveLazy(arg, sync);
		},
		_isTemplate: function(arg){
			return (typeof arg == "undefined") || (typeof arg == "string" && (arg.match(/^\s*[<{]/) || arg.indexOf(" ") != -1));
		},
		_resolveContextArg: function(arg, sync){
			if(arg.constructor == Object){
				if(!sync){
					var d = new dojo.Deferred;
					d.callback(arg);
					return d;
				}
				return arg;
			}
			return ddt._resolveLazy(arg, sync, true);
		},
		_re: /(?:\{\{\s*(.+?)\s*\}\}|\{%\s*(load\s*)?(.+?)\s*%\})/g,
		tokenize: function(str){
			return dojox.string.tokenize(str, ddt._re, ddt._parseDelims);
		},
		_parseDelims: function(varr, load, tag){
			if(varr){
				return [dd.TOKEN_VAR, varr];
			}else if(load){
				var parts = dojo.trim(tag).split(/\s+/g);
				for(var i = 0, part; part = parts[i]; i++){
					dojo["require"](part);
				}
			}else{
				return [dd.TOKEN_BLOCK, tag];
			}
		}
	}

	dd.Template = dojo.extend(function(/*String|dojo._Url*/ template, /*Boolean*/ isString){
		// template:
		//		The string or location of the string to
		//		use as a template
		var str = isString ? template : ddt._resolveTemplateArg(template, true) || "";
		var tokens = ddt.tokenize(str);
		var parser = new dd._Parser(tokens);
		this.nodelist = parser.parse();
	},
	{
		update: function(node, context){
			// node: DOMNode|String|dojo.NodeList
			//		A node reference or set of nodes
			// context: dojo._Url|String|Object
			//		The context object or location
			return ddt._resolveContextArg(context).addCallback(this, function(contextObject){
				var content = this.render(new dd._Context(contextObject));
				if(node.forEach){
					node.forEach(function(item){
						item.innerHTML = content;
					});
				}else{
					dojo.byId(node).innerHTML = content;
				}
				return this;
			});
		},
		render: function(context, /*concatenatable?*/ buffer){
			buffer = buffer || this.getBuffer();
			context = context || new dd._Context({});
			return this.nodelist.render(context, buffer) + "";
		},
		getBuffer: function(){
			
			return new dojox.string.Builder();
		}
	});

	var qfRe = /\{\{\s*(.+?)\s*\}\}/g;
	dd.quickFilter = function(str){
		if(!str){
			return new dd._NodeList();
		}

		if(str.indexOf("{%") == -1){
			return new dd._QuickNodeList(dojox.string.tokenize(str, qfRe, function(token){
				return new dd._Filter(token);
			}));
		}
	}

	dd._QuickNodeList = dojo.extend(function(contents){
		this.contents = contents;
	},
	{
		render: function(context, buffer){
			for(var i=0, l=this.contents.length; i<l; i++){
				if(this.contents[i].resolve){
					buffer = buffer.concat(this.contents[i].resolve(context));
				}else{
					buffer = buffer.concat(this.contents[i]);
				}
			}
			return buffer;
		},
		dummyRender: function(context){ return this.render(context, dd.Template.prototype.getBuffer()).toString(); },
		clone: function(buffer){ return this; }
	});

	dd._Filter = dojo.extend(function(token){
		// summary: Uses a string to find (and manipulate) a variable
		if(!token) throw new Error("Filter must be called with variable name");
		this.contents = token;

		var cache = this._cache[token];
		if(cache){
			this.key = cache[0];
			this.filters = cache[1];
		}else{
			this.filters = [];
			dojox.string.tokenize(token, this._re, this._tokenize, this);
			this._cache[token] = [this.key, this.filters];
		}
	},
	{
		_cache: {},
		_re: /(?:^_\("([^\\"]*(?:\\.[^\\"])*)"\)|^"([^\\"]*(?:\\.[^\\"]*)*)"|^([a-zA-Z0-9_.]+)|\|(\w+)(?::(?:_\("([^\\"]*(?:\\.[^\\"])*)"\)|"([^\\"]*(?:\\.[^\\"]*)*)"|([a-zA-Z0-9_.]+)|'([^\\']*(?:\\.[^\\']*)*)'))?|^'([^\\']*(?:\\.[^\\']*)*)')/g,
		_values: {
			0: '"', // _("text")
			1: '"', // "text"
			2: "", // variable
			8: '"' // 'text'
		},
		_args: {
			4: '"', // :_("text")
			5: '"', // :"text"
			6: "", // :variable
			7: "'"// :'text'
		},
		_tokenize: function(){
			var pos, arg;

			for(var i = 0, has = []; i < arguments.length; i++){
				has[i] = (typeof arguments[i] != "undefined" && typeof arguments[i] == "string" && arguments[i]);
			}

			if(!this.key){
				for(pos in this._values){
					if(has[pos]){
						this.key = this._values[pos] + arguments[pos] + this._values[pos];
						break;
					}
				}
			}else{
				for(pos in this._args){
					if(has[pos]){
						var value = arguments[pos];
						if(this._args[pos] == "'"){
							value = value.replace(/\\'/g, "'");
						}else if(this._args[pos] == '"'){
							value = value.replace(/\\"/g, '"');
						}
						arg = [!this._args[pos], value];
						break;
					}
				}
				// Get a named filter
				var fn = ddt.getFilter(arguments[3]);
				if(!dojo.isFunction(fn)) throw new Error(arguments[3] + " is not registered as a filter");
				this.filters.push([fn, arg]);
			}
		},
		getExpression: function(){
			return this.contents;
		},
		resolve: function(context){
			if(typeof this.key == "undefined"){
				return "";
			}

			var str = this.resolvePath(this.key, context);

			for(var i = 0, filter; filter = this.filters[i]; i++){
				// Each filter has the function in [0], a boolean in [1][0] of whether it's a variable or a string
				// and [1][1] is either the variable name of the string content.
				if(filter[1]){
					if(filter[1][0]){
						str = filter[0](str, this.resolvePath(filter[1][1], context));
					}else{
						str = filter[0](str, filter[1][1]);
					}
				}else{
					str = filter[0](str);
				}
			}

			return str;
		},
		resolvePath: function(path, context){
			var current, parts;
			var first = path.charAt(0);
			var last = path.slice(-1);
			if(!isNaN(parseInt(first))){
				current = (path.indexOf(".") == -1) ? parseInt(path) : parseFloat(path);
			}else if(first == '"' && first == last){
				current = path.slice(1, -1);
			}else{
				if(path == "true"){ return true; }
				if(path == "false"){ return false; }
				if(path == "null" || path == "None"){ return null; }
				parts = path.split(".");
				current = context.get(parts[0]);

				if(dojo.isFunction(current)){
					var self = context.getThis && context.getThis();
					if(current.alters_data){
						current = "";
					}else if(self){
						current = current.call(self);
					}else{
						current = "";
					}
				}

				for(var i = 1; i < parts.length; i++){
					var part = parts[i];
					if(current){
						var base = current;
						if(dojo.isObject(current) && part == "items" && typeof current[part] == "undefined"){
							var items = [];
							for(var key in current){
								items.push([key, current[key]]);
							}
							current = items;
							continue;
						}

						if(current.get && dojo.isFunction(current.get) && current.get.safe){
							current = current.get(part);
						}else if(typeof current[part] == "undefined"){
							current = current[part];
							break;
						}else{
							current = current[part];
						}

						if(dojo.isFunction(current)){
							if(current.alters_data){
								current = "";
							}else{
								current = current.call(base);
							}
						}else if(current instanceof Date){
							current = dd._Context.prototype._normalize(current);
						}
					}else{
						return "";
					}
				}
			}
			return current;
		}
	});

	dd._TextNode = dd._Node = dojo.extend(function(/*Object*/ obj){
		// summary: Basic catch-all node
		this.contents = obj;
	},
	{
		set: function(data){
			this.contents = data;
			return this;
		},
		render: function(context, buffer){
			// summary: Adds content onto the buffer
			return buffer.concat(this.contents);
		},
		isEmpty: function(){
			return !dojo.trim(this.contents);
		},
		clone: function(){ return this; }
	});

	dd._NodeList = dojo.extend(function(/*Node[]*/ nodes){
		// summary: Allows us to render a group of nodes
		this.contents = nodes || [];
		this.last = "";
	},
	{
		push: function(node){
			// summary: Add a new node to the list
			this.contents.push(node);
			return this;
		},
		concat: function(nodes){
			this.contents = this.contents.concat(nodes);
			return this;
		},
		render: function(context, buffer){
			// summary: Adds all content onto the buffer
			for(var i = 0; i < this.contents.length; i++){
				buffer = this.contents[i].render(context, buffer);
				if(!buffer) throw new Error("Template must return buffer");
			}
			return buffer;
		},
		dummyRender: function(context){
			return this.render(context, dd.Template.prototype.getBuffer()).toString();
		},
		unrender: function(){ return arguments[1]; },
		clone: function(){ return this; },
		rtrim: function(){
			while(1){
				i = this.contents.length - 1;
				if(this.contents[i] instanceof dd._TextNode && this.contents[i].isEmpty()){
					this.contents.pop();
				}else{
					break;
				}
			}

			return this;
		}
	});

	dd._VarNode = dojo.extend(function(str){
		// summary: A node to be processed as a variable
		this.contents = new dd._Filter(str);
	},
	{
		render: function(context, buffer){
			var str = this.contents.resolve(context);
			if(!str.safe){
				str = dd._base.escape("" + str);
			}
			return buffer.concat(str);
		}
	});

	dd._noOpNode = new function(){
		// summary: Adds a no-op node. Useful in custom tags
		this.render = this.unrender = function(){ return arguments[1]; }
		this.clone = function(){ return this; }
	}

	dd._Parser = dojo.extend(function(tokens){
		// summary: Parser used during initialization and for tag groups.
		this.contents = tokens;
	},
	{
		i: 0,
		parse: function(/*Array?*/ stop_at){
			// summary: Turns tokens into nodes
			// description: Steps into tags are they're found. Blocks use the parse object
			//		to find their closing tag (the stop_at array). stop_at is inclusive, it
			//		returns the node that matched.
			var terminators = {}, token;
			stop_at = stop_at || [];
			for(var i = 0; i < stop_at.length; i++){
				terminators[stop_at[i]] = true;
			}

			var nodelist = new dd._NodeList();
			while(this.i < this.contents.length){
				token = this.contents[this.i++];
				if(typeof token == "string"){
					nodelist.push(new dd._TextNode(token));
				}else{
					var type = token[0];
					var text = token[1];
					if(type == dd.TOKEN_VAR){
						nodelist.push(new dd._VarNode(text));
					}else if(type == dd.TOKEN_BLOCK){
						if(terminators[text]){
							--this.i;
							return nodelist;
						}
						var cmd = text.split(/\s+/g);
						if(cmd.length){
							cmd = cmd[0];
							var fn = ddt.getTag(cmd);
							if(fn){
								nodelist.push(fn(this, new dd.Token(type, text)));
							}
						}
					}
				}
			}

			if(stop_at.length){
				throw new Error("Could not find closing tag(s): " + stop_at.toString());
			}

			this.contents.length = 0;
			return nodelist;
		},
		next_token: function(){
			// summary: Returns the next token in the list.
			var token = this.contents[this.i++];
			return new dd.Token(token[0], token[1]);
		},
		delete_first_token: function(){
			this.i++;
		},
		skip_past: function(endtag){
			while(this.i < this.contents.length){
				var token = this.contents[this.i++];
				if(token[0] == dd.TOKEN_BLOCK && token[1] == endtag){
					return;
				}
			}
			throw new Error("Unclosed tag found when looking for " + endtag);
		},
		create_variable_node: function(expr){
			return new dd._VarNode(expr);
		},
		create_text_node: function(expr){
			return new dd._TextNode(expr || "");
		},
		getTemplate: function(file){
			return new dd.Template(file);
		}
	});

	dd.register = {
		_registry: {
			attributes: [],
			tags: [],
			filters: []
		},
		get: function(/*String*/ module, /*String*/ name){
			var registry = dd.register._registry[module + "s"];
			for(var i = 0, entry; entry = registry[i]; i++){
				if(typeof entry[0] == "string"){
					if(entry[0] == name){
						return entry;
					}
				}else if(name.match(entry[0])){
					return entry;
				}
			}
		},
		getAttributeTags: function(){
			var tags = [];
			var registry = dd.register._registry.attributes;
			for(var i = 0, entry; entry = registry[i]; i++){
				if(entry.length == 3){
					tags.push(entry);
				}else{
					var fn = dojo.getObject(entry[1]);
					if(fn && dojo.isFunction(fn)){
						entry.push(fn);
						tags.push(entry);
					}
				}
			}
			return tags;
		},
		_any: function(type, base, locations){
			for(var path in locations){
				for(var i = 0, fn; fn = locations[path][i]; i++){
					var key = fn;
					if(dojo.isArray(fn)){
						key = fn[0];
						fn = fn[1];
					}
					if(typeof key == "string"){
						if(key.substr(0, 5) == "attr:"){
							var attr = fn;
							if(attr.substr(0, 5) == "attr:"){
								attr = attr.slice(5);
							}
							dd.register._registry.attributes.push([attr.toLowerCase(), base + "." + path + "." + attr]);
						}
						key = key.toLowerCase()
					}
					dd.register._registry[type].push([
						key,
						fn,
						base + "." + path
					]);
				}
			}
		},
		tags: function(/*String*/ base, /*Object*/ locations){
			dd.register._any("tags", base, locations);
		},
		filters: function(/*String*/ base, /*Object*/ locations){
			dd.register._any("filters", base, locations);
		}
	}

	var escapeamp = /&/g;
	var escapelt = /</g;
	var escapegt = />/g;
	var escapeqt = /'/g;
	var escapedblqt = /"/g;
	dd._base.escape = function(value){
		// summary: Escapes a string's HTML
		return dd.mark_safe(value.replace(escapeamp, '&amp;').replace(escapelt, '&lt;').replace(escapegt, '&gt;').replace(escapedblqt, '&quot;').replace(escapeqt, '&#39;'));
	}

	dd._base.safe = function(value){
		if(typeof value == "string"){
			value = new String(value);
		}
		if(typeof value == "object"){
			value.safe = true;
		}
		return value;
	}
	dd.mark_safe = dd._base.safe;

	dd.register.tags("dojox.dtl.tag", {
		"date": ["now"],
		"logic": ["if", "for", "ifequal", "ifnotequal"],
		"loader": ["extends", "block", "include", "load", "ssi"],
		"misc": ["comment", "debug", "filter", "firstof", "spaceless", "templatetag", "widthratio", "with"],
		"loop": ["cycle", "ifchanged", "regroup"]
	});
	dd.register.filters("dojox.dtl.filter", {
		"dates": ["date", "time", "timesince", "timeuntil"],
		"htmlstrings": ["linebreaks", "linebreaksbr", "removetags", "striptags"],
		"integers": ["add", "get_digit"],
		"lists": ["dictsort", "dictsortreversed", "first", "join", "length", "length_is", "random", "slice", "unordered_list"],
		"logic": ["default", "default_if_none", "divisibleby", "yesno"],
		"misc": ["filesizeformat", "pluralize", "phone2numeric", "pprint"],
		"strings": ["addslashes", "capfirst", "center", "cut", "fix_ampersands", "floatformat", "iriencode", "linenumbers", "ljust", "lower", "make_list", "rjust", "slugify", "stringformat", "title", "truncatewords", "truncatewords_html", "upper", "urlencode", "urlize", "urlizetrunc", "wordcount", "wordwrap"]
	});
	dd.register.filters("dojox.dtl", {
		"_base": ["escape", "safe"]
	});
})();

}

if(!dojo._hasResource["dojox.dtl"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.dtl"] = true;
dojo.provide("dojox.dtl");


}

if(!dojo._hasResource["dojox.dtl.Context"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.dtl.Context"] = true;
dojo.provide("dojox.dtl.Context");


dojox.dtl.Context = dojo.extend(function(dict){
	this._this = {};
	dojox.dtl._Context.call(this, dict);
}, dojox.dtl._Context.prototype,
{
	getKeys: function(){
		var keys = [];
		for(var key in this){
			if(this.hasOwnProperty(key) && key != "_this"){
				keys.push(key);
			}
		}
		return keys;
	},
	extend: function(/*dojox.dtl.Context|Object*/ obj){
		// summary: Returns a clone of this context object, with the items from the
		//		passed objecct mixed in.
		return  dojo.delegate(this, obj);
	},
	filter: function(/*dojox.dtl.Context|Object|String...*/ filter){
		// summary: Returns a clone of this context, only containing the items
		//		defined in the filter.
		var context = new dojox.dtl.Context();
		var keys = [];
		var i, arg;
		if(filter instanceof dojox.dtl.Context){
			keys = filter.getKeys();
		}else if(typeof filter == "object"){
			for(var key in filter){
				keys.push(key);
			}
		}else{
			for(i = 0; arg = arguments[i]; i++){
				if(typeof arg == "string"){
					keys.push(arg);
				}
			}
		}

		for(i = 0, key; key = keys[i]; i++){
			context[key] = this[key];
		}

		return context;
	},
	setThis: function(/*Object*/ _this){
		this._this = _this;
	},
	getThis: function(){
		return this._this;
	},
	hasKey: function(key){
		if(this._getter){
			var got = this._getter(key);
			if(typeof got != "undefined"){
				return true;
			}
		}

		if(typeof this[key] != "undefined"){
			return true;
		}

		return false;
	}
});

}

if(!dojo._hasResource["depot.OrderHistoryController"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["depot.OrderHistoryController"] = true;
dojo.provide("depot.OrderHistoryController");







dojo.declare("depot.OrderHistoryController",null,
{
	format:null,
	orderStore:null,
	template:null,
	constructor:function()
	{
		this.format = {
				id:"orderId",
				items:[]
		};
		
		this.orderStore = new dojo.data.ItemFileReadStore({data:this.format,clearOnClose:true});
		dojo.connect(dijit.byId("orderHistory"),"onLoad",this,this.getOrders);
		dojo.subscribe("orderHistory-select",this,this.getOrders);
	},
	getOrders:function()
	{
		console.debug("Getting Orders");
		var getOrdersXhr = {
				url: "/CustomerOrderServicesWeb/jaxrs/Customer/Orders",
				handleAs: "json",
				load: dojo.hitch(this,this.loadOrdersSuccess),
				error:dojo.hitch(this,this.loadOrdersError)
			};
		return dojo.xhrGet(getOrdersXhr);
	},
	loadOrdersSuccess:function(data)
	{
		console.debug("Order History",data);
		this.format.items = data;
		this.orderStore.data = this.format;
		this.orderStore.close();
		console.debug(dijit.byId("orderHistoryGrid"));
		dijit.byId("orderHistoryGrid").setStore(this.orderStore);
		
	},
	loadOrdersError:function(error)
	{
		console.error(error);
	},
	formatStatus:function(status)
	{
		console.debug("format status",status);
		return (status && status=="OPEN")?"Current Order":status;
	},
	getLineItems:function(i,item)
	{
		console.debug("getLineItem,",item);
		
		var li = [];
		if(item)
		{
			dojo.forEach(item.lineitems,function(litem,i)
			{
				console.debug(litem,i);
				li[i] = litem;
			});
		}
		console.debug("li",li);
		return li;
	},
	formatLineItems:function(lineItem)
	{
		console.debug("format",lineItem);
		if(lineItem)
		{
			if(!this.template)
			{
				this.template = new dojox.dtl.Template(dojo.moduleUrl("orderHistory","orderHistoryTemplate.html"));
			}
			var context = new dojox.dtl.Context({lis:lineItem});
			var result = this.template.render(context);
			return result;
		}
	}
	
});

}

if(!dojo._hasResource["dojox.dtl.tag.logic"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.dtl.tag.logic"] = true;
dojo.provide("dojox.dtl.tag.logic");



(function(){
	var dd = dojox.dtl;
	var ddt = dd.text;
	var ddtl = dd.tag.logic;

	ddtl.IfNode = dojo.extend(function(bools, trues, falses, type){
		this.bools = bools;
		this.trues = trues;
		this.falses = falses;
		this.type = type;
	},
	{
		render: function(context, buffer){
			var i, bool, ifnot, filter, value;
			if(this.type == "or"){
				for(i = 0; bool = this.bools[i]; i++){
					ifnot = bool[0];
					filter = bool[1];
					value = filter.resolve(context);
					if((value && !ifnot) || (ifnot && !value)){
						if(this.falses){
							buffer = this.falses.unrender(context, buffer);
						}
						return (this.trues) ? this.trues.render(context, buffer, this) : buffer;
					}
				}
				if(this.trues){
					buffer = this.trues.unrender(context, buffer);
				}
				return (this.falses) ? this.falses.render(context, buffer, this) : buffer;
			}else{
				for(i = 0; bool = this.bools[i]; i++){
					ifnot = bool[0];
					filter = bool[1];
					value = filter.resolve(context);
					// If we ever encounter a false value
					if(value == ifnot){
						if(this.trues){
							buffer = this.trues.unrender(context, buffer);
						}
						return (this.falses) ? this.falses.render(context, buffer, this) : buffer;
					}
				}
				if(this.falses){
					buffer = this.falses.unrender(context, buffer);
				}
				return (this.trues) ? this.trues.render(context, buffer, this) : buffer;
			}
			return buffer;
		},
		unrender: function(context, buffer){
			buffer = (this.trues) ? this.trues.unrender(context, buffer) : buffer;
			buffer = (this.falses) ? this.falses.unrender(context, buffer) : buffer;
			return buffer;
		},
		clone: function(buffer){
			var trues = (this.trues) ? this.trues.clone(buffer) : null;
			var falses = (this.falses) ? this.falses.clone(buffer) : null;
			return new this.constructor(this.bools, trues, falses, this.type);
		}
	});

	ddtl.IfEqualNode = dojo.extend(function(var1, var2, trues, falses, negate){
		this.var1 = new dd._Filter(var1);
		this.var2 = new dd._Filter(var2);
		this.trues = trues;
		this.falses = falses;
		this.negate = negate;
	},
	{
		render: function(context, buffer){
			var var1 = this.var1.resolve(context);
			var var2 = this.var2.resolve(context);
			var1 = (typeof var1 != "undefined") ? var1 : "";
			var2 = (typeof var1 != "undefined") ? var2 : "";
			if((this.negate && var1 != var2) || (!this.negate && var1 == var2)){
				if(this.falses){
					buffer = this.falses.unrender(context, buffer, this);
				}
				return (this.trues) ? this.trues.render(context, buffer, this) : buffer;
			}
			if(this.trues){
				buffer = this.trues.unrender(context, buffer, this);
			}
			return (this.falses) ? this.falses.render(context, buffer, this) : buffer;
		},
		unrender: function(context, buffer){
			return ddtl.IfNode.prototype.unrender.call(this, context, buffer);
		},
		clone: function(buffer){
			var trues = this.trues ? this.trues.clone(buffer) : null;
			var falses = this.falses ? this.falses.clone(buffer) : null;
			return new this.constructor(this.var1.getExpression(), this.var2.getExpression(), trues, falses, this.negate);
		}
	});

	ddtl.ForNode = dojo.extend(function(assign, loop, reversed, nodelist){
		this.assign = assign;
		this.loop = new dd._Filter(loop);
		this.reversed = reversed;
		this.nodelist = nodelist;
		this.pool = [];
	},
	{
		render: function(context, buffer){
			var i, j, k;
			var dirty = false;
			var assign = this.assign;

			for(k = 0; k < assign.length; k++){
				if(typeof context[assign[k]] != "undefined"){
					dirty = true;
					context = context.push();
					break;
				}
			}
			if(!dirty && context.forloop){
				dirty = true;
				context = context.push();
			}

			var items = this.loop.resolve(context) || [];
			for(i = items.length; i < this.pool.length; i++){
				this.pool[i].unrender(context, buffer, this);
			}
			if(this.reversed){
				items = items.slice(0).reverse();
			}

			var isObject = dojo.isObject(items) && !dojo.isArrayLike(items);
			var arred = [];
			if(isObject){
				for(var key in items){
					arred.push(items[key]);
				}
			}else{
				arred = items;
			}

			var forloop = context.forloop = {
				parentloop: context.get("forloop", {})
			};
			var j = 0;
			for(i = 0; i < arred.length; i++){
				var item = arred[i];

				forloop.counter0 = j;
				forloop.counter = j + 1;
				forloop.revcounter0 = arred.length - j - 1;
				forloop.revcounter = arred.length - j;
				forloop.first = !j;
				forloop.last = (j == arred.length - 1);

				if(assign.length > 1 && dojo.isArrayLike(item)){
					if(!dirty){
						dirty = true;
						context = context.push();
					}
					var zipped = {};
					for(k = 0; k < item.length && k < assign.length; k++){
						zipped[assign[k]] = item[k];
					}
					dojo.mixin(context, zipped);
				}else{
					context[assign[0]] = item;
				}

				if(j + 1 > this.pool.length){
					this.pool.push(this.nodelist.clone(buffer));
				}
				buffer = this.pool[j++].render(context, buffer, this);
			}

			delete context.forloop;
			if(dirty){
				context = context.pop();
			}else{
				for(k = 0; k < assign.length; k++){
					delete context[assign[k]];
				}
			}
			return buffer;
		},
		unrender: function(context, buffer){
			for(var i = 0, pool; pool = this.pool[i]; i++){
				buffer = pool.unrender(context, buffer);
			}
			return buffer;
		},
		clone: function(buffer){
			return new this.constructor(this.assign, this.loop.getExpression(), this.reversed, this.nodelist.clone(buffer));
		}
	});

	dojo.mixin(ddtl, {
		if_: function(parser, token){
			var i, part, type, bools = [], parts = token.contents.split();
			parts.shift();
			token = parts.join(" ");
			parts = token.split(" and ");
			if(parts.length == 1){
				type = "or";
				parts = token.split(" or ");
			}else{
				type = "and";
				for(i = 0; i < parts.length; i++){
					if(parts[i].indexOf(" or ") != -1){
						// Note, since we split by and, this is the only place we need to error check
						throw new Error("'if' tags can't mix 'and' and 'or'");
					}
				}
			}
			for(i = 0; part = parts[i]; i++){
				var not = false;
				if(part.indexOf("not ") == 0){
					part = part.slice(4);
					not = true;
				}
				bools.push([not, new dd._Filter(part)]);
			}
			var trues = parser.parse(["else", "endif"]);
			var falses = false;
			var token = parser.next_token();
			if(token.contents == "else"){
				falses = parser.parse(["endif"]);
				parser.next_token();
			}
			return new ddtl.IfNode(bools, trues, falses, type);
		},
		_ifequal: function(parser, token, negate){
			var parts = token.split_contents();
			if(parts.length != 3){
				throw new Error(parts[0] + " takes two arguments");
			}
			var end = 'end' + parts[0];
			var trues = parser.parse(["else", end]);
			var falses = false;
			var token = parser.next_token();
			if(token.contents == "else"){
				falses = parser.parse([end]);
				parser.next_token();
			}
			return new ddtl.IfEqualNode(parts[1], parts[2], trues, falses, negate);
		},
		ifequal: function(parser, token){
			return ddtl._ifequal(parser, token);
		},
		ifnotequal: function(parser, token){
			return ddtl._ifequal(parser, token, true);
		},
		for_: function(parser, token){
			var parts = token.contents.split();
			if(parts.length < 4){
				throw new Error("'for' statements should have at least four words: " + token.contents);
			}
			var reversed = parts[parts.length - 1] == "reversed";
			var index = (reversed) ? -3 : -2;
			if(parts[parts.length + index] != "in"){
				throw new Error("'for' tag received an invalid argument: " + token.contents);
			}
			var loopvars = parts.slice(1, index).join(" ").split(/ *, */);
			for(var i = 0; i < loopvars.length; i++){
				if(!loopvars[i] || loopvars[i].indexOf(" ") != -1){
					throw new Error("'for' tag received an invalid argument: " + token.contents);
				}
			}
			var nodelist = parser.parse(["endfor"]);
			parser.next_token();
			return new ddtl.ForNode(loopvars, parts[parts.length + index + 1], reversed, nodelist);
		}
	});
})();

}

