var DEBUG = false;

exports.endpoints = [];

//Removes the mongoose properties from the objects
exports.clean = function(obj){
	if(!obj) return obj;
	if(typeof obj.length === 'number'){
		return _.map(obj, function(obj){
			return exports.clean(obj);
		});
	}
	var result = obj.toObject();
	delete result._id;
	delete result.__v;
	return result;
};

exports.api = function(endpoint, Model, middleware, handleError){
	exports.endpoints.push(endpoint);
	middleware = middleware || [];
	var mw = {
		get  : middleware,
		post : middleware,
		put  : middleware,
		del  : middleware
	};

	if(Object.prototype.toString.call(middleware) !== '[object Array]'){
		mw.get  = middleware.get  || [];
		mw.post = middleware.post || [];
		mw.put  = middleware.put  || [];
		mw.del  = middleware.del  || [];
	}

	handleError = handleError || function(err, req, res){
		console.log('ERROR:', err);
		res.send(500, err);
	};

	//XO Middleware
	mw.findAll = function(req,res,next){
		Model.find(function(err, models){
			if(err) return handleError(err, req, res);
			req.models = models;
			return next();
		});
	};
	mw.find = function(req,res,next){
		Model.findById(req.params.id, function(err, obj){
			if(err) return handleError(err, req, res);
			req.model = obj;
			return next();
		});
	};
	mw.create = function(req,res,next){
		req.model = new Model(req.body);
		req.model.id = req.model._id;
		return next();
	};
	mw.update = function(req,res,next){
		Model.findById(req.params.id, function(err, obj){
			if(!obj || err) return handleError(err, req, res);
			req.model = _.extend(obj, req.body);
			return next();
		});
	};


	//Collection
	app.get(endpoint, mw.findAll, mw.get, function(req,res){
		if(!req.models) return handleError('no collection', req, res);
		return res.send(200, exports.clean(req.models));
	});

	//Model
	app.get(endpoint + '/:id', mw.find, mw.get, function(req,res){
		if(!req.model) return handleError('no model', req, res);
		return res.send(200, exports.clean(req.model));
	});

	app.delete(endpoint + '/:id', mw.find, mw.del, function(req,res){
		if(!req.model) return handleError('no model', req, res);
		req.model.remove(function(err){
			if(err) return handleError(err, req, res);
			return res.send(200);
		});
	});

	app.post(endpoint, mw.create, mw.post, function(req, res){
		if(!req.model) return handleError('no model', req, res);
		req.model.save(function(err, obj){
			if(err) return handleError(err, req, res);
			return res.send(200, exports.clean(obj));
		});
	});

	app.put(endpoint + '/:id', mw.update, mw.put, function(req,res){
		if(!req.model) return handleError('no model', req, res);
		req.model.save(function(err, obj){
			if(err) return handleError(err, req, res);
			return res.send(200, exports.clean(obj));
		});
	});
}