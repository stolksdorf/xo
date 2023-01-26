const xo = {
	hash : (str)=>[...str].reduce((acc, char)=>{acc = ((acc<<5)-acc)+char.charCodeAt(0);return acc&acc; }, 0).toString(32),
	type : (obj,setType)=>{
		if(setType) return Object.defineProperty(obj, Symbol.for('type'), {value:setType});
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
	},
	sx: (styleObj)=>{
		return Object.entries(styleObj).map(([prop,val])=>{
			prop = prop.replace(/([A-Z])/g, (_,char)=>`-${char.toLowerCase()}`);
			return `${prop}:${val};`
		}).join('');
	},
	cx : (...args)=>{
		return args.map((arg)=>{
			if(Array.isArray(arg)) return xo.cx(...arg);
			if(typeof arg === 'object') return Object.entries(arg).filter(([k,v])=>!!v).map(([k,v])=>k).join(' ');
			return arg;
		}).join(' ');
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

			if(el.childNodes.length === 1 && el.firstChild.textContent.trim() === Template.sep){
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
		}, 'blueprint');
	},
	mount(blueprint, node){
		const newNode = blueprint.tmpl.cloneNode(true);
		node.replaceWith(newNode);
		newNode.xoSlots = blueprint.slots.map(({attr, path})=>{
			const el = path.reduce((acc,idx)=>acc.childNodes[idx], newNode);
			return { attr, el };
		});
		newNode.xoBlueprintKey = blueprint.key;
		return newNode;
	},
	render(blueprint, node){
		if(node.xoBlueprintKey !== blueprint.key) node = Blueprint.mount(blueprint, node);
		node.xoSlots.forEach((slot, idx)=>{
			let newData = blueprint.data[idx];
			if(slot.last === newData) return;
			slot.last = newData;
			slot.el = xo.render(newData, slot.el, slot.attr);
		});
		return node;
	}
};

const Component = {
	instances : new WeakMap(),
	create(func, key=false){
		key = key || func.name || xo.hash(func.toString());
		const comp = (...args)=>xo.type({ key, func, args }, 'component');
		comp.key=key;
		return comp;
	},
	Hooks : {
		useState(init){
			if(!this.hook?.set){
				this.hook.val = xo.exec(init);
				this.hook.set = (newVal,force=false)=>{
					if(!force && xo.eq(newVal, this.hook.val)) return;
					this.hook.val = newVal;
					this.instance.redraw();
				}
			}
			return xo.type([this.hook.val, this.hook.set, this.idx], 'state');
		},
		useEffect(func, dep=true){
			if(xo.eq(dep, this.hook?.dep)) return;
			xo.exec(this.hook.onUnmount);
			this.hook.dep = dep;
			this.hook.afterRender = ()=>{ this.hook.unmount = func(); }
		},
		useMemo(func, dep=true){
			if(!xo.eq(dep, this.hook?.dep)){ this.hook.val=func(); this.hook.dep=dep; }
			return this.hook.val;
		},
		useRef(val){
			this.hook.val = this.hook?.val ?? val ?? {};
			return this.hook.val;
		},
	},
	makeInstance(comp){
		let instance = { pending:false, hooks:[], hookCounter:0,
			redraw(){
				if(instance.pending) return;
				instance.pending = window.requestAnimationFrame(()=>Component.update(instance, instance.scope.el));
			},
			...comp,
		};
		let scope = {el:undefined, redraw:instance.redraw};
		Object.entries(Component.Hooks).map(([name, fn])=>{
			scope[name] = (...args)=>{
				let idx = instance.hookCounter++;
				instance.hooks[idx] = instance.hooks[idx] ?? {};
				return fn.apply({ idx, instance, hook:instance.hooks[idx] },args);
			}
		});
		instance.scope = new Proxy(scope, {
			get(target, key){
				if(xo.type(target[key]) === 'state'){
					const hook = instance.hooks[target[key][2]];
					return xo.observable(hook.val, ()=>hook.set(hook.val, true));
				}
				return target[key];
			},
			set(target, key, val){
				if(xo.type(target[key]) === 'state' && xo.type(val) !== 'state'){
					instance.hooks[target[key][2]].set(val);
				}else{ target[key] = val; }
				return true;
			}
		});
		return instance;
	},
	mount(comp, node){
		node = Component.unmount(node);
		const instance = Component.makeInstance(comp);
		Component.instances.set(node, instance);
		const newNode = Component.update(instance, node);
		if(!newNode.isConnected){ throw `Could not mount Component: ${newNode.outerHTML}`; }
		instance.watcher = DOM.removalObserver(newNode);
		return newNode;
	},
	unmount(node){
		let instance = Component.instances.get(node);
		if(!instance) return node;
		window.cancelAnimationFrame(instance.pending);
		instance.watcher.disconnect();
		instance.hooks.forEach(hook=>xo.exec(hook.unmount));
		Component.instances.delete(node);
		delete instance;
		delete node.xoComponentKey;
		return node;
	},
	update(instance, node){
		instance.hookCounter = 0;
		instance.pending = false;
		const newNode = xo.render(instance.func.apply(instance.scope, instance.args), node);
		if(newNode !== node){
			instance.scope.el = newNode;
			newNode.xoComponentKey = instance.key;
			Component.instances.set(newNode, instance);
			Component.instances.delete(node);
		}
		instance.hooks.forEach(hook=>{xo.exec(hook.afterRender); delete hook.afterRender;});
		return newNode;
	},
	render(comp, node){
		const instance = Component.instances.get(node);
		if(!instance || instance.key !== comp.key) return Component.mount(comp, node);
		if(xo.eq(comp.args, instance.args)) return node;
		instance.args = comp.args;
		return Component.update(instance, node);
	}
};
const Collection = {
	render(newItems, node){
		const newKeys=Object.keys(newItems), oldKeys=node.xoCollectionKeys??[];
		if(!xo.eq(newKeys, oldKeys)){
			let oldItemNodes = {};
			oldKeys
				.filter((key,idx)=>{
					oldItemNodes[key] = node.childNodes[idx];
					return typeof newItems[key] === 'undefined';
				})
				.forEach(key=>{ node.removeChild(oldItemNodes[key]) });

			newKeys.forEach((key, idx)=>{
				if(oldItemNodes[key] && oldItemNodes[key] === node.childNodes[idx]) return;
				node.insertBefore(oldItemNodes[key] ?? document.createElement('span'), node.childNodes[idx]);
			});
			node.xoCollectionKeys = newKeys;
		}
		newKeys.forEach((key, idx)=>xo.render(newItems[key], node.childNodes[idx]));
		return node;
	}
};
const DOM = {
	unmount(node){
		if(node.isConnected) return node;
		if(node.xoSlots){
			node.xoSlots.filter(slot=>slot.attr==='innerHTML'&&slot.el!==node).forEach(slot=>DOM.unmount(slot.el));
			delete node.xoSlots;
		}
		if(Component.instances.has(node)) Component.unmount(node);
		return node;
	},
	removalObserver(node, listener=DOM.unmount){
		const observer = new MutationObserver((changes)=>changes.map(({removedNodes})=>removedNodes.forEach(listener)));
		observer.observe(node.parentNode, {childList:true})
		return observer;
	},
	render(val, node, attr='innerHTML'){
		if(attr==='ref'){
			if(typeof val !== 'object'){ throw `Can not set ref with non-object: ${val}`; }
			return val.el = node;
		}
		if(attr==='innerHTML'){
			if(val === false || val === null || typeof val === 'undefined'){
				const newNode = document.createElement('span');
				node.replaceWith(newNode);
				return newNode;
			}
			node.innerHTML = val.toString();
			return node;
		}
		if(attr === 'class'){ node.classList = val; }
		else if(typeof val === 'boolean'){ node.toggleAttribute(attr, val); }
		else if(attr==='value' || typeof val === 'function'){ node[attr] = val; }
		else{ node.setAttribute(attr, val); }
		return node;
	}
};

xo.render = (arg, node, attr='innerHTML')=>{
	node = node ?? document.body.firstElementChild;
	const argType = xo.type(arg);
	if(argType === 'component') return Component.render(arg, node);
	if(argType === 'blueprint') return Blueprint.render(arg, node);
	if(argType === 'object' && attr==='innerHTML') return Collection.render(arg, node);
	return DOM.render(arg, node, attr);
};
xo.comp = Component.create;
xo.x = Blueprint.create;

xo.ssr = {
	render(arg){
		const argType = xo.type(arg);
		if(argType === 'blueprint') return arg.html.map((str, idx)=>str+xo.ssr.render(arg.data[idx])).join('');
		if(argType === 'object') return Object.values(arg).map(item=>xo.ssr.render(item)).join('');
		if(argType === 'function') return '""';
		if(argType === 'undefined' || arg===null || arg===false) return '';
		if(argType === 'string') return arg;
		return `"${arg}"`;
	},
	comp(func){
		const instance = Component.makeInstance({ redraw(){} });
		return func.bind(instance.scope);
	},
	x(html, ...data){ return xo.type({html, data}, 'blueprint') }
};
if(typeof window === 'undefined'){
	xo.render = xo.ssr.render;
	xo.comp = xo.ssr.comp;
	xo.x = xo.ssr.x;
}

xo.Template = Template; xo.Blueprint = Blueprint; xo.Component = Component; xo.Collection = Collection; xo.DOM = DOM;
if(typeof window !== 'undefined') window.xo = xo;
if(typeof module !== 'undefined') module.exports = xo;
