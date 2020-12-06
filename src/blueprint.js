Library = (window || {}).Library || {};


//-------------

const parser = (htmlStrings)=>{
	console.log(htmlStrings)
	console.log(Utils.hash(htmlStrings.join('')))
	throw `Not implemented yet`;

	/*
	Converts the HTML strings into a structure like this:

	return {
		id: '32456',
		html : '<div></div>'
		slots: [
			{path:[0], attr: 'innerHTML'}
		]
	}
	*/
}



const x = (strings, ...data)=>{
	const blueprintId = Utils.hash(strings.join('').replaceAll('\t', '').replaceAll('\n', ''))

	if(!Library[blueprintId]){
		Library[blueprintId] = parser(strings);
	}
	return {
		//...Library[blueprintId],
		bp_id : blueprintId,
		data
	}
}


const BP = {
	draw : (element, bp)=>{
		const {html, slots, data} = bp;
		const el = Utils.replaceElement(element, html);
		return el;
	},
	//Surgical Update
	update : (element, bp, oldData=[], apply=(el,attr,val,idx)=>el[attr]=val)=>{
		const {html, slots, data} = bp;
		data.map((val, idx)=>{
			const {path, attr} = slots[idx];
			const oldVal = oldData[idx];

			if(!Utils.isSame(oldVal, val)){
				const targetEl = Utils.extract(element, path);
				apply(targetEl, attr, val, idx);
			}
		});
	}

}
