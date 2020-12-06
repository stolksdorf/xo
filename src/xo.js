console.log('xo loaded');

let tree = {
	'root':{
		data: []
	}
};




const genScope = ()=>{
	return {
		useState : ()=>{},
		useEffect : (effect)=>{
			console.log(effect)
		},
		useRef : ()=>{}
	};

};

const xo = {

	render : (target, obj, leaf=tree['root'])=>{
		//assume the obj is either a blueprint or a comp
		let bp;
		if(obj.isComp){
			bp = obj.func.apply(genScope(), obj.args);
		}

		bp = Library[obj.bp_id];

		if(!leaf.el || leaf.bp !== obj.bp_id){ //Or a bp id mistach
			console.log('DRAWING', bp.html)
			// xo.unmount(leaf)

			leaf.bp   = obj.bp_id;
			leaf.el   = BP.draw(target, bp);
			leaf.data = [];
		}

		obj.data.map((val, idx)=>{
			const {path, attr} = bp.slots[idx];
			if(val.bp_id){
				const targetEl = Utils.extract(leaf.el, path);
				if(!leaf.data[idx]) leaf.data[idx] = {};
				return xo.render(targetEl, val, leaf.data[idx]);
			}
			if(!Utils.isSame(leaf.data[idx], val)){
				const targetEl = Utils.extract(leaf.el, path);
				targetEl[attr]=val;
				leaf.data[idx] = val;
				console.log('update', targetEl, attr, val)
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
				func : func
			}
		}

	}
}

