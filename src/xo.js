const isObj = (obj)=>!!obj && (typeof obj == 'object' && obj.constructor == Object);
const isList = (obj)=>!!obj && (Array.isArray(obj) || isObj(obj));
const isNone = (obj)=>typeof obj=='undefined'||obj===null;
const exe = (obj,...args)=>typeof obj === 'function' ? obj(...args) : obj;
const undef = (obj)=>typeof obj === 'undefined';

const isServerSide = typeof window === 'undefined';

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


Library = (isServerSide ? global : window).Library || {};

let dp
const PH = String.fromCharCode(7);

const str2Dom = (str)=>{
	if(!dp) dp = new DOMParser();
	//return dp.parseFromString(str, 'text/html').querySelector('body').children[0];
	const body = dp.parseFromString(str, 'text/html').querySelector('body')
	if(body.children.length > 1) throw 'Multiple top level elements were returned in blueprint';
	return body.children[0];
}
const weave = (arr, func)=>{
	return arr.reduce((acc, val, idx)=>{
		return (idx < arr.length-1) ? acc.concat(val, func(acc.length + 1)) : acc.concat(val)
	},[])
};
const createSlot = ()=>{
	const temp = document.createElement('slot');
	temp.innerHTML = PH;
	return temp;
};

const Parser = (htmlStrings)=>{
	let dom = str2Dom(htmlStrings.join(PH)), slots = [];
	//TODO: remove only child check, don't need it any more
	const insertSlots = (el, onlyChild)=>{
		const containsPlaceholder = el.nodeName == "#text" && el.nodeValue.indexOf(PH) !== -1;
		//const isOnlyPlaceholder = onlyChild && el.nodeValue.trim()===PH;
		const isOnlyPlaceholder = false;
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
	console.log('drawing', node)
	const temp = node.cloneNode(true);
	el.replaceWith(temp);
	return temp;
};
const update = (el, attr='innerHTML', val)=>{
	console.log('update', el, attr, val)
	if(attr=='innerHTML'){
		console.log('HJERE')
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



/* ------------------------------------------------------------------- */





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
			console.log('here')
			node.children.map(unmount);
			node = {el:node.el, attr:node.attr};
			node.el = draw(node.el, document.createElement('slot'));
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
			console.log('mounting', obj, node)
			node = {
				type : 'comp', key : obj.key,
				effects : [], states : [], refs : {},
				args : undefined,
				child : { el : node.el },
				el : node.el,



				func : obj.func
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
					//WARNING: effect args are not being set?
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
						if(node.states[idx] === val) return;
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
			console.log('list mount')
			node.el.innerHTML = '';
			node = {
				el : node.el, key : true,
				type : 'list',
				children : {},
			}
			return node;
		},
		unmount : (node)=>{
			console.log('list unmount')
			Object.values(node.children).map(unmount);
			node = {el:node.el, attr:node.attr};
			return node;
		},

		render : (obj, node)=>{
			// console.log('HERE1', Object.entries(node.children));


			// const old = Object.entries(node.children);
			// const fresh = Object.entries(obj);

			// console.log('old', old);
			// console.log('fresh', fresh)


			const sameKeys = Object.entries(node.children).reduce((acc, [key, child])=>{
				if(undef(obj[key])){ //Does not exist in the new list
					unmount(child);
					child.el.remove();
					delete node.children[key];
					console.log('removing', key)
				}else{
					acc.push(key)
				}
				return acc;
			}, []);

			console.log('SAME KEYS', sameKeys);

			console.log('HERE2', Object.entries(node.children));

			let newList = {}
			Object.entries(obj).map(([key, val], idx)=>{
				if(undef(node.children[key])){
					newList[key] = mount(val, {el : document.createElement('li')}); //Switch back to slot
					newList[key] = render(val, newList[key]);
				}else{
					newList[key] = render(val, node.children[key]);
				}


				const sameElement = node.el.childNodes[idx] == newList[key].el;

				if(!sameElement){
					console.log('not same', key, newList[key]);

					console.log('inserting', newList[key].el, node.el.childNodes[idx+1] || null)

					node.el.insertBefore(newList[key].el, node.el.childNodes[idx+1] || null);
				}else{
					console.log('same elements!')
				}
			});

			// console.log('newList', newList);

			// Object.entries(newList).map(([key, val], idx)=>{
			// 	console.log('HERE', node.el.childNodes)

			// 	const sameElement = node.el.childNodes[idx] == val.el;

			// 	if(!sameElement){
			// 		console.log('not same', key, val);

			// 		console.log('inserting', val.el, node.el.childNodes[idx+1] || null)
			// 		console.log('CHECK', node.el.insertBefore(val.el, node.el.childNodes[idx+1] || null));
			// 	}else{
			// 		console.log('same elements!')
			// 	}
			// 	//newList[key] = render(val, newList[key]);
			// });

			console.log(newList)

			node.children = newList;


			/*
				Loop thorugh and add missing elements
				build the new resulting list


				loop through new list with idx
				check for el equivency with the actual child nodes
				=if diff, insertBefore

			*/



			/*
				- Loop through fresh (idx)
				- I want to add a new element
				- I need to find where it's sibling is
				- so I request it from find_sibling(idx+1)
					- find_sibling looks into fresh at given idx
						- if doesn't exist return null
					- sees if it's key exists in old
					- if not
						- create a new element, mount it, and use insertBefore using it's sibling (call find_sibling(idx+1))
						- add to result
					- if yes
						- does it have the same idx as the fresh idx?
						- if yes
							- return

					- if so returns it's corresponding element


			*/


/*

			let result = {};

			fresh.map(([key, val], idx)=>{

				const isNewElement = !node.children[key];

				if(isNewElement){
					console.log('mount node')
					result[key] = mount(val, {el : document.createElement('slot')});

					let sibling = fresh[idx+1];
					if(sibling){
						const sib_key = sibling[0];
						const existing_sib = node.children[sib_key]

					}



					result[key] = render(val, result[key]);
				}else{
					console.log(key, val, node.children[key])

					result[key] = render(val, node.children[key]);
				}





				// if(key !== old_key){



				// 	result[key] = render(val, node.children[key]);

				// }

			})

			node.children = result;





			// const nodes = Object.entries(obj).map(([key, val])=>{
			// 	const old


			// //Move this process to mount
			// // create a key based on the keys used in the list
			// Object.keys(node.children)
			// 	.filter(k=>undef(obj[k]))
			// 	.map(key=>{
			// 		console.log('unmoutning this key', key)
			// 		unmount(node.children[key]);
			// 		node.children[key].el.remove();
			// 		delete node.children[key];
			// 	})



			/*
				convert both to entries lists
				loop through new, with idx
				check key on new with old of same idx
					if match, call render (or move on, we can render later)
					if not match
						if not in old
							mount new node
							insertBefore(new[idx+1]) // what if this doesn't exist in new node?!
						if in old



			*/


			// const nodes = Object.entries(obj).map(([key, val])=>{
			// 	console.log('nodes', key, val)

			// 	if(undef(node.children[key])){
			// 		console.log('mount node')
			// 		node.children[key] = mount(val, {el : document.createElement('slot')});
			// 	}
			// 	node.children[key] = render(val, node.children[key]);
			// 	return node.children[key].el;
			// });

			// //FIXME: THIS IS BAD DON"T BLINDING RE APPEND
			// nodes.map(n=>node.el.appendChild(n)); //bump into loop above
			return node;
		},
	},
	data : {
		mount : (obj, node)=>{
			node = {
				type : 'data', key : true,
				el   : node.el, attr : node.attr,
				val  : Symbol()
			};

			//nested bug fix?
			if(node.attr == 'innerHTML' || undef(node.attr)){
				console.log('draw hit')
				node.el = draw(node.el, document.createTextNode(''));
				node.attr = 'textContent';
			}
			node.key = node.attr;
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
	//console.log('render', obj, node)
	const type = getType(obj), key = getKey(obj);

	// console.log({
	// 	type, key, node
	// })

	if(type !== node.type || key !== node.key){
		console.log('unmounting', node.type)
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
	x : (strings, ...data)=>{
		const key = hash(strings.join(PH));
		if(!Library[key]) Library[key] = Parser(strings);
		return { type: 'bp', data, key,
			id : key,
		 }
	},
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
			useEffect :(func)=>null, //maybe no-op, double check react docs on useEffect on serverside render
			forceRender : ()=>{}
		})
	}
}

if(typeof module !== 'undefined') module.exports = xo;