DEBUG = false;
const log = DEBUG ? console.log : ()=>{};

const isObj = (obj)=>!!obj && (typeof obj == 'object' && obj.constructor == Object);
const isList = (obj)=>Array.isArray(obj) || isObj(obj);
const exe = (obj,...args)=>typeof obj === 'function' ? obj(...args) : obj;
const undef = (obj)=>typeof obj === 'undefined';
const hash = (str)=>[...str].reduce((acc, char)=>{acc = ((acc<<5)-acc)+char.charCodeAt(0);return acc&acc; }, 0).toString(32);

const isListSame = (a,b)=>{
	if(a===b) return true;
	if(!isList(a)||!isList(b)) return false;
	const A = Object.keys(a), B = Object.keys(b);
	if(A.length !== B.length) return false;
	return A.every(k=>a[k]===b[k]);
};
const weave = (arr, func)=>{
	let res = [];
	arr.map((val, idx)=>{
		if(!!val) res.push(val);
		if(idx != arr.length-1) res.push(func());
	})
	return res;
};

const isServerSide = typeof window === 'undefined';

Archive = (isServerSide ? global : window).Archive || {};

const DP = (typeof DOMParser !== 'undefined') ? new DOMParser() : null;
const PH = String.fromCharCode(7);
//const PH = '___';

let xo = {};

xo.parser = (htmlStrings, id)=>{
	const body = DP.parseFromString(htmlStrings.join(PH), 'text/html').body;
	if(body.children.length > 1) throw 'Multiple top level elements were returned in blueprint';
	let dom = body.children[0], slots = [];
	const insertSlots = (el, isOnlyChild)=>{
		const containsPlaceholder = el.nodeName == "#text" && el.nodeValue.indexOf(PH) !== -1;
		if(containsPlaceholder){
			el.replaceWith(...weave(el.nodeValue.trim().split(PH), xo.parser.createPlaceholder));
		}
		Array.from(el.childNodes||[]).map(cn=>insertSlots(cn, el.childNodes.length==1));
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
	return { slots, dom  };
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
xo.parser.createPlaceholder = ()=>{
	const slot = document.createElement('slot');
	slot.innerHTML = PH;
	return slot;
};

///////////////////

xo.x = (strings, ...data)=>{
	const key = hash(strings.join(PH));
	if(!Archive[key]){
		Archive[key] = xo.parser(strings, key);
		if(Archive[key].slots.length !== data.length) throw `Blueprint ${key} has mismatch between data and slots. Probably an HTML issue`;
	}
	return { type: 'bp', data, key, ...Archive[key] };
};
xo.comp = (func)=>{
	const key = hash(func.toString());
	return (...args)=>{ return { type: 'comp', func, args, key }};
};

const getType = (obj)=>{
	if(!obj) return 'data';
	if(obj.type=='bp'||obj.type=='comp') return obj.type;
	if(isList(obj)) return 'list';
	return 'data';
};

const runComponent = (comp, node)=>{
	let stateCounter=0,effectCounter=0;
	node.useState = (init)=>{
		let idx = stateCounter++;
		if(undef(node.states[idx])) node.states[idx] = exe(init);
		return [node.states[idx], (val)=>{
			if(node.states[idx] === val) return;
			node.states[idx] = val;
			node.args = undefined;
			if(!node.throttle){
				node.throttle = setTimeout(()=>{
					node = render(comp, node);
				},0)
			}
		}];
	};
	node.useEffect=(func, args)=>{
		let idx = effectCounter++;
		if(!node.effects[idx]) node.effects[idx] = {};
		if(!isListSame(args, node.effects[idx].args)){
			exe(node.effects[idx].cleanup);
			node.effects[idx] = { func, args, flag : true };
		}
	}
	return comp.func.apply(node, comp.args);
};

const mount = (obj, node)=>{
	const type = getType(obj);
	node = { type, el : node.el, attr : node.attr||'content'};
	if(obj && obj.key) node.key = obj.key;

	log(`mounting: ${type}`, obj, node)

	if(type == 'bp'){
		node.el = xo.parser.replace(node.el, obj.dom);
		node.children = obj.slots.map(({path, attr})=>{
			log(path, attr);
			log(node.el, xo.parser.extract(node.el, path))
			return { el : xo.parser.extract(node.el, path), attr };
		});
	}
	if(type =='comp'){
		node.effects = []; node.states = []; node.refs = {};
		node.args = undefined;
		node.children = [{el : node.el}];
	}
	if(type=='list'){
		const onlyChildIsSlot = node.el.parentElement.childNodes.length == 1
		if(onlyChildIsSlot){
			node.MUST_REPLACE = true;
			node.el = node.el.parentElement;
			node.el.innerHTML = '';
		}else{
			node.el = xo.parser.replace(node.el, document.createElement('slot'));
		}
		node.children = {};
	}
	if(type=='data'){
		node.val = undefined;
		if(node.attr == 'content'){
			node.el = xo.parser.replace(node.el, document.createTextNode(''));
		}
	}
	return node;
};


const unmount = (node)=>{
	if(!node.type) return node;
	if(node.effects) node.effects.map(({cleanup})=>exe(cleanup));
	if(node.children) Object.values(node.children).map(unmount);

	//TOD: possible re-think
	//if(node.type == 'bp') node.el = xo.parser.replace(node.el, document.createElement('slot'));
	return {el:node.el, attr:node.attr};
};


const render = (obj, node)=>{
	const type = getType(obj);
	if(type !== node.type) node = mount(obj, unmount(node));

	if(type=='data'){
		if(obj !== node.val){
			node.el = xo.parser.update(node.el, node.attr, obj);
			node.val = obj;
		}
	}
	if(type == 'bp'){
		if(obj.key !== node.key) node = mount(obj, unmount(node));
		obj.data.map((val, idx)=>{
			node.children[idx] = render(val, node.children[idx]);
		});
	}
	if(type =='comp'){
		if(obj.key !== node.key) node = mount(obj, unmount(node));
		if(isListSame(obj.args, node.args)) return node;

		node.throttle = false;
		node.args = obj.args;
		node.children[0] = render(runComponent(obj, node), node.children[0]);
		node.el = node.children[0].el;

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
	return node;
};

xo.render = (targetEl, obj, tree)=>render(obj, tree || { el : targetEl, attr: 'content' });

/* Utils */

xo.cx = (...args)=>{
	return args.map((arg)=>{
		if(Array.isArray(arg)) return xo.cx(...arg);
		if(isObj(arg)) return Object.entries(arg).filter(([k,v])=>!!v).map(([k,v])=>k).join(' ');
		return arg;
	}).join(' ');
};

xo.keymap = (arr, fn)=>Object.fromEntries(Object.entries(arr).map(([k,v])=>fn(v,k)));


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