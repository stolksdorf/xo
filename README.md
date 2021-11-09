# 🏗️ `xo`

> An incredibly tiny React-clone, aiming for simplicity and hack-ability. _Short for "Exo-skeleton"_







*features*
- "Cup of Coffee readable": read and understand the source code over a single cup of coffee
- Under 300 lines of code
- No dependacies
- Basic Hooks support: `useState`, `useEffect`
- No special markup, no transpiling. All code written with `xo` is vanilla javascript
- Server-side Rendering
- Built-in handy utils: `cx`, `keymap`, `useAsync`



### How to Use

If you are familar with React, `xo` will feel incredibly similar.




## How it Works

No V-dom. Most the HTML of a web app does not change when data changes. `xo` uses "surgical updates" that only executes the smallest number of DOM operations per data change, without doing large-scale diffing.

Uses a tree structure.
each node is one of 4 types: Data, Blueprint, Component or List





###










---------


1. a templating function returns in format:

```js

x`<div class="${foo}">
	<label>yo</label>
	<button onclick=${handler}>${text}</button>
</div>`

{
	template : `<div class="">
	<label>yo</label>
	<button onclick=""></button>
</div>`,
	update : [
		(val, root)=>root.className=val,
		(val, root)=>root.children[1].onclick=val,
		(val, root)=>root.children[1].innerHTML=val,
	],
	data : [
		foo,
		handler,
		text
	]
}

```

This can produce a template-tree if there are nested components.
This should produce template tags into the template cache



2. A render function, takes a template-tree, a target, and a cache-tree (optional)

iterates over the template-tree, if no entry is in the cache tree, create the new elemtn in DOM. If it exists do a cache compare and trigger the needed update functions, and update the cache.

In the cache functions and sub components get special treatment.



--------------------------


reeeeeeeeaaaaaaaaaallll quick tl;dr. I came up with a weird idea for a front-end framework (like vue or react) a while ago, and just recently started sketching it out.
kk, it's built in two parts
1. You write components functionally like new react, except you use "tagged template literals" instead of JSX.
eg. x<a href=${link}>${text}</a>
This produces two arrays, the first with all the string parts, and the second with all the injected data. Cool, so this part does a HTML parse through this input and figures out how to modify each injected data field if it was in the DOM, eg. 1) modify the root elements href attr, and 2) modify the root element's innerHTML. I call these "surgical" updates.
This work is then cached. Cool cool cool.
2. Rendering. You give a target DOM element to render in to and a top-level component (this may have nested components). It loops through and builds out a "cache-tree" of both reference nodes in the DOM and the injected data values for each rendered element. Remember that each data value has an associated "surgical update" function, so on subsequent renders, it uses this cache-tree on only if the data fields change does it call the surgical update with the new value on the cached reference node.
15:53
so instead of keeping a virtual-dom and doing complicated diffs, this framework is some simple tree-traversal and simple dom calls on each update.