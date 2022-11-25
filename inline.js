const inline = (()=>{
	const wrap=(tag)=>new RegExp(`(?<=\\W|^)\\${tag}(.+?)\\${tag}(?=\\W|$)`,'gm');
	const rules = [
		[wrap('_'), (_,a)=>`<em>${a}</em>`],
		[wrap('*'), (_,a)=>`<strong>${a}</strong>`],
		[wrap('~~'), (_,a)=>`<del>${a}</del>`],
		[/!\[([^\]]*)\]\((.*?)\)/gm, (_,a,b) => `<img alt='${a}' src='${b}'></img>`],
		[/\[([^\]]+)\]\((.*?)\)/gm, (_,a,b) => `<a href='${b}'>${a}</a>`],
		[/^-{3,}/gm ,()=>`<hr />`],
		[/(?<=\W|^){{([\w,]+)\s*/gm, (_,a)=>`<div${a?` class="${a.replace(/,/g, " ")}"`:''}>`],
		[/}}(?=\W|$)/gm, ()=>`</div>`],
	];
	return (str)=>{
		let codetags = [];
		return rules.reduce((acc, [rgx, fn])=>acc.replace(rgx, fn),
				str.trim().replace(wrap('`'), (_,a)=>{codetags.push(a);return '¸';}))
			.replace(/¸/g, ()=>`<code>${codetags.shift()}</code>`);
	};
})();

module.exports = inline;

/* TEST



console.log(inline(`

	g *hello!* \`this should be in code\`

	[*link bahbee*](https://www.thingiverse.com/wingforce/collections/temp-tower)

	this ~~strikeout~~

	this *is a test* yes though

	this *is a test*


	{{ test

	{{these3,are_classes okay }}

	{{these3,are_classes okay }} yo

	afoou

	g _hello!_

	[_link bahbee_](https://www.thingiverse.com/wingforce/collections/temp-tower)

	this_ should not work _

	this _is a test_ yes though

	this _is a test_

`));

*/