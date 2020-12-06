let treeCache={}
let Tree = {
	get : (path)=>treeCache[path],
	make : (parentId)=>{
		let id
		if(typeof parentId === 'undefined'){
			id = '';
		}else{
			id = parentId+''+treeCache[parentId].children.length;
			treeCache[parentId].children.push(id);
		}
		treeCache[id] = { id, children: [] }
		return treeCache[id]
	},
	set : (path, data)=>{
		treeCache[path] = {
			...treeCache[path],
			...data
		}
		return treeCache[path]
	},
	del : (path)=>{
		Tree.get(path).children.map(Tree.del);
		treeCache[path.slice(0,-1)].children = treeCache[path.slice(0,-1)].children.filter(x=>x!=path);
		delete treeCache[path];
	},
};




/*
	- add in automatic id/path generation
*/


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


const foo = Tree.make()

Tree.make(foo.id);
const bar = Tree.make(foo.id);

Tree.make(bar.id);

console.log('bar', bar.id)
Tree.set(bar.id, {foo: true, a: 'b'})

console.log()


console.dir(treeCache, {depth:13})

Tree.del('1')



console.dir(treeCache, {depth:13})


