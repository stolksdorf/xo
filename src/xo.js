/* TODO:
- effects DONE
- handle null elements
- unmounting (new test with button toggling elements)
- make a explainer in the readme with an emoji status chart
- fix condition rendering checks
- fix conditional state and effect change checks
- simple server-side rendering
  - shortcut through the render function
  - maybe it jumps out at the top if window is not defined

*/


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
				leaf.comp.states[idx] = typeof initVal=='function'?initVal():initVal;
			}
			return [
				leaf.comp.states[idx],
				(val, force)=>{
					//TODO: conditional checks
					//if(Utils.isSame(val, leaf.comp.states[idx])) return;
					//console.log('leaf', leaf.comp)
					leaf.comp.states[idx] = val;
					scope.forceRender();
				}
			];
		},
		//todo: rename 'args'
		useEffect : (effect, triggerArgs)=>{
			console.log(effect);
			console.log(leaf);
			let idx = effectCounter;
			effectCounter++;

			if(!leaf.comp.effects[idx] || !Utils.isSame2(leaf.comp.effects[idx].args, triggerArgs)){
				leaf.comp.effects[idx] = {
					args : triggerArgs,
					cleanup : effect()
				}
			}
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
		effects : [],
		//refs : [],

		...leaf.comp,

		//func : comp?

		args: comp.args

	};

	console.log('here')

	return comp.func.apply(genScope($target, comp, leaf), comp.args);
}

const xo = {

	render : ($target, _obj, leaf=tree['root'])=>{

		/*
			if _obj is falsey
				replace $target with <slot></slot>
				unmount(leaf)
			if _obj is array
				replace $target with N <slots>
				call render on each with the array item, create new leafs?

			if _obj is comp
				create new scope, add to tree
				execute comp func with scope and (call render ? store in _obj)
					How to handle comps that call comps?

			if _obj is bp




		*/

		//console.log($target, _obj)

		let obj = _obj
		//assume the obj is either a blueprint or a comp
		console.log($target, obj, leaf)
		let bp = Library[obj.bp_id]; //maybe unneeded?


		if(obj.isComp){
			//might be an issue tbh

			//check the stored args only

			let res = executeComp($target, obj, leaf);



			console.log('new res', res, $target)

			return xo.render($target, res, leaf)
		}

		//bp = Library[obj.bp_id];

		if(!leaf.$el || leaf.bp_id !== obj.bp_id){
			console.log('DRAWING', bp.html)
			// xo.unmount(leaf)

			console.log($target)

			leaf.bp_id = obj.bp_id;
			leaf.$el    = BP.draw($target, bp);
			leaf.data  = [];
		}

		obj.data.map((val, idx)=>{
			const {path, attr} = bp.slots[idx];

			console.log('{path, attr}', {path, attr})

			if(val.bp_id || val.isComp){
				const $targetEl = path.reduce(($el, i)=>$el.childNodes[i], leaf.$el);
				if(!leaf.data[idx]) leaf.data[idx] = {};
				return xo.render($targetEl, val, leaf.data[idx]);
			}
			if(!Utils.isSame(leaf.data[idx], val)){
				BP.surgicalUpdate(leaf.$el, {path, attr}, val)
				leaf.data[idx] = val;
			}
		})
	},
	unmount : ()=>{
		//this removes sub-trees from the data cache and the dom
		//while triggering unmounting effects and what not

		//loads tree path
		// triggers an unmount (undo effects)
	},
	mount : ()=>{
		//draw blueprint
		//create scope and attach to tree
			// maybe only do this if comp?
		//mount returns ref to element maybe?

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

