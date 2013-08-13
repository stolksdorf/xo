(function(){

	//makes sure that all schematics are always hidden
	jQuery("<style type='text/css'> [xo-schematic]{display:none !important;} </style>").appendTo("head");

	/**
	 * Finds all elements within the given scope that has the data attribute
	 * and optionally a specific value for it
	 * @param  {element}         scope
	 * @param  {string}       dataName
	 * @param  {string}       dataValue [optional]
	 * @return {arr of elements}
	 */
	var getElementsWithData = function(scope, dataName, dataValue){
		if(scope instanceof jQuery) scope = scope[0];

		return _.filter(scope.getElementsByTagName('*'), function(element){
			var val = element.getAttribute(dataName);
			if(val && (!dataValue || val === dataValue)){
				return true;
			}
			return false;
		});
	};

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
				this.dom.block = getElementsWithData(document, 'xo-block', this.block);
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
			var schematicElement = getElementsWithData(document, 'xo-schematic', schematicName);
			if(schematicElement.length === 0 ){throw 'XO: Could not find schematic with name "' + schematicName + '"';}
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

	/**
	 * Call to fake out server responses for backbone
	 */
	XO.FakeResponses = function(){
		Backbone.ajax = function(req){
			setTimeout(function(){
				var data = JSON.parse(req.data || '{}');
				if(!data.id) data.id = _.uniqueId('id');
				if(req.success){
					req.success(data);
				}
			}, _.random(500,1500));
		};
	};

})();