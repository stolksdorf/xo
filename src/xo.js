const isObj = (obj)=>!!obj && (typeof obj == 'object' && obj.constructor == Object);
const isList = (obj)=>!!obj && (Array.isArray(obj) || isObj(obj));
const isNone = (obj)=>typeof obj=='undefined'||obj===null;
const exe = (obj,...args)=>typeof obj === 'function' ? obj(...args) : obj;
const undef = (obj)=>typeof obj === 'undefined';

const hash = (str)=>[...str].reduce((acc, char)=>{acc = ((acc<<5)-acc)+char.charCodeAt(0);return acc&acc; }, 0).toString(32);


const isSame = (a,b)=>{
	//TODO: this used to contain more intersting comparison logic, especially for functions
	// Leaving it as a function to revisit later
	return a===b;
};
const isListSame = (a,b)=>{
	if(!isList(a)||!isList(b)) return false;
	const A = Object.keys(a), B = Object.keys(b);
	if(A.length !== B.length) return false;
	return A.every(k=>isSame(a[k], b[k]));
};


Library = (window || {}).Library || {};

const dp = new DOMParser();
const PH = String.fromCharCode(7);

const str2Dom = (str)=>dp.parseFromString(str, 'text/html').querySelector('body').children[0];
const weave = (arr, func)=>{
	return arr.reduce((acc, val, idx)=>{
		return (idx < arr.length-1) ? acc.concat(val, func(acc.length + 1)) : acc.concat(val)
	},[])
};
const createSlot = ()=>{
	const temp = document.createElement('slot'); //flip back to 'slot'
	temp.innerHTML = PH;
	return temp;
};

const Parser = (htmlStrings)=>{
	let dom = str2Dom(htmlStrings.join(PH)), slots = [];
	const insertSlots = (el, onlyChild)=>{
		const containsPlaceholder = el.nodeName == "#text" && el.nodeValue.indexOf(PH) !== -1;
		const isOnlyPlaceholder = onlyChild && el.nodeValue.trim()===PH;
		if(containsPlaceholder && !isOnlyPlaceholder){
			el.replaceWith(...weave(el.nodeValue.split(PH), createSlot));
		}
		if(el.childNodes) Array.from(el.childNodes).map(cn=>insertSlots(cn, el.childNodes.length==1));
	};
	const parseElement = (el, path=[])=>{
		if(el.nodeName == "#text" && el.nodeValue.trim() === PH){
			slots.push({ attr : 'innerHTML', path : path.slice(0,-1) });
			el.nodeValue='';
		}
		Array.from(el.attributes||[])
			.map(({name, value})=>{
				if(value.indexOf(PH) == -1) return;
				if(value !== PH) throw `Element attribute '${name}' is overloaded`;
				slots.push({ path, attr: name });
				el.removeAttribute(name);
			});
		Array.from(el.childNodes||[])
			.map((child, idx)=>parseElement(child, path.concat(idx)))
	}
	insertSlots(dom);
	parseElement(dom);
	return { slots, dom };
};

const extract = (el, path)=>path.reduce((e,i)=>e.childNodes[i],el);
const draw = (el, node)=>{
	const temp = node.cloneNode(true);
	el.replaceWith(temp);
	return temp;
};
const update = (el, attr='innerHTML', val)=>{
	if(attr=='innerHTML'){
		el.innerHTML = (!val&&val!==0) ? '' : val;
	}else if(attr=='class'){
		el.classList = val
	}else{
		if(typeof val === 'boolean'){
			el.toggleAttribute(attr, val)
		}else{
			el[attr] = val;
		}
	}
	return el;
};
window.x = (strings, ...data)=>{
	const key = hash(strings.join(PH));
	if(!Library[key]) Library[key] = Parser(strings);
	return { type: 'bp', data, key,
		id : key,
	 }
};











const TYPE = Symbol();
const KEY = Symbol();

const getType = (obj)=>{
	if(!obj) return 'data';
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
			const bp = Library[obj.key], el = draw(node.el, bp.dom);
			node = {
				type: 'bp', key : obj.key,
				el,
				children: obj.data.map((datum, idx)=>{
					const {path, attr}=bp.slots[idx];
					return { el : extract(el, path), attr };
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
			node.child = render(types.comp.execute(obj, node), node.child);
			node.el = node.child.el;

			node.effects.map((eff, idx)=>{
				if(eff.flag){
					node.effects[idx].flag = false;
					node.effects[idx].cleanup = eff.func();
				}
			})

			return node;
		},
		//could move out
		execute : (obj, node)=>{
			let stateCounter=0,effectCounter=0;
			// const scope = {
			// 	refs : node.refs,
			// 	useState : (init)=>{
			// 		let idx = stateCounter++;
			// 		if(undef(node.states[idx])) node.states[idx] = exe(init);
			// 		return [node.states[idx], (val)=>{
			// 			node.states[idx] = val;
			// 			//scope.forceRender();
			// 			node.args = undefined;
			// 			node = render(obj, node);
			// 		}];
			// 	},
			// 	//CLEANUP
			// 	useEffect:(func, args)=>{
			// 		let idx = effectCounter++;
			// 		if(!node.effects[idx]){
			// 			node.effects[idx] = {
			// 				args, func,
			// 				cleanup:null,
			// 				flag : true,
			// 			};
			// 		}
			// 		//if(!node.effects[idx]){
			// 		//	node.effects[idx] = { args, cleanup : func() }
			// 		//}else if(!isListSame(args, node.effects[idx].args)){
			// 		if(!isListSame(args, node.effects[idx].args)){
			// 			exe(node.effects[idx].cleanup);
			// 			node.effects[idx].flag = true;
			// 		}
			// 	},
			// 	forceRender : ()=>{
			// 		node.args = undefined;
			// 		node = render(obj, node);
			// 	},
			// 	el : node.el
			// };


			node.useState = (init)=>{
					let idx = stateCounter++;
					if(undef(node.states[idx])) node.states[idx] = exe(init);
					return [node.states[idx], (val)=>{
						node.states[idx] = val;
						//scope.forceRender();
						node.args = undefined;
						node = render(obj, node);
					}];
				};
			node.useEffect=(func, args)=>{
					let idx = effectCounter++;
					if(!node.effects[idx]){
						node.effects[idx] = {
							args, func,
							cleanup:null,
							flag : true,
						};
					}
					//if(!node.effects[idx]){
					//	node.effects[idx] = { args, cleanup : func() }
					//}else if(!isListSame(args, node.effects[idx].args)){
					if(!isListSame(args, node.effects[idx].args)){
						exe(node.effects[idx].cleanup);
						node.effects[idx].flag = true;
					}
				}
			node.forceRender = ()=>{
					node.args = undefined;
					node = render(obj, node);
				}


			return obj.func.apply(node, obj.args);
		}
	},
	list : {
		mount : (obj, node)=>{
			node.el.innerHTML = '';
			node = {
				el : node.el, key : true,
				type : 'list',
				children : {},
			}
			return node;
		},
		unmount : (node)=>{
			Object.values(node.children).map(unmount);
			node = {el:node.el, attr:node.attr};
			return node;
		},
		render : (obj, node)=>{
			Object.keys(node.children)
				.filter(k=>undef(obj[k]))
				.map(key=>{
					unmount(node.children[key]);
					node.children[key].el.remove();
					delete node.children[key];
				})
			const nodes = Object.entries(obj).map(([key, val])=>{
				if(undef(node.children[key])){
					node.children[key] = mount(val, {el : document.createElement('slot')});
				}
				node.children[key] = render(val, node.children[key]);
				return node.children[key].el;
			});
			nodes.map(n=>node.el.appendChild(n)); //bump into loop above
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

xo = {
	render : (targetEl, obj, tree)=>render(obj, tree || { el : targetEl }),
	x : window.x,
	comp : (func)=>{
		const key = hash(func.toString());
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
};

const isServerSide = typeof window === 'undefined';
if(isServerSide){
	xo.x = (strings, ...data)=>{return {type:'bp', strings, data}};
	xo.render = (obj)=>{
		if(obj && obj.type=='bp') return obj.strings.reduce((acc,str,idx)=>acc+str+xo.render(obj.data[idx]||''),'');
		if(isList(obj)) return Object.values(obj).map(xo.render).join('\n');
		if(typeof obj == 'function') return '';
		return obj;
	};
	xo.comp = (func)=>{
		return func.bind({
			useState : (init)=>{return [init,()=>{}]},
			useEffect :(func)=>func(), //maybe no-op, double check react docs on useEffect on serverside render
			forceRender : ()=>{}
		})
	}
}

if(typeof module !== 'undefined') module.exports = xo;