const isList = (obj)=>obj && (Array.isArray(obj) || (typeof obj == 'object' && obj.constructor == Object));
const isNone = (obj)=>typeof obj=='undefined'||obj===null||obj===false;

const isSame = (a,b)=>{
	//if(typeof a === 'undefined' || typeof b === 'undefined') return false;
	if(a === b) return true;
	if(typeof a !== typeof b) return false;
	//if(typeof a == 'function') return a.toString() == b.toString();
	return false;
};
const isListSame = (a,b)=>{
	if(!isList(a)||!isList(b)) return false;
	const A = Object.keys(a), B = Object.keys(b);
	if(A.length !== B.length) return false;
	return A.every(k=>isSame(a[k], b[k]));
};

const TYPE = Symbol();
const KEY = Symbol();

const getType = (obj)=>{
	if(obj.type=='bp'||obj.type=='comp') return obj.type;
	if(isList(obj)) return 'list';
	return 'data';
};
const getKey = (obj, type)=>{
	if(!type) type = getType(obj);
	if(type=='bp' || type=='comp') return obj.key;
	if(type=='list') return Object.keys(obj).join('|');
	return true;
};

const types = {
	bp : {
		mount : (obj, node)=>{
			const bp = Library[obj.key], el = draw(node.el, bp.dom);
			node = {
				type: 'bp', key : obj.key,
				el,
				children: obj.data.map((datum, idx)=>{
					const {path, attr}=bp.slots[idx];
					return { el : extract(el, path), attr }
				})
			};
			return node;
		},
		unmount : (node)=>{
			node.children.map(unmount);
			node = {el:node.el, attr:node.attr};
			return node;
		},
		render : (obj, node)=>{
			obj.data.map((val, idx)=>{
				node.children[idx] = render(val, node.children[idx])
			});
			return node;
		},
	},
	comp : {
		mount : (obj, node)=>{
			node = {
				type : 'comp', key : obj.key,
				effects : [], states : [],
				args : undefined,
				child : { el : node.el },
				el : node.el
			};
			return node;
		},
		unmount : (node)=>{
			node.effects.map(({cleanup})=>cleanup());
			node = unmount(node.child);
			node = {el:node.el, attr:node.attr};
			return node;
		},
		render : (obj, node)=>{
			if(isListSame(obj.args, node.args)) return node;
			node.args = obj.args;
			node.child = render(types.comp.execute(obj, node), node.child);
			return node;
		},
		execute : (obj, node)=>{
			let stateCounter=0,effectCounter=0;
			const scope = {
				useState : (init)=>{
					let idx = stateCounter++;
					if(typeof node.states[idx] === 'undefined') node.states[idx] = init;
					return [node.states[idx], (val)=>{
						node.states[idx] = val;
						scope.forceRender();
					}];
				},
				//CLEANUP
				useEffect:(func, args)=>{
					let idx = effectCounter++;
					if(!node.effects[idx]){
						node.effects[idx] = { args, cleanup : func() }
					}else if(!isListSame(args, node.effects[idx].args)){
						node.effects[idx].cleanup && node.effects[idx].cleanup();
						node.effects[idx] = { args, cleanup : func() }
					}
				},
				forceRender : ()=>{
					node.args = undefined;
					node = render(obj, node);
				},
				el : node.el
			};
			return obj.func.apply(scope, obj.args);
		}
	},
	//TODO
	list : {
		mount : (obj, node)=>{

		},
		unmount : (obj, node)=>{

		},
		render : (obj, node)=>{

		},
	},
	data : {
		mount : (obj, node)=>{
			node = {
				type : 'data', key : true,
				el   : node.el, attr : node.attr,
				val  : Symbol()
			}
			return node;
		},
		unmount : (node)=>node,
		render : (obj, node)=>{
			if(!isSame(obj, node.val)){
				node.el = update(node.el, node.attr, obj);
				node.val = obj;
			}
			return node;
		},
	}
};

const render = (obj, node)=>{
	const type = getType(obj), key = getKey(obj);
	if(type !== node.type || key !== node.key){
		node = types[node.type||'data'].unmount(node);
		node = types[type].mount(obj, node);
	}
	node = types[type].render(obj, node);
	return node;
};

const unmount = (node)=>{
	node = types[getType(node)].unmount(node);
	return node;
};
const mount = (obj, node)=>{
	node = types[getType(obj)].mount(obj, node);
	return node;
};

const xo = {
	render : (targetEl, obj, tree)=>render(obj, tree || { el : targetEl }),
	x,
	comp : (func)=>{
		const key = Utils.hash(func.toString());
		return (...args)=>{ return { type: 'comp', func, args, key }};
	},
	keymap : (arr, fn)=>Object.fromEntries(arr.map(fn)),
}