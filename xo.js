;(function($){
	$("<style type='text/css'> [xo-schematic]{display:none !important;} </style>").appendTo("head");

	var _ = _ || {
		map : function(obj, fn){
			var result = [];
			for(var propName in obj){
				if(obj.hasOwnProperty(propName)){ result.push(fn(obj[propName], propName)); }
			}
			return result;
		},
		reduce : function(obj, fn, memo){
			for(var propName in obj){
				if(obj.hasOwnProperty(propName)){ memo = fn(memo, obj[propName], propName); }
			}
			return memo;
		},
	};

	//Remove due to switching to a bulk ajax call
	var async_map = function(list, fnName, callback){
		var result=[],
			len = list.length;
		list = list.slice(0);
		for(var i in list){
			var obj = list[i];
			obj[fnName](function(err, data){
				if(err) return callback(err);
				result.push(data);
				if(result.length === len) callback(undefined, result);
			});
		};
	};

	//TODO: add a url parameter
	var xo_ajax = function(type, callback){
		var self = this;
		callback = callback || function(){};

		this.trigger('before:' + type, this);
		//if(this.models) this.each(function(model){model.trigger('before:' + type)})
		if(!this.URL){
			this.trigger(type, this);
			return callback();
		}
		//add these as parameters
		var http = {
			'fetch ' : 'GET',
			'save'   : (this.id ? 'PUT' : 'POST'),
			'delete' : 'DELETE'
		};
		$.ajax({
			url  : this.URL + (this.id ? "/" + this.id : ""),
			type : http[type],
			data : self.attributes(), //maybe make toJSON()?
			//dataType : 'json',
			success : function(data){
				self.set(data);
				callback(undefined, data);
				self.trigger(type, self);
				//if(self.models) self.each(function(model){model.trigger(type)})
			},
			error : function(err){
				callback(err);
				self.trigger('error', self);
			},
		});
	};

	xo = {};

	xo.view = Archetype.extend({
		view      : undefined,
		schematic : undefined,

		initialize : function(model){
			this.model = model;
			this.dom = {};
			if(this.view){
				this.on('created', function(){ //switch to once?
					$(document).ready(this.injectInto.bind(this));
				}.bind(this));
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
			}else{
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

			//add on delete triggers, like calling this.off
			return this;
		},
		set : function(key, value, aggregateChange){
			if(typeof key === 'object'){
				for(var k in key){
					this.set(k, key[k], true);
				}
				this.trigger('change');
				return this;
			}
			if(this[key] !== value){
				this[key] = value;
				this.trigger('change:' + key, value);
				if(!aggregateChange) this.trigger('change');
			}
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
			return _.reduce(this, function(result, v,k){
				if(k !== 'URL' && typeof v !=='function'){ result[k] = v; }
				return result;
			}, {});
		},
		toJSON : function(){ return JSON.stringify(this.attributes(), null, 2);},

		//ajax methods
		save : function(callback){
			xo_ajax.call(this, 'save', callback);
			return this;
		},
		fetch : function(callback){
			xo_ajax.call(this, 'fetch', callback);
			return this;
		},
		delete : function(callback){
			xo_ajax.call(this, 'delete', callback);
			return this;
		},
	}),


	/*
		COLLECTION
	 */
	xo.collection = Archetype.extend({
		URL    : undefined,
		model  : undefined,
		models : [],

		initialize : function(objs){
			this.set(objs);
			if(this.model) this.URL = this.model.URL;
			return this;
		},
		set : function(objs){
			this.models = [];
			for(var i in objs){
				this.add(objs[i]);
			}
			return this;
		},
		get : function(id){
			return _.reduce(this.models, function(result, model){
				if(model.id === id) result = model;
				return result;
			});
		},
		add : function(obj){
			var findModel = this.get(obj.id);
			if(findModel) return findModel.set(obj);

			var new_obj = this.model.create(obj); //check if the obj is already the model type
			var self = this;
			new_obj.on('delete', function(obj){
				for(var i in self.models){
					if(this.id === self.models[i].id) self.models.splice(i,1);
				}
			});
			this.models.push(new_obj);
			this.trigger('add', new_obj);
			return new_obj;
		},
		each : function(fn){
			return _.map(this.models, fn);
		},
		toJSON : function(){
			return JSON.stringify(_.map(this.models, function(model){
				return model.attributes();
			}), null, 2);
		},

		//Ajax methods
		//TODO: These should do bulk op calls to the server, not individual calls
		fetch : function(callback){
			xo_ajax.call(this, 'fetch', callback);
			return this;
		},
		delete : function(callback){
			async_map(this.models, 'delete', callback);
			return this;
		},
		save : function(callback){
			async_map(this.models, 'save', callback);
			return this;
		},

		/*
		save : function(callback){
			var self = this;
			callback = callback || function(){};
			this.each(function(model){ model.trigger('before:save')});
			xo_ajax.call(this, this.URL || this.model.URL, 'save', 'PUT', function(){
				callback()
				self.each(function(model){ model.trigger('save')});
			});
			return this;
		},
		*/
	});

})(jQuery);





