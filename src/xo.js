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

- Key maps solve the 'keys' issue for lists of components during rendering


- Have three types of objects in the source tree
	- data
	- comp
	- bp

*/

/* IDEAS:

blueprints and comps each are unique in the tree

{
	type: 'comp',
	args, func, scope...

	child : {
		type : 'bp',
		id : -435934,
		children : [
			{ type: 'comp', ... },
			{ type: 'bp', ... }
			{ type: 'data', ... }
		],
	}
}


*/


console.log('xo loaded');

let tree = {
	//can bump this down  layer,
	//this tree should only exist per render call
		// need to build a nested render call, with an outside scope to hold the tree
	'root':{
		data: []
	}
};




const genScope = ($target, comp, leaf)=>{
	let stateCounter = 0;
	let effectCounter = 0;
	let refCounter = 0;
	const scope = {
		reset : ()=>{
			stateCounter = 0;
			effectCounter = 0;
			refCounter = 0;
		},
		useState : (initVal)=>{
			let idx = stateCounter;
			stateCounter++;
			if(typeof leaf.states[idx] === 'undefined'){
				leaf.states[idx] = typeof initVal=='function'?initVal():initVal;
			}
			return [
				leaf.states[idx],
				(val, force)=>{
					//TODO: conditional checks
					//if(Utils.isSame(val, leaf.states[idx])) return;
					//console.log('leaf', leaf.comp)
					leaf.states[idx] = val;
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

			if(!leaf.effects[idx] || !Utils.isSame2(leaf.effects[idx].args, triggerArgs)){
				leaf.effects[idx] = {
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
			leaf.args = [];
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
	leaf = {

		states : [],
		effects : [],
		//refs : [],

		...leaf,

		//func : comp?

		args: comp.args,



	};

	leaf.child = comp.func.apply(genScope($target, comp, leaf), comp.args)

	console.log('here')

	return ;
}


const render = ($target, obj, leaf)=>{

	/*
		if obj is falsey
			replace $target with <slot></slot>
			unmount(leaf)
		if obj is array
			replace $target with N <slots>
			call render on each with the array item, create new leafs?
		if obj is comp
			chec existing scope
				if comp and args haven't changed, return
			create new scope, add to tree
			execute comp func with scope and (call render ? store in obj)
				How to handle comps that call comps?
		if obj is bp
			pull up bp from lib
			when to unmount?
			when to redraw?
			loop through data points and update when delta
	*/
	if(!obj){
		console.log('falsey bb', obj, leaf);
		xo.unmount(leaf, true);
		return;
	}
	if(obj.isComp){
		//might be an issue tbh
		//check the stored args only
		executeComp($target, obj, leaf);
		//console.log('new res', res, $target)
		return xo.render($target, leaf.child, leaf)
	}
	if(obj.type == 'bp'){

		const bp = Library[obj.id];
		//not same type, not same id,

		if(obj.type !== leaf.type || leaf.id !== obj.id){
			console.log('Draw blueprint');

			// leaf.isBP = true;
			// leaf.bp_id = obj.bp_id;
			// leaf.$el    = draw($target, bp);
			// leaf.children  = [];
			//leaf.data  = []; //???

			const $main = draw($target, bp);
			leaf = {
				...obj,
				$el : $main,
				children : obj.data.map((datum, idx)=>{
					const {path, attr}=bp.slots[idx];
					return {
						type : 'data',
						$el : path.reduce(($el, i)=>$el.childNodes[i], $main),
						attr,
						val : null
					}
				})
			}
		}
		obj.data.map((val, idx)=>{

			//TODO: just map straihg tinto render
			// no processing here



			//const {path, attr} = bp.slots[idx];
			//console.log('{path, attr}', {path, attr})

			if(leaf.children[idx].val == val){
				console.log('should skip');
			}




			if(val.bp_id || val.isComp){
				const $targetEl = path.reduce(($el, i)=>$el.childNodes[i], leaf.$el); //make into func
				if(!leaf.children[idx]) leaf.children[idx] = {};
				return xo.render($targetEl, val, leaf.children[idx]);
			}
			if(!Utils.isSame(leaf.children[idx], val)){
				BP.surgicalUpdate(leaf.$el, {path, attr}, val)
				leaf.children[idx] = val;
			}
		})
		return leaf;
	}
	if(obj.type == 'data'){
		// compare to the leaf here for old val
		// if different, do an update, target el is stored within the leaf
	}
	//reanme this to isCollection or isArrOrObj
	if(Array.isArray(obj) || Utils.isPlainObject(obj)){
		throw 'List elements not supported yet'
	}
	throw `Given a non-parsable value into the renderer: ${obj}`;

};

const unmount = (leaf, shouldReplace=true)=>{
	console.log('UNMOUNTING', leaf)
	if(leaf.type == 'comp'){
		unmount(leaf.child);
		leaf.effects.map(({cleanup})=>cleanup());
	}
	if(leaf.type == 'bp'){
		leaf.children.map(c=>xo.unmount(c, shouldReplace)); //always false?
		if(shouldReplace) leaf.$el.replaceWith(document.createElement('slot'));
	}
	delete leaf;
};

const mount = ()=>{
	//draw blueprint
	//create scope and attach to tree
		// maybe only do this if comp?
	//mount returns ref to element maybe?

};


const x = (strings, ...data)=>{
	const blueprintId = Utils.hash(strings.join(''));
	if(!Library[blueprintId]){
		console.log(blueprintId)
		Library[blueprintId] = Parser(strings);
	}
	console.log('LIB', Library)
	return {
		//...Library[blueprintId],
		isBP : true,
		type: 'bp',
		id : blueprintId,
		bp_id : blueprintId,
		data
	}
};

const draw = ($target, {slots, html, data, node})=>{
	//const el = str2Dom(html);
	console.log('DRAW', html, node, slots)
	const el = node.cloneNode(true);
	$target.replaceWith(el);
	return el;
};


// Rename
const surgicalUpdate = ($target, slot, val)=>{ //might split slot to path and attr
	console.log($target, slot.path)
	const $el = slot.path.reduce(($el, i)=>$el.childNodes[i], $target);
	console.log('update', $el, slot.attr, val)
	if(typeof val === 'boolean'){
		$el.toggleAttribute(slot.attr, val);
	}else{
		$el[slot.attr] = val;
	}
};




const xo = {

	//TODO: this should eventually return the tree
	render : ($target, obj, tree)=>{
		tree = tree || {};
		render($target, obj, tree);
		return tree;
	},

	comp : (func, id)=>{
		return (...args)=>{
			return {
				isComp : true, //TODO: make into a symbol
				type: 'comp',
				id : Utils.hash(func.toString()),
				args,
				func
			}
		}

	},

	keymap : (arr, fn)=>Object.fromEntries(arr.map(fn)),
}

