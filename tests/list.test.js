const xo = require('../xo2.js');
const {x, comp, render} = xo;

module.exports = ()=>{

	const list = [
		'a', 'b', 'c'
	];

	const tmpl = x`<ul>${list.map(item=>{
		return x`<li onclick=${()=>alert(item)}>${item}</li>`;
	})}</ul>`;

	console.log(tmpl);

	Root = render(tmpl, Root);
};