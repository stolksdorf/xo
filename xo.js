

let cache = [];

const render = (target, comp)=>{




	target.innerHTML = comp.template;
	const root = target.childNodes[0];



	//update
	comp.data.map((val, idx)=>{

		if(cache[idx] == val){
			comp.funcs[idx].update(val, root);
			cache[idx] = val;
		}
	})

}