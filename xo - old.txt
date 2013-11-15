;(function(){

	//Add in underscore shim (extend, reduce, map)


	jQuery("<style type='text/css'> [xo-schematic]{display:none !important;} </style>").appendTo("head");

	var xo_ajax = function(args){ //switch to type, callback, success
		var self = this;
		var callback = args.callback || function(){};
		var success  = args.success  || function(){};
		var http = {
			'fetch ' : 'GET',
			'save'   : (self.id ? 'PUT' : 'POST'),
			'delete' : 'DELETE'
		};

		args.url = this.urlRoot;
		if(this.model) args.url = this.model.urlRoot;
		if(!args.url) throw 'XO : Url not set';

		self.trigger('before:'+args.type, self);
		jQuery.ajax({
			url  : args.url + (self.id ? "/" + self.id : ""),
			type : http[args.type],
			data : args.data, //switch to self.attributes(); removes need of 'data'
			success : function(data){
				success.call(self, data);
				callback(undefined, self);
				self.trigger(args.type, self);
			},
			error : function(err){
				callback(err);
				self.trigger('error:'+args.type, err);
				self.trigger('error', err);
			},
		});
	};

	var async_map = function(list, fnName, callback){
		var result = [];
		callback = callback || function(){};
		if(list.length === 0) return callback();
		_.map(list, function(obj){
			obj[fnName](function(err, data){
				if(err) return callback(err);
				result.push(data);
				if(result.length === list.length){
					callback(undefined, result);
				}
			})
		});
	};

	xo = {
		view : Archetype.extend({
			view      : undefined,
			schematic : undefined,

			initialize : function(model)
			{
				var self = this;
				this.model = model;
				this.dom = {};
				this.on('created', function(){
					if(self.view) jQuery(document).ready(self.bindToView.bind(self));
				});
				return this;
			},

			bindToView : function()
			{
				var self = this;
				this.dom.block = jQuery('[xo-view="' + this.view + '"]'); //convert these to local call
				if(this.dom.block.length === 0 ){throw 'XO: Could not find view with name ' + this.view;}
				this.dom.block.find('[xo-element]').each(function(index, element){
					self.dom[jQuery(element).attr('xo-element')] = jQuery(element);
				});
				this.render();
				this.trigger('render');
				return this;
			},
			injectInto : function(target, options)
			{
				var self = this;
				options = options || {};
				if(target.length === 0 ){throw 'XO: Could not find target';}
				if(!this.schematic){throw 'XO: Schematic name not set' ;}

				//make a fullclone local function
				var getSchematic = function(schematicName){
					var schematicElement = jQuery('[xo-schematic="' + schematicName + '"]');
					if(schematicElement.length === 0 ){throw 'XO: Could not find schematic with name "' + schematicName + '"';}
					var schematicCode = jQuery('<div>').append(schematicElement.clone().removeAttr('xo-schematic')).html();
					return jQuery(schematicCode);
				};

				if(options.at_top){
					this.dom.block = getSchematic(this.schematic).prependTo(target);
				} else {
					this.dom.block = getSchematic(this.schematic).appendTo(target);
				}
				this.dom.block.find('[xo-element]').each(function(index, element){
					self.dom[jQuery(element).attr('xo-element')] = jQuery(element);
				});
				this.render();
				this.trigger('render');
				return this;
			},
			render : function()
			{
				return this;
			},
			remove : function()
			{
				this.trigger('remove', this);
				if(this.dom.block) this.dom.block.remove();
				this.off();
				return this;
			},

		}),

		model : Archetype.extend({
			urlRoot : undefined, //switch to all caps?

			initialize : function(obj)
			{
				this.set(obj);
				return this;
			},
			set : function(key, value)
			{
				if(typeof key === 'object' && typeof value === 'undefined'){
					var self = this;
					_.map(key, function(v, k){
						self.set(k,v);
					});
					this.trigger('change');
					return this;
				}
				if(this[key] !== value){
					this[key] = value;
					this.trigger('change:' + key, value);
				}
				return this;
			},
			onChange : function(attrName, event)
			{
				var self = this;
				if(typeof attrName === 'object' && typeof event === 'undefined'){
					_.map(attrName, function(v, k){
						self.onChange(k,v);
					});
					return this;
				}
				this.on('change:' + attrName, function(){
					event(self[attrName]);
				});
				event(this[attrName]);
				return this;
			},
			attributes : function()
			{
				var self = this;
				return _.reduce(this, function(result, v,k){
					if(	k === '__events__' || //shouldn't need to filter on these anymore
						k === 'urlRoot' ||
						typeof v ==='function'){ return result;}
					result[k] = v;
					return result;
				}, {});
			},
			toJSON : function(){
				return JSON.stringify(this.attributes(), null, 4);
			},
			save : function(callback)
			{
				xo_ajax.call(this,{
					//url  : this.urlRoot,
					type : 'save',
					data : this.attributes(),
					callback : callback,
					success : function(data){
						this.set(data);
					}
				});
				return this;
			},
			fetch : function(callback)
			{
				xo_ajax.call(this,{
					//url  : this.urlRoot,
					type : 'fetch',
					callback : callback,
					success : function(data){
						this.set(data);
					}
				});
				return this;
			},
			delete : function(callback)
			{
				xo_ajax.call(this,{
					//url  : this.urlRoot,
					type : 'delete',
					callback : callback
				});
				return this;
			},
		}),


		collection : Archetype.extend({
			model : undefined,

			extend : function(props)
			{
				var col = _.extend([], this, props); //create a multi parameter extend shim
				//if(col.model){ col.urlRoot = col.model.urlRoot; }
				//col.initialize();
				return col;
			},
			create : function(arr)
			{
				arr = arr || [];
				var col = _.extend(arr, this);
				//if(col.model){ col.urlRoot = col.model.urlRoot; }
				col.initialize(); //deep call
				return col;
			},

			toJSON : function(){
				return JSON.stringify(_.map(this, function(model){
					return model.attributes();
				}), null, 4);
			},

			set  : function(arr){
				var self = this;
				this.clear();
				_.map(arr, function(ele){
					self.add(ele);
				});
				return this;
			},

			add : function(obj)
			{
				//add listeners of model changes
				var newObj = this.model.create(); //move to single line
				newObj.set(obj);
				this.push(newObj);
				this.trigger('add', newObj);
				return newObj;
			},
			clear : function()
			{
				this.length = 0; //trigger delete on all models
				return this;
			},
			fetch : function(callback)
			{
				var self = this;
				xo_ajax.call(this,{
					//url  : this.model.urlRoot,
					type : 'fetch',
					callback : callback,
					success : function(data){
						self.set(data);
					}
				});
				return this;
			},
			delete : function(callback)
			{
				var self = this;
				callback = callback || function(){};
				async_map(this, 'delete', function(err, data){
					if(err) return callback(err);
					self.clear();
					callback(undefined, self);
				});


				/*
				var self = this;
				xo_ajax.call(this,{
					url  : this.model.urlRoot,
					type : 'delete',
					callback : callback,
					success : function(data){
						self.clear();
					}
				}); */

				return this;
			},
			save : function(callback)
			{
				var self = this;
				callback = callback || function(){};
				async_map(this, 'save', function(err, data){
					if(err) return callback(err);
					//self.set(data);
					callback(undefined, self);
				});
/*

				var self = this,
					count = this.length;
				this.trigger('before:save', this);

				_.map(this, function(model){
					model.save(function(err, data){
						count--;
						self.add(data).trigger('save');
						if(typeof callback === 'function'){
							if(count === 0){
								self.trigger('save', self);
								callback(undefined, self);
							}
							if(err){
								self.trigger('error:save', self);
								callback(err);
							}
						}
					});
				});
				this.clear();
				*/
				return this;
			},
		})
	};

})();





