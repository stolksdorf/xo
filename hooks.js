/* A collection of useful custom hooks */


const useAsync = (scope, func, init)=>{
	const [pending, setPending] = scope.useState(false);
	const [error, setError] = scope.useState(null);
	const [result, setResult] = scope.useState(init);
	let wrapper = (...args)=>{
		setPending(true);
		setError(null);
		return func(...args)
			.then((content)=>setResult(content))
			.catch((err)=>setError(err))
			.finally(()=>setPending(false));
	}
	wrapper.pending= pending;
	wrapper.error  = error;
	wrapper.result = result;
	return wrapper;
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