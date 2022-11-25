const isSame = (a,b)=>{
	if(a===b) return true;
	if(typeof a !== "object" || typeof b !== "object") return false;
	const A = Object.keys(a), B = Object.keys(b);
	if(A.length !== B.length) return false;
	return A.every(k=>isSame(a[k], b[k]));
};


const PROX = Symbol(), NOOP = Symbol();

// const proxify2 = (cb, obj={})=>{
// 	return new Proxy(obj[PROX]??obj, {
// 		get : (target, key)=>{
// 			if(key == PROX) return target;
// 			if(typeof target[key] === 'object') return proxify2(cb, target[key]);
// 			return target[key];
// 		},
// 		set : (target, key, value)=>{
// 			if(value === NOOP) return true;
// 			if(isSame(target[key], value)) return true;
// 			target[key] = value[PROX]??value;
// 			cb();
// 		}
// 	});
// };


const nestingProxy = (cb, obj={})=>{
	return new Proxy(obj[PROX]??obj, {
		get(target,key){
			if(key===PROX) return target;
			if(typeof target[key] === 'object') return nestingProxy(cb, target[key]);
			return target[key];
		},
		set(target,key,val){
			if(val === NOOP || isSame(target[key],val)) return true;
			target[key] = val[PROX]??val;
			cb();
		}
	});
};

const context = {
	initState : arg=>arg,
	useEffect : (arg)=>{ console.log(arg); },
	state : nestingProxy(()=>console.log('SET')),
	el : { a : true }
};

const ctx = new Proxy(context, {
	get(t,k){ return t[k]??t.state[k] },
	set(t,k,v){ if(t[k]){t[k]=v}else{t.state[k]=v;} }
});

console.log(ctx.el);


ctx.foo = ctx.initState({ a : [1,2,3,4]});

ctx.initState = ()=>NOOP;

ctx.foo = ctx.initState(3);

console.log(ctx.state);
