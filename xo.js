;(function(){

	//Make sure that all schematics are hidden
	jQuery("<style type='text/css'> [xo-schematic]{display:none !important;} </style>").appendTo("head");

	XO = {
		Block : Backbone.View.extend({
			block     : '',
			schematic : '',

			/**
			 * Defaulted to accept a backbone model for intialization.
			 * can be overwritten, if different behaviour is needed
			 */
			initialize : function()
			{
				this.setup.apply(this, arguments);
				return this;
			},

			/**
			 * Quickly setups up a standard Block.
			 * If it's a non-schematic, sets the dom elements and calls render
			 * @param  {Backbone Model} model [optional]
			 */
			setup : function(model)
			{
				if(model instanceof Backbone.Model){
					this.model = model;
				}
				if(this.block !== ''){
					this.dom = this.dom || {};
					this.dom.block = jQuery('[xo-block="' + this.block + '"]');
					this.getElements();
					this.render();
				}
				return this;
			},

			/**
			 * Used only for schematic blocks.
			 * Takes an DOM element, find the schematic element, injects a new copy,
			 * assocaites all the elements, and renders the block.
			 * @param  {jQuery} injectionPoint
			 */
			injectInto : function(injectionPoint)
			{
				//Sanity checking, saved me so many times
				if(injectionPoint.length === 0 ){
					throw 'XO: Could not find the injection point';
				}
				if(this.schematic === ''){
					throw 'XO: Schematic name not set' ;
				}
				this.trigger('before_inject', this);
				this.dom = this.dom || {};
				this.dom.block = this.getSchematic(this.schematic).appendTo(injectionPoint);
				this.getElements().render();
				this.trigger('injected', this);
				return this;
			},

			/**
			 * Finds the schematic element with the given name
			 * returns a full string version of it for injection
			 * @param  {string} schematicName
			 */
			getSchematic : function(schematicName)
			{
				var schematicElement = jQuery('[xo-schematic="' + schematicName + '"]');
				if(schematicElement.length === 0 ){throw 'XO: Could not find schematic with name "' + schematicName + '"';}
				var schematicCode    = jQuery('<div>').append(schematicElement.clone().removeAttr('xo-schematic')).html();
				return jQuery(schematicCode);
			},

			/**
			 * Search for all elements with the data attribute 'xo-element' within the block's scope
			 * Adds the to 'this.dom.[elementName]' with the jQuery element as it's value
			 */
			getElements : function()
			{
				var self = this;
				this.dom.block.find('[xo-element]').each(function(index, element){
					self.dom[jQuery(element).attr('xo-element')] = jQuery(element);
				});
				return this;
			},

			/**
			 * Stub for user to extend
			 */
			render : function()
			{
				return this;
			},

			/**
			 * Removes the block element from the html and stops listeners
			 */
			remove : function()
			{
				this.dom.block.remove();
				this.stopListening();
				return this;
			}
		}),



		Model : Backbone.Model.extend({

			/**
			 * Sets up a change listener as well as immediately firing the listerner event
			 * Useful for when rendering a block with an already created model
			 * @param  {string}   attrName
			 * @param  {function} event
			 */
			onChange : function(attrName, event)
			{
				this.on('change:' + attrName, event);
				event(this.get(attrName));
				return this;
			},

			toJSONString: function()
			{
				return JSON.stringify(this.toJSON());
			}
		}),

		Collection : Backbone.Collection.extend({}),
		Controller : Backbone.Router.extend({}),

		/**
		 * Overwrites the default ajax behaviour to keep every thing client side for testing
		 *
		 */
		UseFakeAjax : function(){
			Backbone.ajax = function(req){
				setTimeout(function(){
					var data = JSON.parse(req.data || '{}');
					if(!data.id) data.id = _.uniqueId('id');
					if(req.success){
						req.success(data);
					}
				}, _.random(500,1500));
			};
		}
	};
})();