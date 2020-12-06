let treeCache={children:[]}
let Tree = {
	get : (path)=>{
		let currPath=[]
		return path.reduce((acc, idx)=>{
			if(!acc.children[idx]){
				acc.children[idx] = {
					path: currPath.concat(idx),
					children:[]
				};
			}
			currPath.push(idx)

			return acc.children[idx];
		}, treeCache);
	},
	merge : (path, data)=>{
		const last = path[path.length-1]
		let obj = Tree.get(path.slice(0,-1));
		obj.children[last] = {
			...obj.children[last] || {path, children:[]},
			...data
		};
	},
	del : (path)=>{
		const last = path[path.length-1]
		let obj = Tree.get(path.slice(0,-1));
		delete obj.children[last]
	},

	walk : (func, startingPath=[0])=>{

	}
};



/*
add: (id, parentId)=>{
	creates new obj, with id, and children
	adds it to the descendant of the parent
	returns the new obj
}

merge : (id, data)=>{

}



*/






// console.log(Tree.get([0, 1,2,3]))

// console.dir(treeCache, {depth:13})

// console.log(Tree.get([0,1]))



Tree.merge([0,1], {
	foo: true
});

Tree.merge([0,1], {
	a : 'holla'
});

console.log(Tree.get([0,1]))


console.dir(treeCache, {depth:13})



console.dir(treeCache, {depth:13})


