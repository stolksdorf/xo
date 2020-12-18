const Utils = {

}

Utils.isPlainObject = (obj)=>obj && typeof obj == 'object' && obj.constructor == Object;

Utils.shortid = (n=8)=>Array.from(new Array(n*1),(v,i)=>'23456789abcdefghijkmnpqrstuvwxyz'[Math.floor(Math.random()*32)]).join('');

Utils.hash = (str)=>{
	return [...str].reduce((acc, char)=>{
		acc = ((acc<<5)-acc)+char.charCodeAt(0);
		return acc&acc;
	}, 0)
};


//remove
Utils.normalize = (obj)=>{
	if(obj instanceof HTMLElement){
		return obj.outerHTML.toString();
	}

	if(Array.isArray(obj)){
		return obj.map(Utils.normalize);
	}
	if(Utils.isPlainObject(obj)){
		return Object.entries(obj).reduce((acc, [key, val])=>{
			acc[key] = Utils.normalize(val)
			return acc;
		}, {});
	}

	if(typeof obj === 'function') return obj.toString();

	return obj;
}

//remove
Utils.string2DOM = (htmlString)=>{
	let temp = document.createElement('template');
	temp.innerHTML = htmlString;
	return temp.content.firstChild;
}
//remove
Utils.replaceElement = (target, html)=>{
	const el = Utils.string2DOM(html);
	target.replaceWith(el)
	return el;
}

Utils.isSame = (a,b)=>{
	//if(typeof a === 'undefined' || typeof b === 'undefined') return false;

	//TODO: def make smarter
	const type=(x)=>{
//		if(typeof x === 'function') return x.toString();
if(typeof x === 'function') return x;
		if(typeof x === 'object') return JSON.stringify(x);
		return x;
	}
	return type(a) === type(b);
};

//Utils.execute = (v)=>typeof v=='function'?v():v;


Utils.isSame2 = (a,b)=>{
	if(typeof a === 'undefined' || typeof b === 'undefined') return false;
	if(a === b) return true;
	if(typeof a !== typeof b) return false;

	if(Array.isArray(a)){
		if(a.length !== b.length) return false;
		return a.every((x,idx)=>x===b[idx]);
	}
	if(typeof a == 'function'){
		return a.toString() == b.toString();
	}

	if(typeof a == 'object'){
		if(Object.keys(a).length != Object.keys(b).length) return false;
		return Object.entries(a).every(([key,val])=>val===b[key])
	}
	return false;
};



//remove
Utils.extract = (obj, path)=>path.reduce((acc, p)=>acc[p], obj);




const isSameTests = ()=>{
	console.assert(!Utils.isSame2());

	let a = undefined;
	console.assert(!Utils.isSame2(a,a));

	console.assert(Utils.isSame2([], []));
	console.assert(Utils.isSame2([1,2], [1,2]));

	console.assert(!Utils.isSame2([1,2], [2]));
	console.assert(!Utils.isSame2([1,2], [2,1]));


	console.assert(Utils.isSame2({}, {}));
	console.assert(Utils.isSame2({a:true}, {a:true}));

	console.assert(!Utils.isSame2({a:true}, {b:true}));
	console.assert(!Utils.isSame2({a:true}, {a:false}));

	console.assert(Utils.isSame2(()=>{}, ()=>{}));

}

isSameTests();