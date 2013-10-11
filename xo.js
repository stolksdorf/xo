;(function(){
	jQuery("<style type='text/css'> [xo-schematic]{display:none !important;} </style>").appendTo("head");

	var xo_ajax = function(args){
		var self = this;
		if(!args.url) throw 'XO : Url not set';
		var callback = args.callback || function(){};
		var success  = args.success  || function(){};
		var http = {
			'fetch ' : 'GET',
			'save'   : (self.id ? 'PUT' : 'POST'),
			'delete' : 'DELETE'
		};
		self.trigger('before:'+args.type, self);
		jQuery.ajax({
			url  : args.url + (self.id ? "/" + self.id : ""),
			type : http[args.type],
			data : args.data,
			success : function(data){
				success.call(self, data);
				callback(undefined, self);
				self.trigger(args.type, self);
			},
			error : function(err){
				callback(err);
				self.trigger('error');
				self.trigger('error:' + args.type, err);
			},
		});
	};

	xo = {
		view : Archetype.extend({
			view      : undefined,
			schematic : undefined,

			initialize : function(model)
			{
				this.model = model;
				this.dom = {};
				if(this.view) this.bindToView();
				return this;
			},

			bindToView : function()
			{
				var self = this;
				this.dom.block = jQuery('[xo-view="' + this.view + '"]');
				if(this.dom.block.length === 0 ){throw 'XO: Could not find view with name ' + this.view;}
				this.dom.block.find('[xo-element]').each(function(index, element){
					self.dom[jQuery(element).attr('xo-element')] = jQuery(element);
				});
				this.render();
				return this;
			},
			injectInto : function(target, options)
			{
				var self = this;
				options = options || {};
				if(target.length === 0 ){throw 'XO: Could not find target';}
				if(!this.schematic){throw 'XO: Schematic name not set' ;}

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
			urlRoot : undefined,

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
					if(	k === '__events__' ||
						k === 'urlRoot' ||
						typeof v ==='function'){ return result;}
					result[k] = v;
					return result;
				}, {});
			},
			save : function(callback)
			{
				xo_ajax.call(this,{
					url  : this.urlRoot,
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
					url  : this.urlRoot,
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
					url  : this.urlRoot,
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
				var col = _.extend([], this, props);
				col.initialize();
				return col;
			},
			create : function(arr)
			{
				arr = arr || [];
				var col = _.extend(arr, this)
				col.initialize();
				return col;
			},
			add : function(obj)
			{
				var newObj = this.model.create();
				newObj.set(obj);
				this.push(newObj);
				this.trigger('add', newObj);
				return newObj;
			},
			clear : function()
			{
				self.length = 0;
				return this;
			},
			fetch : function(callback)
			{
				xo_ajax.call(this,{
					url  : this.model.urlRoot,
					type : 'fetch',
					callback : callback,
					success : function(data){
						var self = this;
						this.clear();
						_.map(data, function(data){
							self.add(data).trigger('fetch');
						});
					}
				});
				return this;
			},
			delete : function(callback)
			{
				xo_ajax.call(this,{
					url  : this.model.urlRoot,
					type : 'delete',
					callback : callback,
					success : function(data){
						this.clear();
					}
				});
				return this;
			},
			save : function(callback)
			{
				var self = this,
					count = this.length;
				this.trigger('before:save', this);
				this.clear();
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
				return this;
			},
		})
	};

})();





