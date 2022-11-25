const hash = (str)=>[...str].reduce((acc, char)=>{acc = ((acc<<5)-acc)+char.charCodeAt(0);return acc&acc; }, 0).toString(32);

const type = (val, set=undefined)=>{
	if(typeof set !== 'undefined') return Object.defineProperty(val, Symbol.for('type'), { value:set });
	if(typeof val === 'undefined' || val === null) return 'none';
	if(val[Symbol.for('type')]) return val[Symbol.for('type')];
	if(val.constructor === Object || Array.isArray(val)) return 'collection';
	return typeof val;
};

const undef = (val)=>typeof val === 'undefined';
const exec = (val)=>typeof val === 'function' ? val() : val;
const eq = (a,b)=>{
	if(a===b) return true;
	if(typeof a !== "object" || typeof b !== "object") return false;
	const A = Object.keys(a), B = Object.keys(b);
	if(A.length !== B.length) return false;
	return A.every(k=>eq(a[k], b[k]));
};
const cx = (...args)=>args.flatMap(arg=>(arg && arg.constructor === Object) ? Object.keys(arg).filter(k=>!!arg[k]) : arg).join(' ');
const observable = (obj, cb)=>{
	if(type(obj) !== 'collection') return obj;
	return new Proxy(obj, {
		get : (target, key)=>observable(target[key], cb),
		set : (target, key, val)=>{
			if(!eq(target[key], val)){ target[key] = val; cb(); }
			return true;
		}
	});
};


const Blueprint = {
	cache : {},
	parse(htmlString, sep='\x07'){
		const html = Array.isArray(htmlString) ? htmlString.join(sep) : htmlString;
		//const key = Symbol.for(html);
		const key = hash(html);
		if(Blueprint.cache[key]){ return Blueprint.cache[key]; }

		const blueprint = document.createElement('template');
		blueprint.innerHTML = html;
		blueprint.slots     = [];
		blueprint.key       = key;
		if(blueprint.content.children.length !== 1){ throw new Error(`Blueprint has more than 1 top-level element: ${blueprint.innerHTML}`); }

		const parseChild = (el, path=[])=>{
			[...el.attributes]
				.filter(({name, value})=>value===sep)
				.forEach(({name, value})=>{ el.removeAttribute(name); blueprint.slots.push({attr:name, path}); });
			if(el.childNodes.length === 1 && el.firstChild.textContent.trim() === sep){
				el.removeChild(el.firstChild);
				blueprint.slots.push({attr:'innerHTML', path});
				return;
			}
			for(let idx=0; idx<el.childNodes.length; idx++){
				let child = el.childNodes[idx];
				if(child.nodeName !== "#text"){ parseChild(child, path.concat(idx)); }
				else if(child.textContent.includes(sep)){
					const newChildren = child.textContent.split(new RegExp(`(${sep})`, 'g'))
						.map((chunk, subidx)=>{
							if(chunk!==sep) return chunk;
							blueprint.slots.push({attr:'innerHTML', path: path.concat(idx + subidx)});
							return document.createElement('span');
						});
					child.replaceWith(...newChildren);
					idx += newChildren.length - 1;
				}
			}
		};
		parseChild(blueprint.content.firstElementChild);
		Blueprint.cache[key] = blueprint;
		return blueprint;
	},
	create(htmlStrings, ...data){
		return type({ blueprint : Blueprint.parse(htmlStrings), data }, 'blueprint');
	},
	render(blueprint, node){
		const newNode = blueprint.content.firstElementChild.cloneNode(true);
		node.replaceWith(newNode);
		newNode.slots = blueprint.slots.map(({attr, path})=>{
			return {attr, last:null, el: path.reduce((acc, idx)=>acc.childNodes[idx], newNode)};
		});
		newNode.key = blueprint.key;
		return newNode;
	},
	update({data, blueprint}, node){
		if(node.key !== blueprint.key) node = Blueprint.render(blueprint,node);
		node.slots = node.slots.map((slot, idx)=>{
			if(slot.last !== data[idx]){
				slot.last = data[idx];
				slot.el = render(data[idx], slot.el, slot.attr);
			}
			return slot;
		});
		return node;
	},
};


const Component = {
	cache : new WeakMap(),
	create(func){
		//const key = Symbol.for(func);
		const key = hash(func.toString());
		return (...args)=>{ return type({ args, key, func }, 'component'); };
	},
	/* WITH SIGNALS
	makeInstance(comp, node){
		let instance = {
			...comp,
			hooks    : [],
			signal   : observable({}, ()=>instance.scope.redraw()),
			observer : new MutationObserver((changes)=>changes.map(({removedNodes})=>removedNodes.forEach(node=>Component.unmount(node)))),

			scope : {
				el : node,
				useState(init){
					const idx = instance.hooks.counter++;
					if(!instance.hooks[idx]){
						instance.hooks[idx] = [
							exec(init),
							(newVal)=>{
								if(!eq(newVal, instance.hooks[idx][0])){
									instance.hooks[idx][0] = newVal;
									instance.scope.redraw();
								}
							}
						];
					}
					return instance.hooks[idx];
				},
				useSignal(init){ return type([init], 'signal'); },
				useMemo(val, dep=true){
					const idx = instance.hooks.counter++;
					if(!eq(dep, instance.hooks[idx]?.dep)) instance.hooks[idx] = {val, dep};
					return instance.hooks[idx].val;
				},
				useEffect(func, dep=true){
					const idx = instance.hooks.counter++;
					if(!instance.hooks[idx]) instance.hooks[idx] = {};
					if(!eq(dep, instance.hooks[idx].dep)){
						exec(instance.hooks[idx].undo);
						instance.hooks[idx] = {func, dep, flag:true};
					}
				},
				useInit(func){
					const idx = instance.hooks.counter++;
					if(!instance.hooks[idx]){ instance.hooks[idx] = { undo: exec(func) }; }
					return instance.hooks[idx].undo;
				},
				redraw(){
					if(instance.pending) return;
					instance.pending = window.requestAnimationFrame(()=>Component.render(instance.scope.el));
				},
			}
		};
		instance.scope = new Proxy(instance.scope, {
			get(target, key){
				if(!undef(instance.signal[key])) return instance.signal[key];
				return target[key];
			},
			set(target, key, value){
				if(type(value) === 'signal' && undef(instance.signal[key])){  instance.signal[key] = exec(value[0]); return true; }
				if(type(value) !== 'signal' && !undef(instance.signal[key])){ instance.signal[key] = value; return true; }
				target[key] = value;
				return true;
			}
		});
		return instance;
	},
	*/
	makeInstance(comp, node){
		let instance = {
			...comp,
			hooks    : [],
			observer : new MutationObserver((changes)=>changes.map(({removedNodes})=>removedNodes.forEach(node=>Component.unmount(node)))),

			scope : {
				el : node,
				useState(init){
					const idx = instance.hooks.counter++;
					if(!instance.hooks[idx]){
						instance.hooks[idx] = [
							exec(init),
							(newVal)=>{
								if(!eq(newVal, instance.hooks[idx][0])){
									instance.hooks[idx][0] = newVal;
									instance.scope.redraw();
								}
							}
						];
					}
					return instance.hooks[idx];
				},
				useMemo(val, dep=true){
					const idx = instance.hooks.counter++;
					if(!eq(dep, instance.hooks[idx]?.dep)) instance.hooks[idx] = {val, dep};
					return instance.hooks[idx].val;
				},
				useEffect(func, dep=true){
					const idx = instance.hooks.counter++;
					if(!instance.hooks[idx]) instance.hooks[idx] = {};
					if(!eq(dep, instance.hooks[idx].dep)){
						exec(instance.hooks[idx].undo);
						instance.hooks[idx] = {func, dep, flag:true};
					}
				},
				useInit(func){
					const idx = instance.hooks.counter++;
					if(!instance.hooks[idx]){ instance.hooks[idx] = { undo: exec(func) }; }
					return instance.hooks[idx].undo;
				},
				redraw(){
					if(instance.pending) return;
					instance.pending = window.requestAnimationFrame(()=>Component.render(instance.scope.el));
				},
			}
		};
		return instance;
	},
	mount(comp, node){
		node = Component.unmount(node);
		let instance = Component.makeInstance(comp, node);
		Component.cache.set(node, instance);
		const newNode = Component.render(node);
		instance.observer.observe(newNode.parentNode, {childList : true});
		return newNode;
	},
	unmount(node){
		let instance = Component.cache.get(node);
		if(!instance) return node;
		window.cancelAnimationFrame(instance.pending);
		instance.observer.disconnect();
		instance.hooks.forEach(hook=>exec(hook.undo));
		Component.cache.delete(node);
		return node;
	},
	render(node){
		if(!node.isConnected) return Component.unmount(node);
		let instance = Component.cache.get(node);
		if(!instance) return node;

		instance.hooks.counter = 0;
		instance.pending = false;
		const newNode = render(instance.func.apply(instance.scope, instance.args), node);
		if(newNode !== node){
			instance.scope.el = newNode;
			Component.cache.set(newNode, instance);
			Component.cache.delete(node);
		}
		instance.hooks.filter(({flag})=>flag).forEach((effect)=>{
			exec(effect.undo);
			effect.undo = effect.func();
			effect.flag = false;
		});
		return newNode;
	},
	update(comp, node){
		let instance = Component.cache.get(node);
		if(!instance || comp.key !== instance.key) return Component.mount(comp, node);
		if(eq(comp.args, instance.args)) return node;
		instance.args = comp.args;
		return Component.render(node);
	},
};

const UpdateCollection = (newItems, node)=>{
	const newKeys = Object.keys(newItems), oldKeys = node.collection_keys ?? [];
	if(!eq(newKeys, oldKeys)){
		let itemDict = {};
		oldKeys
			.filter((key,idx)=>{ itemDict[key] = node.childNodes[idx]; return undef(newItems[key]); })
			.forEach(key=>node.removeChild(itemDict[key]));

		newKeys.forEach((key, idx)=>{
			if(itemDict[key] && itemDict[key] === node.childNodes[idx]) return;
			node.insertBefore(itemDict[key] ?? document.createElement('span'), node.childNodes[idx]);
		});
		node.collection_keys = newKeys;
	}
	newKeys.forEach((key, idx)=>render(newItems[key], node.childNodes[idx]));
	return node;
};

const UpdateDOM = (val, node, attrName='innerHTML')=>{
	if(attrName === 'class'){          node.classList = val; }
	else if(attrName === 'innerHTML'){ node.innerHTML = (val ?? '').toString(); }
	else if(typeof val === 'boolean'){ node.toggleAttribute(attrName, val); }
	else{ node[attrName] = val; }
	return node;
};

const render = (val, node, attrName='innerHTML')=>{
	if(type(val) === 'component') return Component.update(val, node);
	if(type(val) === 'blueprint') return Blueprint.update(val, node);
	if(attrName === 'innerHTML' && type(val) === 'collection') return UpdateCollection(val, node);
	return UpdateDOM(val, node, attrName);
};

let xo = {
	render : (val, node)=>render(val, node ?? document.body.firstElementChild),
	comp   : Component.create,
	x      : Blueprint.create,
	cx     : cx
};

if(typeof window === 'undefined'){ //Server-side rendering
	xo.x = (html, ...data)=>{ return type({ html, data }, 'blueprint') };
	xo.comp = (func)=>{
		return func.bind({
			useState  : (init)=>{return [exec(init),()=>{}]},
			useEffect : ()=>{},
			useMemo   : (init)=>init,
			useSignal : (init)=>exec(init),
			redraw    : ()=>{},
			el        : {}
		});
	};
	xo.render = (val)=>{
		if(type(val) === 'blueprint') return val.html.reduce((acc,str,idx)=>acc+str+xo.render(val.data[idx]),'');
		if(type(val) === 'collection') return Object.values(val).map(xo.render).join('\n');
		if(type(val) === 'function') return '""';
		return val ?? '';
	};
};

module.exports = xo;









//const mutationHandler = (changes)=>changes.map(({removedNodes})=>removedNodes.forEach(node=>Component.unmount(node)));

// const mutationHandler = (changes)=>{
// 	changes.map((evt)=>{
// 		//console.log(evt);
// 		evt.removedNodes.forEach(node=>Component.unmount(node))
// 	});
// }


// const proxify = (cb, obj={})=>{
// 	return new Proxy(obj[proxify.real]??obj, {
// 		get : (target, key)=>{
// 			if(key == proxify.real) return target;
// 			//return (typeof target[key] === 'object') ? proxify(cb, target[key]) : target[key];
// 			return (typeof target[key] === 'object') ? proxify(cb, Reflect.get(target, key)) : Reflect.get(target, key);
// 		},
// 		set : (target, key, val)=>{
// 			if(val === proxify.noop) return true;
// 			val = val[proxify.real] ?? val;
// 			if(eq(target[key], val)) return true;
// 			//target[key] = val;
// 			Reflect.set(target, key, val);

// 			//console.log('p:change', target, key);
// 			cb(target, key, val);
// 			return true;
// 		}
// 	});
// };
// proxify.noop = Symbol();
// proxify.real = Symbol();


//Create an new el
	// has property of slots, array of child elements and the attribute name
	// adds ID as the hash
	// maybe wrap the placeholder in a 'span' tag?
	//should have a "clone()" func that returns a new element plus the slots are filled out




// function parse(htmlString, sep='\x07'){
// 	const html = Array.isArray(htmlString) ? htmlString.join(sep) : htmlString;
// 	const key = Symbol.for(html);
// 	if(parse.cache[key]){ return parse.cache[key]; }

// 	const blueprint = document.createElement('template');
// 	blueprint.innerHTML = html;
// 	if(blueprint.content.children.length !== 1){ throw new Error(`Blueprint has more than 1 top-level element: ${blueprint.innerHTML}`); }
// 	blueprint.slots = [];

// 	const parseChild = (el, path=[])=>{
// 		for(let idx=0; idx<el.attributes.length; idx++){
// 			let {name, value} = el.attributes.item(idx);
// 			if(value===sep){ el.removeAttribute(name); blueprint.slots.push([name, path]); }
// 		}
// 		if(el.childNodes.length === 1 && el.firstChild.textContent.trim() === sep){
// 			el.removeChild(el.firstChild);
// 			blueprint.slots.push(['innerHTML', path]);
// 			return;
// 		}
// 		for(let idx=0; idx<el.childNodes.length; idx++){
// 			let child = el.childNodes[idx];
// 			if(child.nodeName !== "#text"){ parseChild(child, path.concat(idx)); }
// 			else if(child.textContent.includes(sep)){
// 				const newChildren = child.textContent.split(new RegExp(`(${sep})`, 'g'))
// 					.map((chunk, subidx)=>{
// 						if(chunk!==sep) return chunk;
// 						blueprint.slots.push(['innerHTML', path.concat(idx + subidx)]);
// 						return document.createElement('span');
// 					});
// 				child.replaceWith(...newChildren);
// 				idx += newChildren.length - 1;
// 			}
// 		}
// 	};
// 	parseChild(blueprint.content.firstElementChild);
// 	parse.cache[key] = blueprint;
// 	return blueprint;
// };
// parse.cache={};


// //Bump out to it's own function
// const construct = (blueprint, node)=>{
// 	const newNode = blueprint.content.firstElementChild.cloneNode(true);
// 	if(node) node.replaceWith(newNode)
// 	newNode.slots = blueprint.slots.map(([attr, path])=>{
// 		return [attr, path.reduce((acc, idx)=>acc.childNodes[idx], newNode)]
// 	});
// 	newNode.key = key;
// 	return newNode;
// };

// const update = ({data, blueprint}, node)=>{
// 	if(node.key !== blueprint.key) node = construct(node);
// 	node.slots = node.slots.map((slot, idx)=>{
// 		if(last !== data[idx]){
// 			slot.last = data[idx];
// 			slot.el = render(data[idx], slot.el, slot.attr);
// 		}
// 		return slot;
// 	});
// 	return node;
// };







// const UpdateNode = (value, node, attrName='innerHTML')=>{
// 	// if(!node.xoLast) node.xoLast = {};
// 	// if(eq(node.xoLast[attrName], value)) return node;
// 	// node.xoLast[attrName] = value;

// 	if(attrName == 'innerHTML'){
// 		//node.innerHTML = (value || value===0) ? value : '';
// 		node.innerHTML = value ?? '';
// 	}else if(attrName == 'class'){
// 		node.classList = cx(value);
// 	}else if(typeof value === 'boolean'){
// 		node.toggleAttribute(attrName, value);
// 	}else{
// 		node[attrName] = value;
// 	}
// 	return node;
// };

// const UpdateNode2 = (data, node, attrName)=>{
// 	if(attrName === 'class'){ attrName = 'classList'; data = cx(data); }
// 	if(attrName === 'innerHTML'){ data = (data ?? '').toString(); }

// 	if(!node.xoLast) node.xoLast = {};

// 	//Attempts to pull data from the DOM first to stop needless initial re-renders
// 	if(undef(node.xoLast[attrName])) node.xoLast[attrName] = node[attrName];

// 	if(!eq(data, node.xoLast[attrName])){
// 		node.xoLast[attrName] = data;
// 		node[attrName] = data;
// 	}
// 	return node;
// };





// function Template(args){ Object.assign(this, args) };
// Object.assign(Template, {

// 	// [Symbol.hasInstance](value) {
// 	// 	return (value !== null &&
// 	// 	(typeof value === 'object' ||
// 	// 	typeof value === 'function'));
// 	// },
// 	// cache : {},
// 	// parse(htmlString){
// 	// 	const template = document.createElement('template'); template.innerHTML = htmlString;

// 	// 	if(template.content.childNodes.length !== 1){ throw new Error(`XO Template has more than 1 top-level element: ${htmlString}`); }

// 	// 	let slots = [], el = template.content.firstElementChild;
// 	// 	const isSlotElement = (node)=>node.childNodes.length === 1 && node.childNodes[0].nodeValue?.trim() === `\x07`;

// 	// 	const parseElement = (el, path=[])=>{
// 	// 		[...el.attributes]
// 	// 			.filter(({name, value})=>value === `\x07`)
// 	// 			.forEach(({name, value})=>{
// 	// 				el.removeAttribute(name);
// 	// 				slots.push({attr:name, path});
// 	// 			});
// 	// 		//if(el.childNodes.length === 1 && el.childNodes[0].nodeValue?.trim() === `\x07`){
// 	// 		if(isSlotElement(el)){
// 	// 			slots.push({ attr:'innerHTML', path});
// 	// 			return el.removeChild(el.childNodes[0]);
// 	// 		}


// 	// 		//el.childNodes.forEach((child, idx)=>{

// 	// 		for(let idx=0; idx<el.childNodes.length; idx++){
// 	// 			let child = el.childNodes[idx];

// 	// 			if(child.nodeName !== "#text"){
// 	// 				parseElement(child, path.concat(idx));
// 	// 			}else if(child.nodeValue.includes(`\x07`)){
// 	// 				const newChildren = child.nodeValue
// 	// 					.split(/(\x07)/g)
// 	// 					.map((chunk, _idx)=>{
// 	// 						if(chunk!==`\x07`) return chunk;
// 	// 						slots.push({attr:'innerHTML', path: path.concat(idx + _idx)});
// 	// 						return document.createElement('span');
// 	// 					});
// 	// 				child.replaceWith(...newChildren);
// 	// 				idx += newChildren.length - 1;
// 	// 			}
// 	// 		};
// 	// 		return el;
// 	// 	};
// 	// 	parseElement(el);
// 	// 	return {el, slots};
// 	// },


// 	create(strings, ...data){
// 		// const html = Array.isArray(strings) ? strings.join(`\x07`) : strings;
// 		// const key = hash(html);
// 		// //if(!Template.cache[key]) Template.cache[key] = Template.parse(html, key);
// 		// //Template.cache[key] = Template.cache[key] ?? Template.parse(html, key);
// 		// Template.cache[key] = Template.cache[key] ?? Template.parse(strings);

// 		// return {tmpl: Template.cache[key], data};

// 		const bp = parse(strings);

// 		const key = bp.key;
// 		const el = bp.content.firstElementChild;
// 		const slots = bp.slots;


// 		return new Template({ key, data, el, slots, bp });
// 	},
// 	draw(template, node){
// 		const newNode = template.el.cloneNode(true);
// 		node.replaceWith(newNode);

// 		newNode.xoKey   = template.key;
// 		newNode.xoSlots = template.slots.map(({attr, path})=>{
// 			return {attr, el: path.reduce((acc, idx)=>acc.childNodes[idx], newNode) };
// 		});
// 		return newNode;
// 	},
// 	update(template, node){
// 		if(template.key !== node.xoKey) node = Template.draw(template, node);

// 		//console.log(template, node.xoSlots);
// 		node.xoSlots.forEach(({el, attr}, idx)=>{
// 			node.xoSlots[idx].el = render(template.data[idx], el, attr);
// 		});


// 		// if(template.key !== node?.xoTmpl?.key) node = Template.draw(template, node);
// 		// node.xoTmpl.slots.forEach(({el, attr}, idx)=>{
// 		// 	node.xoTmpl.slots[idx].el = render(template.data[idx], el, attr);
// 		// });
// 		return node;
// 	},
// });





// function Component(args){ Object.assign(this, args) };
// Object.assign(Component, {
// 	cache: new WeakMap(),
// 	getInstance(node){ return Component.cache.get(node) },
// 	create(func){
// 		//const key = Symbol.for(func);
// 		const key = hash(func.toString()); //Could use func instead of a key
// 		return (...args)=>{ return new Component({ args, key, func }); };
// 	},



// 	mount(component, node){
// 		//cache existing scope, or create a new component scope

// 		//Create a mutation observer

// 		let observer = new MutationObserver(mutationHandler);


// 		let instance = {
// 			id : component.args[0] + '-'+ id(),
// 			...component,
// 			_pending : true,
// 			observer,


// 			effects : [],
// 			memos : [],
// 			states: [],

// 			ob : observable({}, (...args)=>instance.scope.refresh(...args)),

// 			ctx : []
// 		};


// 		//TODO: Remove nesting proxy
// 		// instead capture on top level proxy


// 		//move these values onto the instance
// 		instance.scope = {
// 			//refs: {},
// 			el : node,



// 			useState(val){
// 				const idx = instance.ctx.counter++;
// 				if(typeof instance.states[idx] === 'undefined'){
// 					instance.states[idx] = [exec(val), (newVal)=>{
// 						if(!eq(newVal, instance.states[idx][0])){
// 							instance.states[idx][0] = newVal;
// 							instance.scope.refresh();
// 						}
// 					},STATE];
// 				}
// 				return instance.states[idx];
// 			},


// 			init(val, exec=false){ return exec(val); },
// 			//make into a memo counter
// 			memo(val){ return instance.scope.init(()=>val); },
// 			//init(val, memo=false){ return memo?val:exec(val); },



// 			useMemo(val, dep=true){
// 				const idx = instance.memos.counter++;
// 				if(!eq(dep, instance.memos[idx]?.dep)) instance.memos[idx] = {val, dep};
// 				return instance.memos[idx].val;
// 			},

// 			refresh(t,k,v){
// 				//TODO: move refresh out onto component

// 				//console.log('refresh!', instance._pending);
// 				if(instance._pending) return;
// 				//console.log('refresh', node, component, {t,k,v});
// 				instance._pending = true;
// 				window.requestAnimationFrame(()=>Component.execute(instance.scope.el));
// 			},
// 			useEffect(func, dep=true){
// 				//TODO: might be weird with referring to the effects counter
// 				const idx = instance.effects.counter++;
// 				if(!instance.effects[idx]) instance.effects[idx] = {};
// 				if(!eq(dep, instance.effects[idx].dep)){
// 					console.log('here')
// 					exec(instance.effects[idx].undo);
// 					//instance.effects[idx].dep = dep;
// 					//instance.effects[idx].flag = true;
// 					instance.effects[idx] = {func, dep, flag:true};
// 				}
// 			},

// 			useEffect2(func, dep=true){
// 				const idx = instance.effects.counter++;
// 				instance.effects[idx] = {func, dep, flag: !eq(dep, instance.effects[idx]?.dep)};

// 				//let effect = instance.effects[instance.effects.counter++];
// 				//instance.effects[idx] = {func, dep, flag: !eq(dep, instance.effects[idx]?.dep)};
// 			},

// 		}

// 		instance.scope = new Proxy(instance.scope, {
// 			get(target, key){
// 				// console.log({target, key});
// 				// console.log(typeof instance.ob[key])
// 				if(typeof instance.ob[key] !== 'undefined'){
// 					console.log('returning ob', instance.ob[key])
// 					return instance.ob[key];
// 				}
// 				return target[key];
// 			},

// 			// Add in get,
// 			set(target, key, val){

// 				console.log({key, val})

// 				if(val[2]===STATE && undef(target[key])){

// 					if(!undef(instance.ob[key])){
// 						return true;
// 					}else{
// 						console.log('HERE', key, val);

// 						instance.ob[key] = exec(val[0]);

// 						return true;
// 					}


// 				}

// 				if(!undef(instance.ob[key])){
// 					instance.ob[key] = val[0];
// 					return true;
// 				}

// 				// If val is a useSignal and target.signals[key] is undefined, set it!
// 				// target.signals, should be an observable






// 				//if(typeof target[key] !== 'undefined'){
// 					target[key] = val; return true;
// 				//}
// 				//target.state[key] = val;
// 				return true;
// 			}
// 		});

// 		Component.cache.set(node, instance);

// 		const newNode = Component.execute(node);

// 		//console.log(newNode, newNode.parentNode);

// 		instance.scope.init = ()=>proxify.noop;
// 		//TODO: instead activate refresh here?!

// 		instance.observer.observe(newNode.parentNode, {childList : true});

// 		return newNode;
// 	},
// 	unmount(node){
// 		if(node.isConnected) return;
// 		let instance = Component.getInstance(node);
// 		if(!instance) return;
// 		//console.log('unmoutning', node, node.isConnected);
// 		instance.observer.disconnect();
// 		instance.effects.forEach(effect=>exec(effect.undo));
// 		Component.cache.delete(node);
// 	},
// 	execute(node){
// 		if(!node.isConnected) return Component.unmount(node);
// 		let instance = Component.getInstance(node);


// 		instance.effects.counter = 0;
// 		instance.memos.counter = 0;

// 		instance.ctx.counter = 0;
// 		const newNode = render(instance.func.apply(instance.scope, instance.args), node);

// 		//TODO: move _pending onto node
// 		instance._pending = false;
// 		if(newNode !== node){
// 			instance.scope.el = newNode;
// 			Component.cache.set(newNode, instance);
// 			Component.cache.delete(node);
// 			//remove old node instance
// 		}
// 		// instance.effects.forEach((effect)=>{
// 		// 	if(effect.flag){
// 		// 		effect.undo = effect.func();
// 		// 		effect.flag = false;
// 		// 	}
// 		// });

// 		instance.effects.filter(({flag})=>flag).forEach((effect)=>{
// 			exec(effect.undo);
// 			effect.undo = effect.func();
// 		});

// 		//newNode.xoInst = instance;
// 		//newNode.classList = [instance.id];
// 		return newNode;
// 	},
// 	update(component, node){
// 		let instance = Component.getInstance(node);
// 		if(component.key !== instance?.key) return Component.mount(component, node);
// 		if(eq(component.args, instance.args)) return node;

// 		//console.log('arg change!', instance.args, component.args);
// 		instance.args = component.args;
// 		return Component.execute(node);
// 	},
// });




