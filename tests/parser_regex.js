
const parse = (rules, text)=>{
	const Rules = Object.entries(rules).map(([rgx, fn])=>[new RegExp(rgx),fn]);
	let remaining = text, result = [];
	while(remaining.length > 0){
		let match = Rules.reduce((best, [rgx, fn])=>{
			let match = rgx.exec(remaining);
			if(!match) return best;
			if(!best || match.index < best.index){ match.func = fn; return match; }
			return best;
		}, false);
		if(!match) break;
		const [matchedText, ...groups] = match;
		result.push(match.func(groups, matchedText, remaining.substring(0,match.index)));
		console.log('here', remaining, typeof remaining)
		remaining = remaining.substring(match.index + matchedText.length);
	}
	return result;
};


const htmlParse = (str)=>{

	console.log(str)


	//AttrParse

	let objs = [];
	let curr;


	const attrParse = ()=>{

	}

	parse({


		//start_tag
		'<([a-zA-Z0-9_]+)' : ([tag])=>{
			console.log('open', tag)
		},

		//end_tag

		//close_tag

	}, str)
}


const weave = (arr, func)=>{
	return arr.reduce((acc, val, idx)=>{
		acc.push(val);
		if(idx < arr.length-1) acc.push(func(idx))
		return acc;
	},[])
};

const PH = `_____`; //TODO: replace with weirder string, some unicode garbo?
const x = (strs, ...data)=>{
	let node = strs.join(PH);
	let slots = [];

	const html = htmlParse(node);


	return { slots, data, html : html }
};

//////////////////////////////////

const draw = (target, {slots, html, data})=>{
	const el = str2Dom(html);
	target.replaceWith(el);
	return el;
}

const update = (target, {slots, html, data})=>{
	slots.map((slot, idx)=>{
		const el = slot.depth.reduce((el, i)=>el.children[i], target);
		if(typeof data[idx] === 'boolean'){
			el.toggleAttribute(slot.attr, data[idx]);
		}else{
			el[slot.attr] = data[idx];
		}
	})
};

//////////////////////


const res = x`<div class="${'foo'}"  readonly=${false}>oh ${'hello'} there ${'scoot'}</div>`

console.log(res)

let $root = document.getElementById('root')

$root = draw($root, res);
update($root, res);

/* ---------------------------- */

// const color = 'blue', onClick =()=>alert('hey'), label='yo', link='sdfsdf'


// const template = x`<div class='Counter' style="background-color:white; color:${color}" onclick=${onClick}>
// 	<span>${label}</span>
// 	${"some text"}
// 	<div>
// 		<a href=${link}>Check out this vid</a>
// 	</div>
// </div>`


// console.log(template);
