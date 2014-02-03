Check out a demo [here](http://stolksdorf.github.io/XO).

# What is it
XO (for exo-skeleton) is a very light weight Javascript MVC framework (under 300 lines!). Influenced by Backbone and built on top of [Archetype](http://stolksdorf.github.io/XO). XO focuses on exposing a series of tools, rather then being an emcompassing framework.


# Events
Every object in XO is extended from an [Archetype](http://stolksdorf.github.io/Archetype) object, so it's both extendable and "event-y".

**on** &nbsp; `object.on(event, function(arg1, arg2,...))` <br>
On sets up a listener for a specific event name. Whenever that event is triggered, each function added with `on()`, will be called with whatever arguments `trigger()` was called with.

	sloth.on('nap', function(adjective){
		console.log('The sloth is taking a ' + adjective + " nap!');
	});

	sloth.trigger('nap', sloth.napState);

**once** &nbsp; `object.once(event, function(arg1, arg2,...))` <br>
The same as `on()` but after it's first call, it will be removed, ensuring it will only be called once.

	sloth.once('yawn', function(){
		console.log('The sloth yawned');
	});
	sloth.trigger('yawn');
	sloth.trigger('yawn'); //Won't yawn twice in a row

**trigger** &nbsp; `object.trigger(event, [arg1, arg2, ...])` <br>
Trigger activates each listener for a specific event. You can add any additional parameters to be passed to the listener.

**off** &nbsp; `object.off([event])` <br>
Off removes all listeners on an object for a given event. If no event name is given, it will remove all listeners on that object.

	sloth.on('run_fast', function(){
		console.log('The sloth made a speedy getaway.');
	});
	sloth.off('run_fast');
	sloth.trigger('run_fast'); //Won't trigger the speedy getaway


# Models
Models in XO are just plain Javascript objects with some functions attached.

**extend** &nbsp; `var ModelDefinition = xo.model.extend({ ... })` <br>
Creates a new model definition, extending the existing model definition from XO. This model can then be extended further, much like classes.

	var SlothModel = xo.model.extend({
		URL : function(){
			return '/api/sloth';
		},
		nap : function(){ ... },
		eat : function(food){ ... }
	});


**create** &nbsp; `var model = ModelDefinition.create([attributes])` <br>
Creates a new instance of a model. An object attributes can be passed into to set up the model with those attributes.

	var sloth = SlothModel.create({
		name : 'Speedy',
		numOfToes : 3,
		isHungry : false,
		classifiction : 'Bradypus pygmaeus',
		napState : 'intense',
		image : '../images/speedy.png'
	});

**initialize** &nbsp; `model.initialize` <br>
Initialize is called whenever a new model is created using `model.create(...)`. Any parameters passed into the create called are passed into this function.

**set** &nbsp; `model.set(attribute, val), model.set(attributes)` <br>
Sets attributes (one or many) to the Model. If any of them change the model's state, it will fire a change event, eg. `change:title`. Any changes will also fire a single `change` event for the model as well. You can also just set the attributes of a model using standard Javascript, eg. `model.title = "Test"`, this is valid, but will not trigger any change events.

	sloth.set({classification: "Choloepus didactylus", numOfToes: 2});
	sloth.set("napState", "medicore");

**onChange** &nbsp; `model.onChange(attribute, function)` <br>
onChange will set a change event listener for that attribute with the given function, as well as immeadiately call the function with the current value of the attribute. This is useful for setting up events on models that you are unsure if they've been populated yet.

	sloth.onChange('isHungry', function(hungry){
		if(hungry) sloth.eat();
	})

**toJSON** &nbsp; `model.toJSON()` <br>
Returns a copy of all the attributes on the object as a new JSON object.

**URL** &nbsp; `model.URL()` <br>
Returns the URL to the endpoint of this model for a REST API. Set this when creating your model definition to have `save`, `fetch`, and `remove` make ajax calls to the server.

**save** &nbsp; `model.save([data], [callback(error, success)])` <br>
Sends an ajax request to save to the model to the server if `URL` is set. Uses a POST request to create new models, PUT requests for updates. If `data` is passed in it will combine that data with the model and send it to the server to be saved, then update the model with the response. This is useful for when you want to fire your attribute change events only when the data has been successfuly saved to the server. Triggers a `before:save` event before the ajax call, and a `save` event when it successful. Any errors will trigger an `error` event.

	sloth.save({isHungry : true}, function(){
		console.log('sloth saved!');
	});
	//Triggers the change event for isHungry after the server has responded successfully


**fetch** &nbsp; `model.fetch([callback(error, success)])` <br>
Sends an ajax request to fetch model data from the server if `URL` and the `id` attribute is set. Uses a GET request. Triggers a `before:fetch` event before the ajax call, and a `fetch` event when it successful. Any errors will trigger an `error` event.

**remove** &nbsp; `model.remove([callback(error, success)])` <br>
Sends an ajax request to remove the model from the server if `URL` and the `id` attribute is set. Uses a DELETE request. If successful will remove the model from any colelctions it's a part of and turn off any Triggers a `before:remove` event before the ajax call, and a `remove` event when it successful. Any errors will trigger an `error` event.



# Views
A view controls the look of your user interface. They can in two flavours; **View**, and **Schematic**. **View** is useful for when you have a single instance of this view in your html and will not be adding more, such as an edit form. **Schematics** are useful for when you have multiple instances, such as items in a todo list.

**extend** &nbsp; `var ViewDefinition = xo.view.extend({ ... })` <br>
Creates a new view definition, extending the existing view definition from XO. This view can then be extended further, much like classes.

	var SlothInfo = xo.view.extend({
		view : 'sloth_info',
		render : function(){ ... }
	});

**view** &nbsp; `view.view` <br>
When you define your View, you can set the `view` attrbute as a string. When you create your view, XO will search the DOM for an element with the data property of `xo-view` set to whatever string you passed in. That element will be set as your `view.dom.view`. XO will then iterate within that element and find every element with a data attribute of `xo-element` and add it to the `view.dom` object. Then `view.render()` will be called automatically.

	<div xo-view='sloth_info'>
		<h1 xo-element='slothName'></h1>
		<div>
			Number of Toes : <span xo-element='toes'></span>
		</div>
		<img xo-element='hungryImage' src='../hungry.png'></img>
		<img xo-element='notHungryImage' src='../not_hungry.png'></img>
	</div>

	<script>
		SlothInfo = xo.view.extend({
			view : 'sloth_info',
			render : function(){
				var self = this;
				this.model.onChange({
					name : function(name){
						self.dom.slothName.text(name);
					},
					numOfToes : function(numOfToes){
						self.dom.toes.text(numOfToes);
					},
					isHungry : function(isHungry){
						if(isHungry){
							self.dom.hungryImage.show();
							self.dom.notHungryImage.hide();
						} else {
							self.dom.hungryImage.hide();
							self.dom.notHungryImage.show();
						}
					}
				});
				return this;
			}
		});
	</script>


**schematic** &nbsp; `view.schematic()` <br>
When you define your View, you can set the `schematic` attrbute as a string or a HTML element. After a new view is created it can be injected into your page by using either `view.appendTo()` or `view.prependTo()`. After it is injected XO will automatically call `view.render()`.

If you set the `view.schematic` to a string, XO will search the DOM for an element with the data attribute of `xo-schematic` set to your string.

	<div xo-schematic='sloth_card'>
		<img xo-element='profilePic'></img>
		<div xo-element='slothName'></div>
		<div>
			Classification: <span xo-element='classification'></span>
		</div>
	</div>

	<script>
		SlothCard = xo.view.extend({
			schematic : 'sloth_card',
			render : function(){
				var self = this;
				this.model.onChange({
					name : function(name){
						self.dom.slothName.text(name);
					},
					image : function(image){
						self.dom.profilePic.attr('src', image);
					},
					classification : function(classification){
						self.dom.classification.text(classification);
					}
				});
				this.dom.view.click(function(){
					window.location.href = '/sloth/' + self.model.id
				});
				return this;
			}
		});

		SlothCollection.each(function(slothModel){
			SlothCard.create(slothModel).appendTo($('.container'));
		});
	</script>

You can also set the `view.schematic` as an HTML element using a library like [Dom.js](http://stolksdorf.github.io/Domjs).

	SlothCard = xo.view.extend({
		schematic : DOM.div({'xo-schematic':"sloth_card"},
			DOM.img({'xo-element':"profilePic"}),
			DOM.div({'xo-element':"slothName"}),
			DOM.div({}, "Classification: ", DOM.span({'xo-element':"classification"}))
		),
		render : function(){ ... }
	});


**dom** &nbsp; `view.dom` <br>
The `view.dom` object stores all references to the view's HTML elements marked with the `xo-element` data attribute.

**elementWrapper** &nbsp; `xo.elementWrapper` <br>
When XO searches for all the `xo-element` elements, it will wrap it using the function at `xo.elementWrapper`. XO will try to use jQuery if it exists on the page, otherwise it will just return the native HTML node. Feel free to chaneg this to other libraries like Zepto.js.


**create** &nbsp; `view.create([model])` <br>
When creating a instance of a view, you can pass it a model and it will be automatically set as `view.model`.

**initialize** &nbsp; `view.initialize()` <br>
Called whenever the view is created. Populate as you see fit.

**render** &nbsp; `view.render()` <br>
Called whenever the view is added to the page. Populate this with your model listeners and your DOM events.

**appendTo** &nbsp; `view.appendTo(target)` <br>
Appends the view to the bottom of the target, then calls `view.render()`. The target can be a native HTML element or a jQuery reference.

**prependTo** &nbsp; `view.prependTo(target)` <br>
Appends the view to the top of the target, then calls `view.render()`. The target can be a native HTML element or a jQuery reference.

**remove** &nbsp; `view.remove()` <br>
Attempts to remove the view from the DOM and removes all event listeners.



# Collections
Collections are a list of models with a few extra features.

**extend** &nbsp; `var CollectionDefinition = xo.collection.extend({ ... })` <br>
Creates a new collection definition, extending the existing collection definition from XO. This collection can then be extended further, much like classes.

	var SlothCollection = xo.collection.extend({
		URL : function(){
			return '/api/sloth';
		},
		model : SlothModel
	});

**create** &nbsp; `view.create([models])` <br>
Creates a new instance of the collection. Can pass it an array of models or objects to be added to the collection using `collection.set()`.

	var BedOfSloths = SlothCollection.create([
		{name : 'Mellon'},
		{name :'Speedy', numOfToes : 3}
	]);


**URL** &nbsp; `collection.URL()` <br>
Setting this allows you to use `collection.fetch()` to pull all models from the server. XO will try to use the model's URL function if this is not set.

**model** &nbsp; `collection.model()` <br>
Sets which model to use when adding new objects to the collection. Defaults to `xo.model`.

**models** &nbsp; `collection.models()` <br>
An array of models in the collection.

**initialize** &nbsp; `collection.initialize()` <br>
Called after the collection is created.

**set** &nbsp; `collection.set(models)` <br>
Sets the collection to the list of models passed in. Removes all exsisting models, then uses the `collection.add` function to add the list.

	SlothCollection.set([
		{name : 'Mellon'},
		{name :'Speedy', numOfToes : 3}
	]);

**get** &nbsp; `collection.get(id)` <br>
Returns the model with the given `id`. Returns `undefined` if it can't find the model.

**remove** &nbsp; `collection.remove(model)`, `collection.remove(id)` <br>
Removes a model from the collection by model instance or id.

**add** &nbsp; `collection.add(model)` <br>
Adds the model to the colllection. If the argument is not an instance of the right model, the collection will create a model using the argument. The resultant model will be returned and an `add` event will fire.

**each** &nbsp; `collection.each(function(model){...})` <br>
Iterates over each model using the given function. Returns an array of all the returned values of each function call.

	SlothCollection.countToes = function(){
		var result = {
			twoToes   : 0,
			threeToes : 0
		};
		this.each(function(model){
			if(model.numOfToes === 2) result.twoToes++;
			if(model.numOfToes === 3) result.threeToes++;
		});
		return result;
	}

**toJSON** &nbsp; `collection.toJSON()` <br>
Returns a JSON array of all the models converted into JSON objects.

**save** &nbsp; `collection.save([callback])` <br>
Calls `model.save` on each model within the collection. Triggers a `before:save` event before the ajax call, and a `save` event when it successful. Any errors will trigger an `error` event.

**fetch** &nbsp; `collection.fetch([callback])` <br>
Uses the `collection.URL()` to make an ajax GET request. Populates the collection with the result. Triggers a `before:fetch` event before the ajax call, and a `fetch` event when it successful. Any errors will trigger an `error` event.

**destroy** &nbsp; `collection.destroy([callback])` <br>
Calls `model.destroy` on each model within the collection. Triggers a `before:destroy` event before the ajax call, and a `destroy` event when it successful. Any errors will trigger an `error` event.



# Router
XO uses hash fragments to track a page's state to let you build linkable and bookmarkable URLs for your app.

**extend** &nbsp; `var RouterDefinition = xo.router.extend({ ... })` <br>
Creates a new router definition, extending the existing router definition from XO. This router can then be extended further, much like classes.

	var SlothRouter = xo.router.extend();

**create** &nbsp; `view.create([routes])` <br>
Creates a new instance of the Router.

	var Router = SlothRouter.create({
		'/sloth/id' : function(page, id){
			SlothInfo.loadSloth(id);
		}
	});


**navigate** &nbsp; `router.navigate(path_fragment)` <br>
Updates the browsers url with the given `path_fragement`.

**add** &nbsp; `router.add(path, function)` <br>
Add additonal route triggers to the router.


# REST API

Adding more on this later