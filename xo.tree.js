const isObj = (obj)=>!!obj && (typeof obj == 'object' && obj.constructor == Object);
const isList = (obj)=>Array.isArray(obj) || isObj(obj);
const exe = (obj,...args)=>typeof obj === 'function' ? obj(...args) : obj;


const isNone = (obj)=>typeof obj=='undefined'||obj===null; //Remove


////////////


DEBUG = false;


const undef = (obj)=>typeof obj === 'undefined';
const hash = (str)=>[...str].reduce((acc, char)=>{acc = ((acc<<5)-acc)+char.charCodeAt(0);return acc&acc; }, 0).toString(32);

const newId = ()=>Math.random().toString(32).substr(2);
//const newId = ()=>new Symbol();

let xo = {};

const isServerSide = typeof window === 'undefined';



const log = DEBUG ? console.log : ()=>{};


const isListSame = (a,b)=>{
	if(a===b) return true;
	if(!isList(a)||!isList(b)) return false;
	const A = Object.keys(a), B = Object.keys(b);
	if(A.length !== B.length) return false;
	return A.every(k=>a[k]===b[k]);
};


/////////////////////////

Archive = (isServerSide ? global : window).Archive || {};


const DP = (typeof DOMParser !== 'undefined') ? new DOMParser() : null;
const PH = String.fromCharCode(7);

const weave = (arr, func)=>{
	let res = [];
	arr.map((val, idx)=>{
		if(!!val) res.push(val);
		if(idx != arr.length-1) res.push(func());
	})
	return res;
};

xo.parser = (htmlStrings, id)=>{
	const body = DP.parseFromString(htmlStrings.join(PH), 'text/html').body;
	if(body.children.length > 1) throw 'Multiple top level elements were returned in blueprint';
	let dom = body.children[0], slots = [];
	const insertSlots = (el, isOnlyChild)=>{
		const containsPlaceholder = el.nodeName == "#text" && el.nodeValue.indexOf(PH) !== -1;
		if(containsPlaceholder){
			el.replaceWith(...weave(el.nodeValue.trim().split(PH), xo.parser.createSlot));
		}
		if(el.childNodes) Array.from(el.childNodes).map(cn=>insertSlots(cn, el.childNodes.length==1));
	};
	const parseElement = (el, path=[])=>{
		if(el.nodeName == "#text" && el.nodeValue.trim() === PH){
			slots.push({ attr : 'content', path : path.slice(0,-1) });
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
			.map((child, idx)=>parseElement(child, path.concat(idx)));
	};
	insertSlots(dom);
	parseElement(dom);
	if(id && DEBUG) dom.setAttribute('data-xo', id);
	return {
		slots,
		dom
	};
};

xo.parser.extract = (targetEl, path)=>path.reduce((el, idx)=>el.childNodes[idx], targetEl);
xo.parser.replace = (targetEl, node)=>{
	const newNode = node.cloneNode(true);
	targetEl.replaceWith(newNode);
	return newNode;
};
xo.parser.update = (targetEl, attr, data)=>{
	if(attr=='content'){
		if(targetEl.nodeName == '#text'){
			targetEl.nodeValue = (!data&&data!==0) ? '' : data;
		}else{
			targetEl.innerHTML = (!data&&data!==0) ? '' : data;
		}
	}else if(attr=='class'){
		targetEl.classList = data;
	}else if(typeof data === 'boolean'){
		targetEl.toggleAttribute(attr, data);
	}else{
		targetEl[attr] = data;
	}
	return targetEl;
};
xo.parser.createSlot = ()=>{
	const slot = document.createElement('slot');
	slot.innerHTML = PH;
	return slot;
};

xo.x = (strings, ...data)=>{
	const key = hash(strings.join(PH));
	if(!Archive[key]) Archive[key] = xo.parser(strings, key);
	return { type: 'bp', data, key, ...Archive[key] };
};
xo.comp = (func)=>{
	const key = hash(func.toString());
	return (...args)=>{ return { type: 'comp', func, args, key }};
};





//////////////////////////////////////////////////////////////////////////////


const getType = (obj)=>{
	if(!obj) return 'data';
	if(obj.type=='bp'||obj.type=='comp') return obj.type;
	if(isList(obj)) return 'list';
	return 'data';
};





// const mount_old = (obj, node)=>{
// 	const type = getType(obj);
// 	const id = newId();
// 	tree[id] = { type, el : node.el, attr : node.attr||'content'};
// 	if(obj && obj.key) node.key = obj.key;

// 	log(`mounting: ${type}`, obj, node)

// 	if(type == 'bp'){
// 		node.el = xo.parser.replace(node.el, obj.dom);
// 		node.children = obj.slots.map(({path, attr})=>{
// 			log(path, attr);
// 			log(node.el, xo.parser.extract(node.el, path))
// 			return { el : xo.parser.extract(node.el, path), attr };
// 		});
// 	}
// 	if(type =='comp'){
// 		node.effects = []; node.states = []; node.refs = {};
// 		node.args = undefined;
// 		node.children = [{el : node.el}];
// 	}
// 	if(type=='list'){
// 		const onlyChildIsSlot = node.el.parentElement.childNodes.length == 1
// 		if(onlyChildIsSlot){
// 			node.MUST_REPLACE = true;
// 			node.el = node.el.parentElement;
// 			node.el.innerHTML = '';
// 		}else{
// 			node.el = xo.parser.replace(node.el, document.createElement('slot'));
// 		}
// 		node.children = {};
// 	}
// 	if(type=='data'){
// 		node.val = undefined;
// 		if(node.attr == 'content'){
// 			node.el = xo.parser.replace(node.el, document.createTextNode(''));
// 		}
// 	}
// 	return node;
// };



// const unmount_old = (node)=>{
// 	if(!node.type) return node;
// 	if(node.effects) node.effects.map(({cleanup})=>exe(cleanup));
// 	if(node.children) Object.values(node.children).map(unmount);

// 	//TOD: possible re-think
// 	//if(node.type == 'bp') node.el = xo.parser.replace(node.el, document.createElement('slot'));
// 	return {el:node.el, attr:node.attr};
// };






xo.render = (targetEl, obj, tree)=>{

	if(!tree){
		console.log('creating tree')
		tree = {
			___root___ : { el : targetEl, attr : 'content' }
		}
	}

	console.log(tree)


	//arg    : obj, dom, parentId?
	//return : id
	const mount = (obj, {el, attr})=>{
		const type = getType(obj);
		const id = newId();

		tree[id] = { type, el, attr, id };
		if(obj && obj.key) tree[id].key = obj.key;


		if(type == 'bp'){
			tree[id].el = xo.parser.replace(tree[id].el, obj.dom);
			tree[id].children = obj.slots.map(({path, attr})=>{

				const _id = newId();
				tree[_id] = { el : xo.parser.extract(tree[id].el, path), attr };

				//log(path, attr);
				//log(tree[id].el, xo.parser.extract(tree[id].el, path))
			return _id;
			});
		}
		if(type =='comp'){
			tree[id].effects = []; tree[id].states = [];
			tree[id].refs = {};
			tree[id].args = undefined;
			tree[id].func = obj.func;


			const _id = newId();


			tree[id].children = [_id];
			tree[_id] = {el : tree[id].el};


			tree[id].useState = (init)=>{
				let idx = tree[id].states.counter++;
				if(undef(tree[id].states[idx])) tree[id].states[idx] = exe(init);
				return [tree[id].states[idx], (val)=>{

					console.log('running on', id)
					console.log(tree)
					if(tree[id].states[idx] === val) return;
					tree[id].states[idx] = val;
					tree[id].args = undefined;
					render(obj, id);
				}];
			};
			tree[id].useEffect=(func, args)=>{
				let idx = tree[id].effects.counter++;
				if(undef(tree[id].effects[idx])){
					tree[id].effects[idx] = { args, func, cleanup:null, flag:true };
				}
				if(!isListSame(args, tree[id].effects[idx].args)){
					exe(tree[id].effects[idx].cleanup);
					tree[id].effects[idx].flag = true;
				}
			}
		}
		if(type=='list'){
			const onlyChildIsSlot = tree[id].el.parentElement.childNodes.length == 1
			if(onlyChildIsSlot){
				tree[id].MUST_REPLACE = true;
				tree[id].el = tree[id].el.parentElement;
				tree[id].el.innerHTML = '';
			}else{
				tree[id].el = xo.parser.replace(tree[id].el, document.createElement('slot'));
			}
			tree[id].children = {};
		}
		if(type=='data'){
			tree[id].val = undefined;
			if(tree[id].attr == 'content'){
				tree[id].el = xo.parser.replace(tree[id].el, document.createTextNode(''));
			}
		}
		return tree[id];
	};

	//arg    : id
	//return : dom
	const unmount = (id)=>{
		if(!tree[id]){
			console.log('CAUGHT HERE', id, tree)
		}
		const {el, attr} = tree[id];
		//if(!tree[id].type) return {el, attr};


		if(tree[id].effects) tree[id].effects.map(({cleanup})=>exe(cleanup));
		if(tree[id].children) Object.values(tree[id].children).map(unmount);

		//TOD: possible re-think
		//if(node.type == 'bp') node.el = xo.parser.replace(node.el, document.createElement('slot'));

		console.log('deleteing id', id)
		delete tree[id];
		return {el, attr};
	};

	//arg:    obj, id
	//return: ???, null
	const render = (obj, id)=>{
		const type = getType(obj);
		let node = tree[id];




		if(type !== node.type) node = mount(obj, unmount(id));

		if(type=='data'){
			if(obj !== node.val){
				node.el = xo.parser.update(node.el, node.attr, obj);
				node.val = obj;
			}
		}
		if(type == 'bp'){
			if(obj.key !== node.key){
				node = mount(obj, unmount(id));
			}
			obj.data.map((val, idx)=>{

				node.children[idx] = render(val, node.children[idx]);
			});
		}
		if(type =='comp'){
			if(obj.key !== node.key) node = mount(obj, unmount(id));
			if(isListSame(obj.args, node.args)) return node;

			node.args = obj.args;

			console.log(node)

			node.states.counter=0;
			node.effects.counter=0;
			const newObj = node.func.apply(node, node.args);
			render(newObj, node.children[0]);

			node.el = tree[node.children[0]].el;

			node.effects.map((eff, idx)=>{
				if(eff.flag){
					node.effects[idx].flag = false;
					node.effects[idx].cleanup = eff.func();
				}
			});
		}
		if(type=='list'){
			Object.keys(node.children).map(key=>{
				if(!undef(obj[key])) return;
				unmount(node.children[key]);
				node.children[key].el.remove();
				Array.isArray(node.children) ? node.children.splice(key, 1) : delete node.children[key];
			});

			const newItems = Object.entries(obj);
			newItems.map((_item, _idx)=>{
				const reverse_idx = newItems.length - _idx - 1;
				const [key, val] = newItems[reverse_idx];

				const baseItem = node.children[key] || mount(val, {el : document.createElement('slot')});

				obj[key] = render(val, baseItem);

				if(node.el.childNodes[reverse_idx] !== obj[key].el){
					const nextSibling = newItems[reverse_idx + 1];
					const targetEl = nextSibling ? obj[nextSibling[0]].el : null;
					node.el.insertBefore(obj[key].el, targetEl);
				}
			});
			node.children = obj;
		}

		tree[id] = node;

		return id;
	};



	// const execute = (comp, node)=>{
	// 	let stateCounter=0,effectCounter=0;
	// 	node.useState = (init)=>{
	// 		let idx = stateCounter++;
	// 		if(undef(node.states[idx])) node.states[idx] = exe(init);
	// 		return [node.states[idx], (val)=>{
	// 			if(node.states[idx] === val) return;
	// 			node.states[idx] = val;
	// 			node.args = undefined;
	// 			node = render(comp, node);
	// 		}];
	// 	};
	// 	node.useEffect=(func, args)=>{
	// 		let idx = effectCounter++;
	// 		if(!node.effects[idx]){
	// 			node.effects[idx] = {
	// 				args, func,
	// 				cleanup:null,
	// 				flag : true,
	// 			};
	// 		}
	// 		if(!isListSame(args, node.effects[idx].args)){
	// 			exe(node.effects[idx].cleanup);
	// 			node.effects[idx].flag = true;
	// 		}
	// 	}
	// 	return comp.func.apply(node, comp.args);
	// }


	const execute = (id)=>{
		const node = tree[id];
		node.states.counter=0;
		node.effects.counter=0;
		const newObj = node.func.apply(node, node.args);
		render(node.children[0], newObj);
	}

	// const execute = (id)=>{
	// 	let stateCounter=0,effectCounter=0;
	// 	tree[id].useState = (init)=>{
	// 		let idx = stateCounter++;
	// 		if(undef(tree[id].states[idx])) tree[id].states[idx] = exe(init);
	// 		return [tree[id].states[idx], (val)=>{
	// 			if(tree[id].states[idx] === val) return;
	// 			tree[id].states[idx] = val;
	// 			tree[id].args = undefined;
	// 			tree[id] = render(comp, tree[id]); //FIX
	// 		}];
	// 	};
	// 	tree[id].useEffect=(func, args)=>{
	// 		let idx = effectCounter++;
	// 		if(undef(tree[id].effects[idx])){
	// 			tree[id].effects[idx] = {
	// 				args, func,
	// 				cleanup:null,
	// 				flag : true,
	// 			};
	// 		}
	// 		if(!isListSame(args, tree[id].effects[idx].args)){
	// 			exe(tree[id].effects[idx].cleanup);
	// 			tree[id].effects[idx].flag = true;
	// 		}
	// 	}
	// 	return comp.func.apply(tree[id], comp.args);
	// }






	render(obj, '___root___');
	return tree;
	//render(obj, tree || { el : targetEl, attr: 'content' });
};


/* Utils */

xo.cx = (...args)=>{
	return args.map((arg)=>{
		if(Array.isArray(arg)) return xo.cx(...arg);
		if(isObj(arg)) return Object.entries(arg).filter(([k,v])=>!!v).map(([k,v])=>k).join(' ');
		return arg;
	}).join(' ');
};

xo.keymap = (arr, fn)=>Object.fromEntries(arr.map(fn));


if(isServerSide){
	xo.x = (strings, ...data)=>{return {type:'bp', strings, data}};
	xo.render = (obj)=>{
		if(obj && obj.type=='bp') return obj.strings.reduce((acc,str,idx)=>acc+str+xo.render(obj.data[idx]||''),'');
		if(isList(obj)) return Object.values(obj).map(xo.render).join('\n');
		if(typeof obj == 'function') return '';
		return obj;
	};
	xo.comp = (func)=>{ //FIXME: I don't think this works
		return func.bind({
			useState : (init)=>{return [init,()=>{}]},
			useEffect :(func)=>null,
			refs : {}
		})
	}
}


if(typeof window !== 'undefined') window.xo = xo;
if(typeof module !== 'undefined') module.exports = xo;