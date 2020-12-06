// const hash = (str)=>{
// 	return [...str].reduce((acc, char)=>{
// 		acc = ((acc<<5)-acc)+char.charCodeAt(0);
// 		return acc&acc;
// 	}, 0)
// };




// const Blueprints = {
// 	'-2086389526' : {
// 		html : `<div><h1></h1><slot></slot></div>`,
// 		update : [
// 			(root, val)=>root.children[0].innerHTML=val,
// 			(root, val)=>root.children[1].innerHTML=val,
// 		],
// 		slots : [
// 			{path: ['children', 0], attr: 'innerHTML'},
// 			{path: ['children', 1], attr: 'innerHTML'}
// 		]

// 	},
// 	'lonk': {
// 		html : `<a href></a>`,
// 		update : [],
// 		slots : [
// 			{path: [], attr: 'href'},
// 			{path: [], attr: 'innerHTML'}
// 		]
// 	}
// }


// // Blueprints
// // 	`<div>
// // 			<h1></h1>

// // 		</div>
// // `:

// // }


// const x = (strings, ...data)=>{
// 	const blueprintId = hash(strings.join(''))

// 	return {
// 		...Blueprints[blueprintId],
// 		data
// 	}
// }