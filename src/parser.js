Library = (window || {}).Library || {};

const dp = new DOMParser();
const PH = `_____`, PE='slot';

const str2Dom = (str)=>dp.parseFromString(str, 'text/html').querySelector('body').children[0];
const weave = (arr, func)=>{
	return arr.reduce((acc, val, idx)=>{
		return (idx < arr.length-1) ? acc.concat(val, func(acc.length + 1)) : acc.concat(val)
	},[])
};
const createSlot = ()=>{
	const temp = document.createElement(PE);
	temp.innerHTML = PH;
	return temp;
};

const Parser = (htmlStrings)=>{
	let dom = str2Dom(htmlStrings.join(PH)), slots = [];
	const insertSlots = (el)=>{

		if(el.nodeName == "#text" && el.nodeValue.indexOf(PH) !== -1){
			el.replaceWith(...weave(el.nodeValue.split(PH), createSlot));
		}
		if(el.childNodes) Array.from(el.childNodes).map(insertSlots);
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
		el.classList = val.split(' ');
	}else{
		if(typeof val === 'boolean'){
			el.toggleAttribute(attr, val)
		}else{
			el[attr] = val;
		}
	}
	return el;
};
const x = (strings, ...data)=>{
	const key = Utils.hash(strings.join(''));
	if(!Library[key]) Library[key] = Parser(strings);
	return { type: 'bp', id : key, data, key }
};
