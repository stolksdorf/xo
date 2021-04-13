/***

These functions provide a _very_ lightweight functional DOM framework, similar to React.
Provide it a top-level functional component and an init state and this will render it into the DOM.
Whenever the State is mutated by `app.update` the entire thing re-renders.
Note: It lacks a virtual dom, but should be fine for small apps.

`h` function allows the developer to write html as tagged template literals directly into js without
transpiling or Babel. It uses the small lib `hyperx` to parse the literals.

***/


(function(){

const shallowCompare = (obj1, obj2) =>
	Object.keys(obj1).length === Object.keys(obj2).length &&
	Object.keys(obj1).every(key =>
		obj2.hasOwnProperty(key) && obj1[key] === obj2[key]
	);


const json2dom = ({tag, attrs={},children=[]})=>{
	let element = document.createElement(tag);
	Object.keys(attrs).map((key)=>{
		element[key] === null
			? element[key] = attrs[key]
			: element.setAttribute(key, attrs[key])
	});
	children.map((_child)=>{
		if(!_child) return;
		element.appendChild(typeof _child != 'object'
			? document.createTextNode(_child)
			: json2dom(_child)
		);
	});
	return element;
};

window.h = window.hyperx((tag, attrs, children)=>{
	if(typeof tag === 'function') return tag({children, ...attrs});
	return {tag, attrs, children}
});

window.createApp = (rootComp, initState={}, rootNode)=>{
	const app = {
		state : initState,
		update : (newState)=>{
			if(shallowCompare(app.state, newState)) return;
			app.state = {...app.state, ...newState};
			app.render();
		},
		render : ()=>{
			//console.log(rootComp());
			const dom = json2dom(rootComp());
			rootNode.replaceWith(dom);
			rootNode = dom;
		},
	}
	return app;
};

})()