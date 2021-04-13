;(function($){
	//Switch to script types?
	$("<style type='text/css'> [xo-schematic]{display:none !important;} </style>").appendTo("head");

	var map = function(obj, fn){
		var result = [];
		for(var key in obj){
			if(obj.hasOwnProperty(key)){ result.push(fn(obj[key], key)); }
		}
		return result;
	};
	var reduce = function(obj, fn, memo){
		for(var key in obj){
			if(obj.hasOwnProperty(key)){ memo = fn(memo, obj[key], key); }
		}
		return memo;
	};

	//Better ajax call, no jQuery needed
	var xo_ajax = function(self, method, callback, data){
		callback = callback || function(){};

		var typeMap = {
			'fetch'  : 'GET',
			'save'   : self.id ? 'PUT' : 'POST',
			'delete' : 'DELETE'
		};
		var done = function(res){
			self.set(res);
			self.trigger(method, self);
			return callback(undefined, res);
		}

		self.trigger('before:'+method, self);
		if(!self.URL) return done(data);

		var url = self.URL + (self.id ? "/" + self.id : "")
		var req = new XMLHttpRequest();
		req.open(typeMap[method], url, true);
		req.onreadystatechange = function(){
			if(req.readyState != 4) return;
			if(req.status != 200){
				self.trigger('error', self, req.responseText);
				return callback(req.responseText);
			}
			done(req.responseText);
		};
		req.send(data);
	}

	/*


var objset = function(obj, path, val){
	var parts = path.split('.'), result = obj;
	for(var i=0; i < parts.length; i++){
		result = result[parts[i]] = result[parts[i]] || ((i == parts.length-1) ? val : {});
	}
}

var objget = function(obj, path){
	var parts = path.split('.'), result = obj;
	for(var i=0; i < parts.length; i++){
		if(typeof result[parts[i]] === 'undefined') return;
		result = result[parts[i]];
	}
	return result;
}

var self = this;
_.each(this.dom.view[0].querySelectorAll('[data-element]'), function(element){
	var name = element.getAttribute('data-element');
	objset(self.dom, name, $(element));
});
this.dom.$items = this.dom.view.find('[data-element^="items."]');
this.dom.$subItems = this.dom.view.find('[data-element^="subItems."]');


	 */






	xo = {};

	xo.view = Archetype.extend({
		view      : undefined,
		schematic : undefined,

		initialize : function(model){
			this.model = model;
			this.dom = {};
			if(this.view){
				//POssibly remove
				this.once('created', function(){
					$(document).ready(this.injectInto.bind(this));
				});
			}
			return this;
		},
		injectInto : function(target, prepend){
			var self = this;
			if(this.schematic){
				var schematicElement = $('[xo-schematic="' + this.schematic + '"]');
				if(target.length === 0){throw 'xo-view: Could not find target';}
				if(schematicElement.length === 0 ){throw 'xo-view: Could not find schematic with name "' + this.schematic + '"';}

				var schematicClone = $($('<div>').append(schematicElement.clone().removeAttr('xo-schematic')).html());
				if(prepend){
					this.dom.view = schematicClone.prependTo(target);
				} else {
					this.dom.view = schematicClone.appendTo(target);
				}
			}
			if(this.view){
				this.dom.view = $('[xo-view="' + this.view + '"]');
				if(this.dom.view.length === 0 ){throw 'xo-view: Could not find view with name ' + this.view;}
			}
			this.dom.view.find('[xo-element]').each(function(index, element){
				self.dom[$(element).attr('xo-element')] = $(element);
			});
			this.render();
			this.trigger('render');
			return this;
		},
		remove : function(){
			this.trigger('remove');
			if(this.dom.view) this.dom.view.remove();
			this.off();
			return this;
		},
		render : function(){
			return this;
		},
		show : function(hide){
			if(hide===false) return this.hide();
			if(this.dom.view) this.dom.view.show();
			return this;
		},
		hide : function(){
			if(this.dom.view) this.dom.view.hide();
			return this;
		},
	});

	/*
		MODEL
	 */
	xo.model = Archetype.extend({
		url : function(){},

		initialize : function(obj){
			this.set(obj);
			this.on('delete', this.off);
			return this;
		},
		set : function(key, value){
			var changes = {};
			changes[key] = value;
			var hasChanges = false;
			if(typeof key === 'object') changes = key;

			for(var key in changes){
				var val = changes[key];
				if(this[key] !== val){
					this[key] = val;
					hasChanges = true;
					this.trigger('change:' + key, val);
				}
			}
			if(hasChanges) this.trigger('change');
			return this;
		},
		onChange : function(attrName, evt){
			if(typeof attrName === 'object'){
				for(var k in attrName){
					this.onChange(k, attrName[k]);
				}
				return this;
			}
			this.on('change:' + attrName, evt);
			evt(this[attrName]);
			return this;
		},
		attributes : function(){
			return JSON.encode(this);
		},

		//ajax methods
		save : function(callback){ //TODO: add ability to pass data to save
			xo_ajax(this, this.url(), 'save', (this.id ? 'PUT' : 'POST'), callback);
			return this;
		},
		fetch : function(callback){
			xo_ajax(this, this.url(), 'fetch', 'GET', callback);
			return this;
		},
		delete : function(callback){
			xo_ajax(this, this.url(), 'delete', 'DELETE', callback);
			return this;
		},
	}),


	/*
		COLLECTION
	 */
	xo.collection = Archetype.extend({
		url : function(){},
		model  : xo.model,
		models : [],

		initialize : function(objs){
			this.set(objs);
			//if(this.model) this.URL = this.model.URL;
			if(!this.model) this.model = xo.model; //Setup for using a basic model

			//Make sure this works
			this.URL       = this.model.URL || this.URL;
			this.model.URL = this.model.URL || this.URL;

			return this;
		},
		set : function(objs){
			this.models = [];
			for(var i in objs){
				this.add(objs[i])
			}
			return this;
		},
		get : function(id){
			return reduce(this.models, function(result, model){
				if(model.id === id) result = model;
				return result;
			});
		},
		remove : function(arg){
			id = arg.id || arg; //handles models and raw ids
			for(var i in this.models){
				if(id == this.models[i].id){
					this.trigger('remove', this.models[i]);
					this.models.splice(i,1);
				}
			}
			return this;
		},
		add : function(obj){
			//remove this
			var findModel = this.get(obj.id);
			if(findModel) return findModel.set(obj); //Update if already exists

			if(!this.model.isPrototypeOf(obj)) obj = this.model.create(obj);
			obj.on('delete', function(obj){
				this.remove(obj);
			}.bind(this));

			this.models.push(obj);
			this.trigger('add', obj);
			return obj;
		},
		//remove
		each : function(fn){
			return map(this.models, fn);
		},
		//remove
		attributes : function(){
			return map(this.models, function(model){
				return model.attributes();
			});
		},

		//Ajax methods
		fetch : function(callback){
			//this.URL should be fine
			xo_ajax(this, this.URL || this.model.URL, 'fetch', 'GET', callback);
			//xo_ajax(this, 'fetch', callback)
			return this;
		},
		delete : function(callback){
			//delete call on each model
			xo_ajax(this, this.URL || this.model.URL, 'delete', 'DELETE', callback);
			return this;
		},
		save : function(callback){
			//save call on each model
			xo_ajax(this, this.URL || this.model.URL, 'save', 'PUT', callback);

			/*
			var count = this.models.length, self = this;
			self.trigger('before:save');
			map(this.models,function(model){
				model.save(function(){
					if(--count === 0){
						self.trigger('save');
						callback && callback();
					}
				});
			});
	*/

			return this;
		},
	});

	xo.router = Archetype.extend({
		routes : {},
		initialize : function(routes){
			map(routes, function(fn, path){this.add(path,fn)}.bind(this));
			window.addEventListener('hashchange', this.route);
			window.addEventListener('load', this.route);
			return this;
		},
		navigate : function(path){
			window.location.hash = path;
			return this;
		},
		add : function(path, fn){
			path = path.replace('*', '(.*?)').replace(/(\(\?)?:\w+/g, '([^\/]+)') + "$";
			this.routes[path] = fn;
			return this;
		},
		route : function(){
			var url = location.hash.slice(1) || '';
			for(var path in this.routes){
				var args = (new RegExp(path)).exec(url);
				if(args) this.routes[path].apply(this, args.slice(1));
			}
		},
	});



})(jQuery);





