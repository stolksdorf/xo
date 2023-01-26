/* A collection of useful custom hooks */


const useAsync = (scope, func, init)=>{
	const [pending, setPending] = scope.useState(false);
	const [error, setError] = scope.useState(null);
	const [result, setResult] = scope.useState(init);
	let wrapper = scope.useRef((...args)=>{
		setPending(true);
		setError(null);
		return func(...args)
			.then((content)=>setResult(content))
			.catch((err)=>setError(err))
			.finally(()=>setPending(false));
	});
	wrapper.pending= pending;
	wrapper.error  = error;
	wrapper.result = result;
	return wrapper;
};

//Built-in
xo.Hooks.useAsync = function(asyncFn, init){
	if(!this.hook.fn){
		this.hook.fn = (...args)=>{
			this.hook.fn.pending = true;
			this.hook.fn.error = null;
			this.instance.redraw();
			return asyncFn(...args)
				.then(res=>{ this.hook.fn.result=res; return res; })
				.catch(err=>{ this.hook.fn.error=err; return err; })
				.finally(res=>{
					this.hook.fn.pending=false;
					this.instance.redraw();
					return res;
				});
		};
		this.hook.fn.result=init;
	}
	return this.hook.fn;
};



const useLocalStorage = (scope, key, init)=>{
	const [val, setVal] = scope.useState(init);
	scope.useEffect(()=>{
		try{
			const storedVal = localStorage.getItem(key);
			if(storedVal) setVal(JSON.parse(storedVal));
		}catch(err){}
	});
	return [val, (newVal)=>{
		localStorage.setItem(key, JSON.stringify(newVal));
		setVal(newVal);
	}];
};

xo.Hooks.useLocalStorage = function(key, init){


};


const useSessionStorage = (scope, key, init)=>{
	const [val, setVal] = scope.useState(init);
	scope.useEffect(()=>{
		try{
			const storedVal = sessionStorage.getItem(key);
			if(storedVal) setVal(JSON.parse(storedVal));
		}catch(err){}
	});
	return [val, (newVal)=>{
		sessionStorage.setItem(key, JSON.stringify(newVal));
		setVal(newVal);
	}];
};