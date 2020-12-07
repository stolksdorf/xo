const Utils = {

}

const isPlainObject = (obj)=>obj && typeof obj == 'object' && obj.constructor == Object;

Utils.shortid = (n=8)=>Array.from(new Array(n*1),(v,i)=>'23456789abcdefghijkmnpqrstuvwxyz'[Math.floor(Math.random()*32)]).join('');

Utils.hash = (str)=>{
	return [...str].reduce((acc, char)=>{
		acc = ((acc<<5)-acc)+char.charCodeAt(0);
		return acc&acc;
	}, 0)
};

Utils.normalize = (obj)=>{
	if(obj instanceof HTMLElement){
		return obj.outerHTML.toString();
	}

	if(Array.isArray(obj)){
		return obj.map(Utils.normalize);
	}
	if(isPlainObject(obj)){
		return Object.entries(obj).reduce((acc, [key, val])=>{
			acc[key] = Utils.normalize(val)
			return acc;
		}, {});
	}

	if(typeof obj === 'function') return obj.toString();

	return obj;
}

Utils.string2DOM = (htmlString)=>{
	let temp = document.createElement('template');
	temp.innerHTML = htmlString;
	return temp.content.firstChild;
}

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


Utils.extract = (obj, path)=>path.reduce((acc, p)=>acc[p], obj);