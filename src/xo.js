const isObj = (obj)=>!!obj && (typeof obj == 'object' && obj.constructor == Object);
const isList = (obj)=>!!obj && (Array.isArray(obj) || isObj(obj));
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
	if(!type) type = getType(obj);  //might remove
	if(type=='bp' || type=='comp') return obj.key;
	if(type=='list') return true;//Object.keys(obj).join('|');
	return true;
};

const types = {
	bp : {
		mount : (obj, node)=>{
			//console.log('mount bp', obj)
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
			//console.log('renering bp', obj)
			obj.data.map((val, idx)=>{
				node.children[idx] = render(val, node.children[idx])
			});
			return node;
		},
	},
	comp : {
		mount : (obj, node)=>{
			//console.log('mount comp', obj)
			node = {
				type : 'comp', key : obj.key,
				effects : [], states : [], refs : {},
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
			//console.log('rendering comp', obj)
			node.child = render(types.comp.execute(obj, node), node.child);
			node.el = node.child.el;
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
			//console.log('mount list')
			node.el.innerHTML = '';
			node = {
				el : node.el,
				key : true,
				type : 'list',
				children : {},
			}
			return node;
		},
		unmount : (node)=>{
			//console.log('unmount list')
			//console.log(node)
			Object.values(node.children).map(unmount);
			node = {el:node.el, attr:node.attr};
			return node;
		},
		render : (obj, node)=>{
			//console.log('render list')

			//remove old first
			Object.keys(node.children)
				.filter(k=>typeof obj[k]==='undefined')
				.map(key=>{
					//console.log('removing', key);
					unmount(node.children[key]);
					node.children[key].el.remove();
					delete node.children[key];
				})

			const nodes = Object.entries(obj).map(([key, val])=>{
				if(!node.children[key]){
					//console.log('adding', key)
					node.children[key] = mount(val, {el : document.createElement('slot')});
				}
				//console.log('rendering', key)
				node.children[key] = render(val, node.children[key]);

				//console.log('___________')
				return node.children[key].el;
			});

			nodes.map(n=>node.el.appendChild(n));


			//console.log(node.el)




			/*
				get list of add and remove
				//apply it
				sort the list now?

				Figure out if we need to re-arrange element in dom

			*/
			return node;

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

		//Mutate the node here with el and attr? naah
		node = types[type].mount(obj, node);
	}
	node = types[type].render(obj, node);
	return node;
};

const unmount = (node)=>{
	//console.log('UNMOUNT', node, getType(node))
	node = types[node.type].unmount(node);
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
	cx : (...args)=>{
		return args.map((arg)=>{
			if(Array.isArray(arg)) return xo.cx(...arg);
			if(isObj(arg)) return Object.entries(arg).filter(([k,v])=>!!v).map(([k,v])=>k).join(' ');
			return arg
		}).join(' ');
	}
}