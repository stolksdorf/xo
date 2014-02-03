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


	var xo_ajax = function(self, url, method, type, callback){
		callback = callback || function(){};

		//Fire triggers
		map(self.models, function(model){model.trigger('before:' + method, self)});
		self.trigger('before:'+method, self);

		//TODO: Figure out what to do with NO URLS
		if(!url){
			self.trigger(method, self);
			map(self.models, function(model){model.trigger(method, self)});
			return callback();
		}

		$.ajax({
			url  : url + (self.id ? "/" + self.id : ""),
			type : type,
			data : self.attributes(),
			success : function(data){
				self.set(data);
				map(self.models, function(model){model.trigger(method, self)});
				self.trigger(method, self);
				return callback(undefined, data);
			},
			error : function(err){
				self.trigger('error', self, err);
				return callback(err);
			},
		});
	};


	/*

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
		var r = new XMLHttpRequest();
		r.open(typeMap[method], url, true);
		r.onreadystatechange = function(){
			if(r.readyState != 4) return;
			if(r.status != 200){
				self.trigger('error', self, r.responseText);
				return callback(r.responseText);
			}
			done(r.responseText);
		};
		r.send(data);
	}
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
		URL : undefined,

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
			//TODO: JSON encode obj? then delete url
			return reduce(this, function(result, v,k){
				if(k !== 'URL' && typeof v !=='function'){ result[k] = v; }
				return result;
			}, {});
		},

		//ajax methods
		save : function(callback){ //add ability to pass data to save
			xo_ajax(this, this.URL, 'save', (this.id ? 'PUT' : 'POST'), callback);
			return this;
		},
		fetch : function(callback){
			xo_ajax(this, this.URL, 'fetch', 'GET', callback);
			return this;
		},
		delete : function(callback){
			xo_ajax(this, this.URL, 'delete', 'DELETE', callback);
			return this;
		},
	}),


	/*
		COLLECTION
	 */
	xo.collection = Archetype.extend({
		URL    : undefined,
		model  : undefined, //xo.model
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





