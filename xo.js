(function(){

	jQuery("<style type='text/css'> [xo-schematic]{display:none !important;} </style>").appendTo("head");

	XO = {};

	XO.Block = Backbone.View.extend({
		dom       : {},
		block     : '',
		schematic : '',

		initialize : function(model)
		{
			if(model instanceof Backbone.Model){
				this.model = model;
			}
			if(this.block !== ''){
				this.dom.block = jQuery('[xo-block="' + this.block + '"]');
				this.getElements();
				this.render();
			}
			return this;
		},

		injectInto : function(injectionPoint)
		{
			if(injectionPoint.length === 0 ){throw 'XO: Could not find the injection point';}
			if(this.schematic === ''){throw 'XO: Schematic name not set' ;}
			this.trigger('before:inject', this);
			this.dom.block = this.getSchematic(this.schematic).appendTo(injectionPoint);
			this.getElements().render();
			this.trigger('inject', this);
			return this;
		},

		getSchematic : function(schematicName)
		{
			var schematicElement = jQuery('[xo-schematic="' + schematicName + '"]');
			var schematicCode    = jQuery('<div>').append(schematicElement.clone().removeAttr('xo-schematic')).html();
			return jQuery(schematicCode);
		},

		getElements : function()
		{
			var self = this;
			this.dom.block.find('[xo-element]').each(function(index, element){
				self.dom[jQuery(element).attr('xo-element')] = jQuery(element);
			});
			return this;
		},

		render : function()
		{
			return this;
		},

		remove : function()
		{
			this.dom.block.remove();
			this.stopListening();
			return this;
		}
	});



	XO.Model = Backbone.Model.extend({

		/**
		 * [onChange description]
		 * @param  {[type]} attrName [description]
		 * @param  {[type]} event    [description]
		 * @return {[type]}          [description]
		 */
		onChange : function(attrName, event)
		{
			this.on('change:' + attrName, event);
			event(this.get(attrName));
			return this;
		},

		/**
		 * [toJSONString description]
		 * @return {[type]} [description]
		 */
		toJSONString: function()
		{
			return JSON.stringify(this.toJSON());
		}
	});



	XO.Collection = Backbone.Collection.extend({});
	XO.Controller = Backbone.Router.extend({});


})();