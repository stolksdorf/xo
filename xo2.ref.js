/*

- use MutationObserver to unmount 'components'
	- maybe only set this up if useEffect returns functions?
	- check that this fires with a template replaceWith
	- check that "moving" elements around don't trigger this

-

- Template elements have a .draw(targetEl) function
	- clones itself, and walks internally to build the slots

- Components
	- this.state
		- just a proxy object, when set a value it triggers an update
	- this.initState(func or obj)
		- sets up the init values of the state
		//- no-op once mounted

	- this.onMount(()=>{
		return ()=>{ unmount }
	})

	- effects?
		if(this.refs.val !== newVal){
			this.refs.val = newVal
			runnable func() ?
		}

	- State
		- this.state_name = 6;
		- this.state_name = ()=>I do things
		-




*/


const existsInDOM = (node)=>!!node.offsetParent; //check .parentNode?

const exec = (obj,...args)=>typeof obj === 'function' ? obj(...args) : obj;
const undef = (obj)=>typeof obj === 'undefined';


const isObj = (obj)=>!!obj && (typeof obj == 'object' && obj.constructor == Object);
const isContainer = (obj)=>Array.isArray(obj) || isObj(obj);

const isSame = (a,b)=>{
	if(a===b) return true;
	if(typeof a !== "object" || typeof b !== "object") return false;
	const A = Object.keys(a), B = Object.keys(b);
	if(A.length !== B.length) return false;
	return A.every(k=>isSame(a[k], b[k]));
};

const REAL = Symbol();
const NOOP = Symbol();

const proxify = (node, obj={})=>{
	if(typeof obj !== 'object' || obj[REAL]) return obj;
	Object.keys(obj).map(k=>{
		if(typeof obj[k] === 'object') obj[k] = proxify(node, obj[k]);
	});
	return new Proxy(obj, {
		get : (target, key)=>{
			if(key == REAL) return target;
			return target[key];
		},
		set : (target, key, value)=>{
			if(value === NOOP) return true;
			if(Array.isArray(value) && value[0] === NOOP){ target[key] = value[1]; return true;}
			if(isSame(target[key], value)) return true;

			target[key] = proxify(node, value);

			node.refresh();
		}
	});
};

const proxify2 = (cb, obj={})=>{
	return new Proxy(obj[REAL]??obj, {
		get : (target, key)=>{
			if(key == REAL) return target;
			if(typeof target[key] === 'object') return proxify2(cb, target[key]);
			return target[key];
		},
		set : (target, key, value)=>{
			if(key === NOOP) return true;
			if(isSame(target[key], value)) return true;
			target[key] = value[REAL] ?? value;
			cb();
		}
	});
};

//

// ctx.useEffect = ...
// ctx.state = {};
// ctx.el = node;

// node.ctx = new Proxy(ctx, {
// 	get : (target, key)=>{
// 		if(target[key]) return target[key];
// 		return target.states[key];
// 	},
// 	set : (target, key, value)=>{
// 		if(target[key]) return target[key] = value;
// 		target.states[key] = proxify2(node.refresh, value);
// 	},
// })



let xo = {};

let Templates = {};

const hash = (str)=>[...str].reduce((acc, char)=>{acc = ((acc<<5)-acc)+char.charCodeAt(0);return acc&acc; }, 0).toString(32);





// parse attributes
//look at children and correct
// loop over all children, if non-text recur


//Parser should take an array of htmlParts, then join together

//if(body.children.length > 1) throw `Multiple top level elements were returned in blueprint: ${htmlString}`;



//Move these within parser
const PH = String.fromCharCode(7);
const fill = (arr, func)=>arr.reduce((acc, val, idx)=>{ if(idx!==0){acc.push(func());} return acc.concat(val);}, []);
const createSlot = ()=>{ //add contional for adding PH to innerHTML
	//const slot = document.createElement('slot');
	const slot = document.createElement('xo-slot');
	slot.innerHTML = PH;
	return slot;
};

const parser = (htmlString, key)=>{
	const template = document.createElement("template");
	template.key = key;
	template.innerHTML = htmlString;
	template.slots = [];
	const parseElement = (el, path=[])=>{
		Array.from(el.attributes||[]).map(({name, value})=>{
			if(!value.includes(PH)) return;
			if(value !== PH) throw `Attribute '${name}' is overloaded`;
			el.removeAttribute(name);
			template.slots.push([name, ...path]);
		});
		if(el.childNodes.length === 1 && el.childNodes[0].nodeValue?.trim() === PH){
			template.slots.push(['innerHTML', ...path]);
			return el.removeChild(el.childNodes[0]);
		}
		for(let idx=0; idx < el.childNodes.length;idx++){
			let child = el.childNodes[idx];
			if(child.nodeName === "#text" && child.nodeValue.includes(PH)){
				//TODO: try setting the innerHTML to a string with <xo-slot>PH</xo-slot> replaced
				child.replaceWith(...fill(child.nodeValue.split(PH), createSlot)); //Move fill into here
				child = el.childNodes[idx];
			}
			if(child.nodeName !== "#text") parseElement(child, path.concat(idx));
		}
	};
	parseElement(template.content.firstElementChild);
	return template;
};



function Element(key, template, data){
	this.key = key; this.template = template; this.data = data;
};

function Component(key, func, args){
	this.key = key; this.func = func; this.args = args;
};

//TODO: replace hash() with Symbol.for()
const jsx = (strings, ...data)=>{
	const html = Array.isArray(strings) ? strings.join(PH) : strings;
	const key = hash(html);
	if(!Templates[key]) Templates[key] = parser(html, key);
	return new Element(key, Templates[key], data);
};
xo.x = jsx;

const comp = (func, key)=>{
	if(!key) key = hash(func.toString());
	return (...args)=>new Component(key, func, args);
};


const drawElement = (newElement, targetNode)=>{
	const newNode = newElement.template.content.firstElementChild.cloneNode(true);
	targetNode.replaceWith(newNode);

	//Grab new slots each time it's drawn
	newNode.slots = newElement.template.slots.map(([attr, ...path])=>{
		return {attr, el: path.reduce((acc, childIdx)=>acc.childNodes[childIdx], newNode) };
	});
	newNode.key = newElement.key;
	newNode.setAttribute('xo-key', newElement.key); //remove later
	return newNode;
};

const updateSlot = (el, data, attr='innerHTML')=>{
	// If el is a component, replace with a slot

	// if(el.tagName === 'COMPONENT'){
	// 	// let temp = createSlot();
	// 	// el.replaceWith(temp);
	// 	// el = temp;
	// 	el = replaceNode(el, createSlot());
	// }


	//TODO: do a check here for re-draws/paints


	if(attr=='innerHTML'){
		el.innerHTML = (data || data===0) ? data : '';
	}else if(attr=='class'){
		el.classList = data;
	}else if(typeof data === 'boolean'){
		el.toggleAttribute(attr, data);
	}else{
		el[attr] = data;
	}
	return el;
};



let Observer = new MutationObserver((changes, observer)=>{

	changes.map((evt)=>{
		const {removedNodes} = evt;


		console.log('REMOVED', removedNodes)

		//if(removedNodes.length && removedNodes[0].tagName === 'COMPONENT'){
		if(removedNodes.length && removedNodes[0].tagName === 'XO-COMPONENT'){ //TODO: double check this
			//unmountComponent(removedNodes[0]);

			window.requestAnimationFrame(()=>{
				if(!existsInDOM(removedNodes[0])) unmountComponent(removedNodes[0]);
			})
		}
	});


});

const replaceNode = (target, tag)=>{
	if(typeof tag === 'string') tag = document.createElement(tag);
	target.replaceWith(tag);
	return tag;
};


//make a createComponent, mountComponent, updateComponent, and unmountComponent functions
/*
maybe:
const Component = { create, is, mount, update, unmount }
const Template = { create, is, update }
const List = { is, update }
const Slot = { create, update }
*/

const mountComponent = (comp, node)=>{

	// const compEl = document.createElement('component');
	// node.replaceWith(compEl);
	// node = compEl;

	//Tyr to remove this and instead work on scope transfer
	node = replaceNode(node, 'xo-component');

	node.setAttribute('xo-key', comp.key);




	//add slot child
	node.appendChild(createSlot());
	node.key = comp.key;
	//node.mounted = false;
	//node.args = null;

	// Rest of set up
	node.refs = {};



	node.scope = {
		$ : node,
		refs : {},
		useEffect : ()=>{},
		refresh : ()=>{}

		// TODO: make the at weird proxy scope, where adding something that didn't exist creates a nested proxy
			// this.init(thing), on first run just exec(thing), then get's replaced by a NOOP sym
			// NOOP sym does not trigger the set func.
	};

	//node.ctx = new Proxy(node.scope, {});


	Observer.observe(node.parentNode, {childList : true});

	/*
	Should use this
	function onRemove(element, onDetachCallback) {
	    const observer = new MutationObserver(function () {
	        function isDetached(el) {
	            if (el.parentNode === document) {
	                return false;
	            } else if (el.parentNode === null) {
	                return true;
	            } else {
	                return isDetached(el.parentNode);
	            }
	        }

	        if (isDetached(element)) {
	            observer.disconnect();
	            onDetachCallback();
	        }
	    })

	    observer.observe(document, {
	         childList: true,
	         subtree: true
	    });
	}
	*/


	node.refresh = ()=>{
		//console.log('refreshing...')
		if(node._pending) return;
		node._pending = true;
		window.requestAnimationFrame(()=>execComponent(node));
		//console.log('REFRESHING')
		//TODO: Set a timeout
		;
	};

	node.state_counter = 0;
	node.states = [];
	node.useState = (init)=>{
		const idx = node.state_counter++;
		if(undef(node.states[idx])) node.states[idx] = exec(init);
		return [node.states[idx], (val, force=false)=>{
			if(node.states[idx] === val && !force) return;
			node.states[idx] = val;
			node.refresh();
		}];
	};


	//Switch to proxify2?
	node.state = proxify(node);
	// node.init = (initStates)=>{
	// 	Object.entries(initStates).map(([k,v])=>{
	// 		node.state[REAL][k] = proxify(node, v);
	// 	});
	// };

	node.init = (val)=>[NOOP,exec(val)]; //TODO: I think this should just be a exec(val);



	// node.effect_counter = 0;
	// node.effects = [];
	// node.uneffects = [];
	// node.useEffect = (func, args)=>{
	// 	const idx = node.effect_counter++;
	// 	if(!node.effects[idx]) node.effects[idx] = {};
	// 	if(undef(args) || !isSame(args, node.effects[idx].args)){
	// 		exec(node.uneffects[idx]);
	// 		node.effects[idx] = { func, args, flag : true };
	// 	}
	// };
	//node.flagged_effects = [];
	node.effects = [];
	node.useEffect = (func, args=true)=>{
		const idx = node.effects.counter++;
		if(!node.effects[idx]) node.effects[idx] = {func};
		if(undef(args) || !isSame(args, node.effects[idx].args)){
			exec(node.effects[idx].undo);
			node.effects[idx].args = args;
			node.effects[idx].flag = true;
		}
	};

	return node;
};

const unmountComponent = (node)=>{
	console.log('unmounting', node, node.effects)
	node.effects.map(effect=>exec(effect.undo));
	node.effects = [];
	//if(existsInDOM(node)) node = replaceNode(node, createSlot());
	//return node;
}

const execComponent = (node)=>{
	if(node._mounted && !existsInDOM(node)) return unmountComponent(node);
	node._pending = false;



	//node.state_counter = 0;
	//node.effect_counter = 0;
	node.effects.counter = 0;

	//console.log('RUNning comp', node.args)

	const result = node.func.apply(node, node.args);
	node.childNodes[0] = render(result, node.childNodes[0]);


	//node.mounted = true;
	node.init = ()=>NOOP;

	node.effects.map((eff, idx)=>{
		if(eff.flag){
			node.effects[idx].flag = false;
			node.effects[idx].undo = eff.func();
		}
	});


};

//TODO: Make a catch-all type() function that checks for type symbols and does duck-typing if it can't find it
	// Used for Blueprints, Nodes, Components, and Data

//Replace with obj[TYPE] === 'thing'
const isComponent = (obj)=>obj instanceof Component || obj.func;
const isBlueprint = (obj)=>obj instanceof Blueprint || obj.slots;
const isList = (obj)=>Array.isArray(obj) || (typeof obj == 'object' && obj.constructor == Object);


const render = (val, targetNode, attrName)=>{
	if(val instanceof Component){
		if(targetNode.key !== val.key){
			targetNode = mountComponent(val, targetNode);
		}
		if(!isSame(targetNode.args, val.args)){
			targetNode.args = val.args;
			execComponent(targetNode);
		}
		return targetNode;
	}else if(targetNode.func){ //TODO: do a better comp check
		//unmount here
		//targetNode = unmountComponent(targetNode);

		targetNode = replaceNode(targetNode, createSlot());
	}


	if(val instanceof Element){
		if(targetNode.key !== val.key) targetNode = drawElement(val, targetNode);
		//console.log('slots', targetNode, targetNode.slots)
		return val.data.map((datum, idx)=>{
			const slot = targetNode.slots[idx];
			targetNode.slots[idx].el = render(datum, slot.el, slot.attr);
		});

		return targetNode;
	}


	if(isContainer(val) && (!attrName || attrName == 'innerHTML')){
		targetNode.items = targetNode.items ?? {};
		//TODO: cache keys, replace with filter=>map

		if(targetNode.key !== Object.keys(val).join('|')){
			Object.keys(targetNode.items).map(oldKey=>{
				if(val[oldKey]) return;
				targetNode.removeChild(targetNode.items[oldKey]);
				delete targetNode.items[oldKey];
			});
			Object.keys(val).map((newKey, idx)=>{
				let itemNode = targetNode.items[newKey] || createSlot();
				if(itemNode !== targetNode.childNodes[idx]) targetNode.append(itemNode);
			});
			targetNode.key = Object.keys(val).join('|');
		}
		Object.keys(val).map((newKey, idx)=>targetNode.items[newKey] = render(val[newKey], targetNode.childNodes[idx]));
		return targetNode;
	}

	return updateSlot(targetNode, val, attrName);

}

