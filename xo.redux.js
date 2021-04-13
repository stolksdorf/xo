const TYPE = Symbol();

const mount = (obj, node)=>{
	const type = getType(obj);

	node = {
		el : node.el,
		attr : node.attr,
		type,
	}

	if(type == 'bp'){
		const bp = Library[obj.key];
		node.el = draw(node.el, bp.dom);
		node.children = obj.data.map((datum, idx)=>{
			const {path, attr}=bp.slots[idx];
			return { el : extract(node.el, path), attr };
		});
	}
	if(type =='comp'){
		node.effects = [];
		node.states = [];
		node.refs = {};
		node.args = undefined;
		node.children = [{el : node.el}];
	}
	if(type=='list'){
		node.el.innerHTML = '';
		node.children = {};
	}
	if(type=='data') node.val = Symbol();
	return node;
};

const unmount = (node)=>{
	if(node.effects){
		node.effects.map(({cleanup})=>exe(cleanup));
	}
	if(node.children){
		Object.values(node.children).map(unmount);
	}
	if(getType(node) == 'bp'){
		node.el = draw(node.el, document.createElement('slot'));
	}
	return {el:node.el, attr:node.attr};

};

const render = (obj, node)=>{
	const type = getType(obj), key = getKey(obj);

	if(type !== node.type || key !== node.key){
		node = mount(obj, unmount(node));
	}


	if(type == 'bp'){
		obj.data.map((val, idx)=>{
			node.children[idx] = render(val, node.children[idx])
		});
	}
	if(type =='comp'){
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
	}
	if(type=='list'){
		Object.keys(node.children).filter(k=>undef(obj[k])).map(key=>{
			unmount(node.children[key]);
			node.children[key].el.remove();
			delete node.children[key];
		});
		Object.entries(obj).map(([key, val])=>{
			if(undef(node.children[key])){
				node.children[key] = mount(val, {el : document.createElement('slot')});
			}
			node.children[key] = render(val, node.children[key]);
			node.el.appendChild(node.children[key].el);
		});
	}
	if(type=='data'){
		if(!isSame(obj, node.val)){
			node.el = update(node.el, node.attr, obj);
			node.val = obj;
		}
	}
	return node;


};













const executeComp = (comp, node)=>{
	let stateCounter=0,effectCounter=0;
	node.useState = (init)=>{
		let idx = stateCounter++;
		if(undef(node.states[idx])) node.states[idx] = exe(init);
		return [node.states[idx], (val)=>{
			node.states[idx] = val;
			node.args = undefined;
			node = render(comp, node);
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
		if(!isListSame(args, node.effects[idx].args)){
			exe(node.effects[idx].cleanup);
			node.effects[idx].flag = true;
		}
	}
	node.forceRender = ()=>{
		node.args = undefined;
		node = render(comp, node);
	};
	return comp.func.apply(node, comp.args);
};




const x = (strings, ...data)=>{
	const key = hash(strings.join(PH));
	if(!Library[key]) Library[key] = Parser(strings);
	return {
		type: 'bp',
		data,
		key,
	 }
};

const comp = (func)=>{
	const key = hash(func.toString());
	return (...args)=>{
		return {
			type: 'comp',
			func,
			args,
			key
		}
	};
};

