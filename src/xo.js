console.log('xo loaded');

let tree = {
	'root':{
		data: []
	}
};




const genScope = ($target, comp, leaf)=>{
	let stateCounter = 0;
	let effectCounter = 0;
	let refCounter = 0;
	const scope = {
		useState : (initVal)=>{
			let idx = stateCounter;
			stateCounter++;
			if(typeof leaf.comp.states[idx] === 'undefined'){
				leaf.comp.states[idx] = initVal;
			}
			return [
				leaf.comp.states[idx],
				(val)=>{
					//if(Utils.isSame(val, leaf.comp.states[idx])) return;
					console.log('leaf', leaf.comp)
					leaf.comp.states[idx] = val;
					scope.forceRender();
				}
			];
		},
		useEffect : (effect)=>{
			console.log(effect)
			let idx = effectCounter;
			effectCounter++;

			//TODO: def some work here
		},
		useRef : ()=>{
			throw 'Not implemented yet';
		},
		forceRender : ()=>{
			//removes previously stored args from the tree
			//then calls xo.render
			leaf.comp.args = [];
			return xo.render($target, comp, leaf);
		}
	};
	return scope;

};


const executeComp = ($target, comp, leaf)=>{

	//Arguments are the exact same from last time, do nothing


	// if(leaf.comp &&

	// 	comp.args.length == leaf.comp.args.length &&

	// 	comp.args.every((a)=>Utils.isSame(a, leaf.comp.args[idx]))){
	// 	return;
	// };

	//TODO: tes tto me sure this order works
	leaf.comp = {

		states : [],
		//effects : [],
		//refs : [],

		...leaf.comp,

		args: comp.args

	};

	console.log('here')

	return comp.func.apply(genScope($target, comp, leaf), comp.args);
}

const xo = {

	render : ($target, _obj, leaf=tree['root'])=>{

		let obj = _obj
		//assume the obj is either a blueprint or a comp
		console.log($target, obj, leaf)
		let bp = Library[obj.bp_id]
		if(obj.isComp){
			//might be an issue tbh
			let res = executeComp($target, obj, leaf);



			console.log('new res', res)

			return xo.render($target, res, leaf)
		}

		//bp = Library[obj.bp_id];

		if(!leaf.el || leaf.bp_id !== obj.bp_id){
			console.log('DRAWING', bp.html)
			// xo.unmount(leaf)

			leaf.bp_id = obj.bp_id;
			leaf.el    = BP.draw($target, bp);
			leaf.data  = [];
		}

		obj.data.map((val, idx)=>{
			const {path, attr} = bp.slots[idx];

			if(val.bp_id || val.isComp){
				const $targetEl = Utils.extract(leaf.el, path);
				if(!leaf.data[idx]) leaf.data[idx] = {};
				return xo.render($targetEl, val, leaf.data[idx]);
			}
			if(!Utils.isSame(leaf.data[idx], val)){
				const $targetEl = Utils.extract(leaf.el, path);

				//TODO: maybe make this into a BP function?
					//Apply the surgicalUpdate?
					//That way you can hide the crimes
				$targetEl[attr]=val;
				leaf.data[idx] = val;
				console.log('update', $targetEl, attr, val)
			}
		})
	},
	unmount : (tree_path)=>{
		//this removes sub-trees from the data cache and the dom
		//while triggering unmounting effects and what not

		//loads tree path
		// triggers an unmount (undo effects)
	},
	comp : (func, id)=>{
		return (...args)=>{
			return {
				isComp : true, //TODO: make into a symbol
				args,
				func
			}
		}

	}
}

