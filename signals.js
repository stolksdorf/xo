
const proxify = (cb, obj={})=>{
	return new Proxy(obj[proxify.real]??obj, {
		get : (target, key)=>{
			if(key == proxify.real) return target;
			//return (typeof target[key] === 'object') ? proxify(cb, target[key]) : target[key];
			return (typeof target[key] === 'object') ? proxify(cb, Reflect.get(target, key)) : Reflect.get(target, key);
		},
		set : (target, key, val)=>{
			if(val === proxify.noop) return true;
			val = val[proxify.real] ?? val;
			if(utils.deepEqual(target[key], val)) return true;
			//target[key] = val;
			Reflect.set(target, key, val);

			//console.log('p:change', target, key);
			cb(target, key, val);
			return true;
		}
	});
};


const isObj = (val)=>val.constructor == Object;


function State(val, evt){

	return (newVal)=>{
		if(typeof newVal !== 'undefined' && newVal !== val){
			val = newVal;
			evt();
		}
		return val;
	}
}
const useState = (init)=>new State(init);

const useSignal = (val)=>{

}


function Test(val){ this.val=val };

const foo = new Test(5);

console.log(foo);
console.log(typeof foo);
console.log(foo())
