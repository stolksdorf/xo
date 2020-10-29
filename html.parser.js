/*

Experiments in quickly parsing HTML template strings

*/

const PLACEHOLDER = '{{}}';

const foo = 'content'


const h = (strings,b)=>{


	const states = {
		tagDef : false,
		intag : false
	}

	let inTag = false;
	let result ='';
	let stack = [];
	let paths = [];


	let text = []
	strings.map((string)=>text=text.concat(string.split('')).concat('TARGET'))
	text.pop();

	let i = 0;

	const until = (target, slush='')=>{
		console.log(i, text[i])
		if(text[i] == target) return slush;
		return until(target, slush+text[i++])
	}

	while(i < text.length){
		const char = text[i];

		if(char == '<' && !inTag){
			result = until(' ');
		}


		i++;
	}




	console.log(text)
	console.log(result)
	console.log(paths)
}



h`<div>yo</div>`
h`<div>Hello ${foo}</div>`
