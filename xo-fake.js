/*
Used for faking out AJAx request to a DB for testing
Use jsongen to create an initial fake DB
 */

xo = xo || {};


xo.fakeDB = function(DB){
	var obj = {
		DB : DB,
		sendResponse : function(fn, data){
			setTimeout(function(){
				fn(data);
			}, _.random(500,1500));
		},
		handleRequest : function(req){
			try{
				var prevScope, index;
				var scope = _.reduce(req.url.split('/'), function(scope, urlPart){
					prevScope = scope;
					if(urlPart == "") return scope;
					else if(typeof scope[urlPart] !== 'undefined'){
						return scope[urlPart];
					}else{
						var temp = _.find(scope, function(item, idx){
							index = idx;
							return item.id == urlPart
						});
						if(temp) return temp;
					}
					throw urlPart;
				}, DB);
			}catch(e){
				obj.sendResponse(req.error, "Could not find : " + e);
			}
			//Check for types
			if(req.type === 'GET'){
				obj.sendResponse(req.success, scope);
			}else if (req.type === 'POST'){
				req.data.id         = "id" + _.random(100000000);
				req.data.created_on = new Date().getTime();
				scope.push(req.data);
				obj.sendResponse(req.success, req.data);
			}else if(req.type === 'PUT'){
				scope = _.extend(scope, req.data);
				obj.sendResponse(req.success, scope);
			}else if(req.type === 'DELETE'){
				prevScope.splice(index, 1);
				obj.sendResponse(req.success, {});
			}
			return this;
		},
	};
	return obj;
};


var sampleRequest = {
	url : '/discussions/id31/responses/id29',
	type : 'PUT',
	data : {
		text : 'Update Response'
	},
	success : function(data){
		console.log('success', data);
	},
	error : function(data){
		console.log('error', data);
	},
}

