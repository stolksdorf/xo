const Observable = (fn, obj)=>{
	if(typeof obj !== 'object') return obj;
	return new Proxy(obj, {
		get(target, attr){
			return (attr === Symbol.for('raw')) ?target : Observable(fn, target[attr]);
		},
		set(target, attr, val){
			if(target[attr] !== val){
				Reflect.set(target, attr, val[Symbol.for('raw')] ?? val);
				fn(attr, val);
			}
			return true;
		}
	});
};

//let foo = Observable((attr,val)=>console.log('hello', attr, val), {a : true});



//Maybe re-work this to use prototypes instead
const createContextOld = (fn, initObj, baseCtx)=>{
	return new Proxy(initObj, {
		get(target, key){
			if(typeof target[key] !== 'undefined' || !baseCtx) return target[key];
			if(baseCtx) return baseCtx[key];
		},
		set(target, key, val){
			if(typeof target[key] !== 'undefined' || !baseCtx){
				if(target[key] !== val){
					Reflect.set(target, key, val);
					fn(key, val);
				}
				return true;
			}
			return baseCtx[key] = val;
		}
	});
}

const createContext = (fn, initObj, baseCtx)=>{
	const prox = new Proxy(initObj, {
		get(target, key){
			return target[key];
			if(typeof target[key] !== 'undefined' || !baseCtx) return target[key];
			if(baseCtx) return baseCtx[key];
		},
		set(target, key, val){
			if(target.hasOwnProperty(key)){
				if(target[key] !== val){
					Reflect.set(target, key, val);
					fn(key, val);
				}
				return true;
			}
			target[key] = val;
		}
	});
	if(baseCtx) Object.setPrototypeOf(prox, baseCtx);

	return prox;
}



const ctx1 = createContext((...args)=>console.log('ctx1',...args), {toggle:true, yo : ()=>'yo'});

const ctx2 = createContext((...args)=>console.log('ctx2', ...args), {text: 'foo'}, ctx1);


console.log({ctx1})
console.log(ctx2.keys())


// //ctx2.toggle = false;
// ctx2.text = "yoooo";


// console.log(ctx2.yo())



const useContext = (initObj={})=>{
	if(instance.context) return instance.context;
	const getParentContext = (el)=>{
		if(!el) return;
		let temp = xo.Component.cache.get(el);
		if(temp && temp.context) return temp.context;
		return getParentContext(el.parentNode);
	}
	instance.context = createContext(instance.render, initObj, getParentContext(node.parentNode));
	return instance.context;
};