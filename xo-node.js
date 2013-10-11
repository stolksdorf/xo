
exports.endpoints = [];

exports.api = function(endpoint, Model, middleware){
	exports.endpoints.push(endpoint);
	middleware = middleware || [];
	var mw = {
		get  : middleware,
		post : middleware,
		put  : middleware,
		del  : middleware
	};

	if(!_.isArray(middleware)){
		mw.get  = middleware.get  || [];
		mw.post = middleware.post || [];
		mw.put  = middleware.put  || [];
		mw.del  = middleware.del  || [];
	}

	//Removes the mongoose properties from the objects
	var clean = function(obj){
		if(typeof obj.length === 'number'){
			return _.map(obj, function(obj){
				return clean(obj);
			});
		}
		var result = obj.toObject();
		delete result._id;
		delete result.__v;
		return result;
	};

	//Collection
	app.get(endpoint, mw.get, function(req,res){
		Model.find(function(err, objs){
			console.log('getting all : ' + endpoint, clean(objs));
			if(err) return res.send(500, err.message);
			return res.send(clean(objs));
		});
	});

	app.delete(endpoint, mw.del, function(req,res){
		console.log('delete collection : '+ endpoint);
		Model.remove({}, function(err){
			if(err) return res.send(500, err.message);
			return res.send(200);
		});
	});

	//Object
	app.get(endpoint + '/:id', mw.get, function(req,res){
		console.log('getting : '+ endpoint, req.params.id);
		Model.findById(req.params.id, function(err, obj){
			if(err) return res.send(500, err.message);
			return res.send(clean(obj));
		});
	});

	app.post(endpoint, mw.post, function(req, res){
		var obj = new Model(req.body);
		if(!obj.id) obj.id = obj._id;
		obj.save(function(err, obj){
			if(err) return res.send(500, err.message);
			console.log('creating : '+ endpoint, obj);
			return res.send(clean(obj));
		});
	});

	app.put(endpoint + '/:id', mw.put, function(req,res){
		console.log('update : '+ endpoint, req.body);
		Model.findByIdAndUpdate(req.params.id, req.body, function(err, obj){
			if(err) return res.send(500, err.message);
			return res.send(clean(obj));
		});
	});

	app.delete(endpoint + '/:id', mw.del, function(req,res){
		console.log('deleteing : '+ endpoint, req.params.id);
		Model.findByIdAndRemove(req.params.id, function(err, obj){
			if(err) return res.send(500, err.message);
			return res.send(clean(obj));
		});
	});
}