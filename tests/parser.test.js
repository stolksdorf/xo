const xo = require('../xo2.js');
const {x, comp, render} = xo;


module.exports = ()=>{


	let name = 'scoot';

	const func = ()=>alert('yo');



	const template = x`<div onclick=${func}>
		oh hello ${name}! ${true}
		<button disabled=${true}>${name}</button>
	</div>`;

	console.log(template)

	window.temp1 = template.tmpl;


	const template2 = x`<div onclick=${func}>
		oh hello ${name}! ${true}
		<button disabled=${true}>${name}</button>
	</div>`;

	console.log(template2);


	// console.log(template);

	// Root = render(template, Root);


	// name = 'scoot';

	// Root = render(x`<div onclick=${func}>oh hello ${name}!</div>`, Root);


	// console.log('TEST2');

	// const temp = x`<div id=${'a'} onclick=${'b'}>
	// 		${'c'}: <em>${'d'}</em> hey !${'e'} <a>lonk</a>
	// 	</div>`
	// ;

	// console.log('HERE');

	// Root = render(temp, Root);
};