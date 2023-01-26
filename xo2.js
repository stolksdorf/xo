const undef = (val)=>typeof val==='undefined';
const exec = (val)=>typeof val==='function'?val():val;

const xo = {
	hash : (str)=>[...str].reduce((acc, char)=>{acc = ((acc<<5)-acc)+char.charCodeAt(0);return acc&acc; }, 0).toString(32),
	type : (obj,name)=>{
		if(name) return Object.defineProperty(obj, Symbol.for('type'), {value:name});
		return (obj && obj[Symbol.for('type')]) || typeof obj;
	},
	exec : (val)=>typeof val === 'function' ? val() : val,
	eq : (a,b)=>{
		if(a===b) return true;
		if(typeof a !== "object" || typeof b !== "object") return false;
		const A = Object.keys(a), B = Object.keys(b);
		if(A.length !== B.length) return false;
		return A.every(k=>xo.eq(a[k], b[k]));
	},
	observable : (val, fn)=>{
		if(typeof val !== 'object') return val;
		return new Proxy(val,{
			get(target, key){ return xo.observable(target[key], fn) },
			set(target, key, newVal){
				if(!xo.eq(target[key], newVal)){ target[key] = newVal; fn(); }
				return true;
			}
		})
	}
};


const Template = {
	sep: '\x07',
	cache : {},
	get : (htmlStrs)=>{
		const html = (Array.isArray(htmlStrs)) ? htmlStrs.join(Template.sep) : htmlStrs;
		const key = xo.hash(html);
		if(!Template.cache[key]) Template.cache[key] = Template.parse(html, key);
		return Template.cache[key]
	},
	parse : (html, id)=>{
		const tmpl = document.createElement('template');
		tmpl.innerHTML = html;
		tmpl.id = id;
		tmpl.slots = [];
		if(tmpl.content.children.length !== 1){ throw new Error(`Blueprint has more than 1 top-level element: ${tmpl.innerHTML}`); }
		const parseChild = (el, path=[])=>{
			[...el.attributes]
				.filter(({name, value})=>value===Template.sep)
				.forEach(({name, value})=>{ el.removeAttribute(name); tmpl.slots.push({attr:name, path}); });

			if(el.childNodes.length === 1 && el.firstChild.textContent === Template.sep){
				el.removeChild(el.firstChild);
				tmpl.slots.push({attr:'innerHTML', path});
				return;
			}
			for(let idx=0; idx<el.childNodes.length; idx++){
				let child = el.childNodes[idx];
				if(child.nodeName !== "#text"){ parseChild(child, path.concat(idx)); }
				else if(child.textContent.includes(Template.sep)){
					const newChildren = child.textContent.split(Template.sep)
						.reduce((acc, chunk, subidx)=>{
							if(subidx!==0){
								tmpl.slots.push({attr:'innerHTML', path: path.concat(idx + subidx)});
								acc.push(document.createElement('span'))
							}
							return acc.concat(chunk);
						}, []);
					child.replaceWith(...newChildren);
					idx += newChildren.length - 1;
				}
			}
		};
		parseChild(tmpl.content.firstElementChild);
		tmpl.dataset.slots = tmpl.slots; //TODO: check that this is visible
		return tmpl;
	}
};

const Blueprint = {
	create(htmlStrings, ...data){
		const template = Template.get(htmlStrings);
		return xo.type({
			key   : template.id,
			slots : template.slots,
			tmpl  : template.content.firstElementChild,
			data
		}, 'Blueprint');
	},
	mount(blueprint, node){
		const newNode = blueprint.tmpl.cloneNode(true);
		node.replaceWith(newNode);
		newNode.slots = blueprint.slots.map(({attr, path})=>{
			return {
				attr,
				last:null,
				el: path.reduce((acc, idx)=>acc.childNodes[idx], newNode)
			};
		});
		newNode.bp_key = blueprint.key;
		return newNode;
	},
	render(blueprint, node){
		if(node.bp_key !== blueprint.key) node = Blueprint.mount(blueprint, node);
		node.slots.forEach((slot, idx)=>{
			let newData = blueprint.data[idx];
			if(slot.last === newData) return;
			slot.last = newData;
			//TODO: what?
			slot.el = render(newData, slot.el, slot.attr);
		});
		return node;
	}
};

const Component = {
	instances : new WeakMap(),
	create(func, key=false){
		key = key || func.name || xo.hash(func.toString()); //TODO: check that name is working properly
		const comp = (...args)=>xo.type({ key, func, args }, 'Component');
		comp.key=key;
		return comp;
	},
	addHooks(instance){
		instance.hooks = [];
		instance.hook_idx = -1;
		const getHook = (newHookFn=()=>{return {}})=>{
			instance.hook_idx++;
			if(!instance.hooks[instance.hook_idx]) instance.hooks[instance.hook_idx] = newHookFn(instance.hook_idx);
			return instance.hooks[instance.hook_idx];
		};
		let scope = {
			useState(init){
				let hook = getHook(idx=>xo.type([xo.exec(init), null, idx], 'state'));
				hook[1] = (newVal, force=false)=>{
					if(!xo.eq(newVal, hook[0]) || force){
						hook[0] = newVal;
						instance.redraw();
					}
				}
				return hook;
			},
			useEffect(func, dep=true){
				let hook = getHook();
				if(!xo.eq(dep, hook.dep)){
					xo.exec(hook.undo);
					hook.func = func; hook.dep = dep; hook.flag = true;
				}
			},
			useMemo(func, dep=true){
				let hook = getHook();
				if(!xo.eq(dep, hook.dep)){
					hook.val = func(); hook.dep = dep;
				}
				return hook.val;
			},
			useRef(val){
				return getHook(()=>val??{});
			},
			redraw(){ instance.redraw(); }
		};
		instance.scope = new Proxy(scope, {
			get(target, key){
				if(xo.type(target[key]) === 'state'){
					let hook = instance.hooks[target[key][2]]
					return xo.observable(hook[0], ()=>hook[1](hook[0], true));
				}
				return target[key];
			},
			set(target, key, val){
				if(xo.type(target[key]) === 'state' && xo.type(val) !== 'state'){
					instance.hooks[target[key][2]][1](val);
					return true;
				}
				target[key] = val;
				return true;
			}
		});
		return instance;
	},
	mount(comp, node){
		node = Component.unmount(node);
		let instance = { ...comp,
			pending : false,
			redraw(){
				if(instance.pending) return;
				instance.pending = window.requestAnimationFrame(()=>Component.update(instance, instance.scope.el));
			},
		};
		instance = Component.addHooks(instance);
		Component.instances.set(node, instance);
		const newNode = Component.update(instance, node);
		if(!newNode.isConnected){ throw `Could not mount Component: ${newNode.outerHTML}`; }
		instance.watcher = DOM.onRemove(newNode);
		return newNode;
	},
	unmount(node){
		let instance = Component.instances.get(node);
		if(!instance) return node;
		window.cancelAnimationFrame(instance.pending);
		instance.watcher.disconnect();
		instance.hooks.forEach(hook=>exec(hook.undo));
		Component.instances.delete(node);
		return node;
	},
	update(instance, node){
		instance.hook_idx = -1;
		instance.pending = false;
		const newNode = xo.render(instance.func.apply(instance.scope, instance.args), node);
		if(newNode !== node){
			instance.scope.el = newNode;
			Component.instances.set(newNode, instance);
			Component.instances.delete(node);
		}
		instance.hooks.filter(({flag})=>flag).forEach((effect)=>{
			effect.undo = effect.func();
			effect.flag = false;
		});
		return newNode;
	},
	render(comp, node){
		let instance = Component.instances.get(node);
		if(!instance || comp.key !== instance.key) return Component.mount(comp, node);
		if(xo.eq(comp.args, instance.args)) return node;
		instance.args = comp.args;
		return Component.update(instance, node);
	}
};

const Collection = {
	render(newItems, node){
		const newKeys = Object.keys(newItems), oldKeys = node.collection_keys ?? [];
		if(!xo.eq(newKeys, oldKeys)){
			let itemDict = {};
			oldKeys
				.filter((key,idx)=>{ itemDict[key] = node.childNodes[idx]; return undef(newItems[key]); })
				.forEach(key=>{ node.removeChild(itemDict[key]) });

			newKeys.forEach((key, idx)=>{
				if(itemDict[key] && itemDict[key] === node.childNodes[idx]) return;
				node.insertBefore(itemDict[key] ?? document.createElement('span'), node.childNodes[idx]);
			});
			node.collection_keys = newKeys;
		}
		newKeys.forEach((key, idx)=>render(newItems[key], node.childNodes[idx]));
		return node;
	}
};

const DOM = {
	unmount(node){
		if(node.isConnected) return node;
		if(node.slots) node.slots.filter(({el})=>el!==node).forEach(slot=>DOM.unmount(slot.el));
		if(Component.instances.has(node)) Component.unmount(node);

		return node;
	},
	onRemove(node, listener=DOM.unmount){
		const observer = new MutationObserver((changes)=>changes.map(({removedNodes})=>removedNodes.forEach(listener)));
		observer.observe(node.parentNode, {childList : true})
		return observer;
	},
	render(val, node, attr='innerHTML'){
		if(attr==='ref'){
			if(typeof val !== 'object'){ throw `Can not set ref with non-object: ${val}`; }
			return val.el = node;
		}
		if(attr==='innerHTML'){
			if(val === false || val === null || undef(val)){
				const newNode = document.createElement('span');
				node.replaceWith(newNode);
				return newNode;
			}else{
				node.innerHTML = (val ?? '').toString();
			}
		}else{
			if(attr === 'class'){
				node.classList = val;
			}else if(typeof val === 'boolean'){
				node.toggleAttribute(attr, val);
			}else if(attr==='value' || typeof val === 'function'){
				node[attr] = val;
			}else{
				node.setAttribute(attr, val);
			}
		}
		return node;
	}
};


xo.render = (arg, node, attr='innerHTML')=>{
	node = node ?? document.body.firstElementChild;
	const argType = xo.type(arg);
	if(argType === 'Component') return Component.render(arg, node);
	if(argType === 'Blueprint') return Blueprint.render(arg, node);
	if(argType === 'object' && attr==='innerHTML') return Collection.render(arg, node);
	return DOM.render(arg, node, attr);
};
xo.comp = Component.create;
xo.x = Blueprint.create;

xo.ssr = {
	render(arg){
		const argType = xo.type(arg);
		if(argType === 'Blueprint') return arg.html.map((str, idx)=>str+xo.ssr.render(arg.data[idx])).join('');
		if(argType === 'object') return Object.values(arg).map(item=>xo.ssr.render(item)).join('\n');
		return arg ?? '';
	},
	comp(func){
		//TODO: THI is broken
		return func.bind({
			useState  : (init)=>{return [exec(init),()=>{}]},
			useEffect : ()=>{},
			useMemo   : (init)=>init,
			useSignal : (init)=>exec(init),
			redraw    : ()=>{},
			el        : {}
		});
	},
	x(html, ...data){ return xo.type({html, data}, 'Blueprint') }
};
if(typeof window === 'undefined'){
	xo.render = xo.ssr.render;
	xo.comp = xo.ssr.comp;
	xo.x = xo.ssr.x;
}
if(typeof window !== 'undefined') window.xo = xo;
if(typeof module !== 'undefined') module.exports = xo;
