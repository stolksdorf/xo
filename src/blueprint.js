Library = (window || {}).Library || {};

let dp = new DOMParser();
const str2Dom = (str)=>{
	return dp.parseFromString(str, 'text/html').querySelector('body').children[0];
};

//TODO: this should just be built into the parser
const weave = (arr, func)=>{
	return arr.reduce((acc, val, idx)=>{
		console.log('|'+val+'|')
		if(val != "") acc.push(val);
		if(idx < arr.length-1) acc.push(func(acc.length));
		return acc;
	},[])
};


//the parser is counting text node, the real html is not, resulting in a slot id mismach

const PH = `_____`;
const parser = (htmlStrings)=>{
	let node = str2Dom(htmlStrings.join(PH));
	let slots = [];
	const parseElement = (el, path=[])=>{
		console.log('VAL', el.nodeValue)
		if(el.nodeName == "#text" && el.nodeValue.indexOf(PH) !== -1){
			console.log('CURRENT PATH', path)
			console.log(el.nodeValue);
			console.log(el.nodeValue.split(PH), path)
			//TODO: try to replace weave


			//const [...first, last] = path;
			//path : first.concat(idx + last),
			let temp =weave(el.nodeValue.split(PH), (idx)=>{
				slots.push({
					//path : path.slice(0,-1).concat(idx),
					path : path.slice(0,-1).concat(idx + path[path.length-1]),
					attr : 'innerHTML'
				});
				return document.createElement("slot")
			})
			console.log(temp)
			el.replaceWith(...temp)
		}
		if(el.attributes){
			Array.from(el.attributes).map(({name, value})=>{
				if(value.indexOf(PH) !== -1){
					if(value !== PH) throw `Element attribute '${name}' is overloaded`;
					slots.push({ path, attr: name });
					el.removeAttribute(name);
				}
			});
		}

		if(el.childNodes){
			console.log(el.childNodes)
			Array.from(el.childNodes)
				.map((child, idx)=>parseElement(child, path.concat(idx)))
		}
	}
	parseElement(node);
	return { slots, node,
		html : node.outerHTML
	 }
};

const x = (strings, ...data)=>{
	const blueprintId = Utils.hash(strings.join(''));
	if(!Library[blueprintId]){
		console.log(blueprintId)
		Library[blueprintId] = parser(strings);
	}
	console.log('LIB', Library)
	return {
		...Library[blueprintId],
		bp_id : blueprintId,
		data
	}
};

const draw = ($target, {slots, html, data, node})=>{
	//const el = str2Dom(html);
	console.log('DRAW', html, node, slots)
	const el = node.cloneNode(true);
	$target.replaceWith(el);
	return el;
};

// const draw = ($target, {slots, html, data})=>{
// 	const el = str2Dom(html);
// 	$target.replaceWith(el);
// 	return el;
// };

// const update = ($target, {slots, html, data}, oldData=[])=>{
// 	slots.map((slot, idx)=>{
// 		if(data[idx] === oldData[idx]) return;
// 		// const $el = slot.path.reduce(($el, i)=>{

// 		// 	return $el.childNodes[i]
// 		// }, $target);

// 		const $el = slot.path.reduce(($el, i)=>$el.childNodes[i], $target);
// 		if(typeof data[idx] === 'boolean'){
// 			$el.toggleAttribute(slot.attr, data[idx]);
// 		}else{
// 			$el[slot.attr] = data[idx];
// 		}
// 	})
// };

//TODO: bump out the path walking function (name? walk?)

const surgicalUpdate = ($target, slot, val)=>{ //might split slot to path and attr
	console.log($target, slot.path)
	const $el = slot.path.reduce(($el, i)=>$el.childNodes[i], $target);
	console.log('update', $el, slot.attr, val)
	if(typeof val === 'boolean'){
		$el.toggleAttribute(slot.attr, val);
	}else{
		$el[slot.attr] = val;
	}
}

const BP = {
	draw,
	//update,
	surgicalUpdate,


	x
	// draw : (element, bp)=>{
	// 	const {html, slots, data} = bp;
	// 	const el = Utils.replaceElement(element, html);
	// 	return el;
	// },
	// //Surgical Update
	// update : (element, bp, oldData=[], apply=(el,attr,val,idx)=>el[attr]=val)=>{
	// 	const {html, slots, data} = bp;
	// 	data.map((val, idx)=>{
	// 		const {path, attr} = slots[idx];
	// 		const oldVal = oldData[idx];

	// 		if(!Utils.isSame(oldVal, val)){
	// 			const targetEl = Utils.extract(element, path);
	// 			apply(targetEl, attr, val, idx);
	// 		}
	// 	});
	// }

}
