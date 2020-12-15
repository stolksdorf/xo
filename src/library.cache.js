//TODO: should depricate

Library = (window || {}).Library || {};

// [{
// 	html : `<div><h1></h1><slot></slot></div>`,
// 	// update : [
// 	// 	(root, val)=>root.children[0].innerHTML=val,
// 	// 	(root, val)=>root.children[1].innerHTML=val,
// 	// ],
// 	slots : [
// 		{path: ['children', 0], attr: 'innerHTML'},
// 		{path: ['children', 1], attr: 'innerHTML'}
// 	]
// },

// {
// 	html:`<button onclick=></button>`,
// 	slots : [
// 		{path: [], attr: 'onclick'},
// 		{path: [], attr: 'innerHTML'}
// 	]
// },


// {

// 	html : `<a href></a>`,
// 	//update : [],
// 	slots : [
// 		{path: [], attr: 'href'},
// 		{path: [], attr: 'innerHTML'}
// 	]
// },

// {
// 	html : `<div><button onclick=>inc</button><div></div></div>`,
// 	slots : [
// 		{path: ['children', 0], attr: 'onclick'},
// 		{path: ['children', 1], attr: 'innerHTML'}
// 	]
// },

// {
// 	html: `<div><div></div><div></div></div>`,
// 	slots : [
// 		{path: ['children', 0], attr: 'innerHTML'},
// 		{path: ['children', 1], attr: 'innerHTML'}
// 	]
// },

// ].map((bp)=>{
// 	const id = Utils.hash(bp.html);
// 	Library[id] = {id, isBP:true, ...bp};
// })