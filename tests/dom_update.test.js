const xo = require('../xo2.js');
const {x, comp, render} = xo;


Number.prototype.reduce = function(func, acc){ for(let idx=0;idx<this;idx++){ acc=func(idx,idx,idx); } return acc };
Number.prototype.each = function(func){ this.reduce(func); };


let lastval;

const changeHTML = (func, uselast=false)=>{
	//let val = (uselast && lastval) ? lastval : `<div>${Math.random()}</div>`;
	let val = (uselast && lastval) ? lastval : Math.random();
	func(Root, val, 'innerHTML');
	lastval = val;
};

const changeAttr = (func, uselast=false)=>{
	let val = (uselast && lastval) ? lastval : Math.random() + '';
	func(Root, val, 'id');
	lastval = val;
};

const changeBool = (func, uselast=false)=>{
	let val = (uselast && lastval) ? lastval : Math.random() > 0.5;
	func(Root, val, 'checked');
	lastval = val;
};

const changeClass = (func, uselast=false)=>{
	let val = (uselast && lastval) ? lastval : [Math.random(), Math.random()];
	func(Root, val, 'class');
	lastval = val;
};

const changeHandler = (func, uselast=false)=>{
	let val = (uselast && lastval) ? lastval : ()=>alert('yo');
	func(Root, val, 'onclick');
	lastval = val;
};

const funcs = {changeHTML, changeAttr, changeBool, changeClass, changeHandler};




module.exports = ()=>{

	Object.entries({
		base: xo.updateDOM,
		old: xo.updateDOM_old,
		//store: xo.updateDOM_store
	}).map(([group, _func])=>{
		console.log(`----${group}-------`);



		Object.entries(funcs).map(([name, func])=>{

			var t0 = performance.now();
			(30000).each(i=>{

				func(_func, Math.random() > 0.099);

			});

			var t1 = performance.now();
			console.log(name, (t1 - t0).toFixed(2) );


		})





	});



};