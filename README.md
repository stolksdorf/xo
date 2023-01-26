# 🏗️ `xo`

> An incredibly tiny React-clone, aiming for simplicity and hack-ability.


*features*
- "Cup of Coffee readable": read and understand the source code over a single cup of coffee
- Under 300 lines of code
- No dependencies
- Basic Hooks support: `useState`, `useEffect`
- No transpiling, no special markup, . Uses tagged template strings for HTML templates.
- All code written with `xo` is vanilla javascript
- Server-side Rendering is supported
- Built-in handy utils: `cx`, `keymap`, `useAsync`



### Install

[![npm version](https://badge.fury.io/js/pico-xo.svg)](https://badge.fury.io/js/pico-xo)

You can install it via NPM, however I suggest just copying the `xo.js` file directly into your project. It's only 300lines with no dependencies, so it's nice to be able to easily inspect the source and hack on changes if you see fit for your project.


### How to Use

If you are familar with React, `xo` will feel incredibly similar. You create components by making functions that return `blueprints` or other components. Then use `xo.render([your top-level component], [target element])` to render your component into a target DOM element. You're done! 🎉

*Example*
```js
const {x, comp, render} = require('pico-xo');

const NameWidget = (name)=>{
	return x`<h3>${name}</h3>`;
};

const MyApp = comp(function(name){
	const [clicks, setClicks] = this.useState(0);

	return x`<div onclick=${()=>setState(clicks+1)}>
		Hello ${NameWidget(name)}, you have clicked this ${clicks} times.
	</div>`;
});

render(MyApp('Mark'), document.body.children[0]);
```

In this example `xo.comp` is wrapping a function and turning it into a `component` that has Hooks attached to it's scoped `this`. `xo.x` takes a template string that describes HTML along with "holes" where other values should go, this is called a `blueprint`. `xo` will render the HTML to the DOM, and then update each of the "holes" with their corresponding values (which can be any javascript value, including other `blueprints` and/or `components`). If any of those values would change (such as via `useState`), `xo` will only update the exact value that has changed, no other values, and does not re-draw the HTML to the DOM. We call these "surgical updates".

This technique was based on [lit-html](https://lit-html.polymer-project.org/guide).



`xo` has 4 "types" to build your UI


1. **Blueprints**

Blueprints are [tagged template strings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) that describe what the HTML should look like. Using expression placeholders in the template string let you inject and update markup without needing to re-draw the entire element each time there's a change. 

Under the hood, `xo` creates `<template>` elements with the associated markup and tracks where each placeholder is within the markup to make updates as efficient as possible. For a deeper dive check out the [How it works]() doc.


```js
let name = 'Guest', isFancy = true;

xo.render(xo.x`<div class=${isFancy?'fancy':''}> Hello ${name}! </div>`, document.body);

// Draws `<div class=""> Hello <span></span>! </div>` into the body
// Then sets .classList to ['fancy'] and the spans's innerHTML to 'Guest'

name = 'Scott';
xo.render(xo.x`<div class=${isFancy?'fancy':''}> Hello ${name}! </div>`, document.body);

// Since this blueprint has the same key as what's already in the body, don't need to draw anything new
// isFancy did not change, so no need to modify the classList
// Only the span's innerHTML gets updated. The entire `xo.render` call resulted in a single DOM call.
```


2. **Components**

Components are stateful functions that return one of the 4 types to render (usually a blueprint). The function's scope is populated with the element it's rendering to, [hooks](#Hooks), and other useful utilities. The function is called whenever the component needs to update, whether it's arguments have changed, it's state has been modified, or it's been manually triggered to re-render.


```js

const Counter = xo.comp(function(initVal){
	const [counter, setCounter] = this.useState(initVal);
	return xo.x`<div class='Counter'>
		Clicked ${counter} times!
		<button onclick=${()=>setCounter(counter+1)}>Increment</button>
	</div>`;
});

xo.render(Counter(0), document.body);
```

3. **Lists**

[Lists](https://reactjs.org/docs/lists-and-keys.html) are javascript arrays or plain objects that are trying to be rendered into the `innerHTML` of an element, essentially. Mostly used for collections of components or blueprints. 

If the list is an object, `xo` will not re-mount items that share the same key between re-renders, essentially replicating [React's Key system](https://reactjs.org/docs/lists-and-keys.html#keys) without needing extra markup or attributes. This is useful for lists of components that need to maintain state, but could be re-arranged, added, or removed dynamically.


4. **Data**

Basically everything else: Strings, numbers, booleans, functions, etc. Data is rendered into a DOM Node at a specific attribute name. `xo` has internal logic to figure out the best way to update the DOM based on the type of the data and the attribute it's updating.




### API

- `xo.render(xo type, DOM node, [attribute name='innerHTML'])`: Renders the `xo object` into the DOM node at the `attribute name`. Usually only need to call this once to kick off your app.
- `xo.comp(renderFunction)`: Creates a new `xo` Component function that can be used in other Components or Blueprints.
- `xo.x`: Tagged template string function that returns a new Blueprint based on the template string.



### Utils

- `xo.cx(arg1, arg2,...)`: An implementation of [npm classnames](https://www.npmjs.com/package/classnames)
- `xo.eq(a,b)`: A fast deep comparison util.
- `xo.type(arg, [setType])`: A lightweight object typing util. Used to identify Component, Blueprint, and State objects from regular objects.
- `xo.hash()`: Very simple string hashing function. `xo` uses string hashes for component and blueprint keys. Feel free to swap out the hash function if you need to.











## How it Works

No Virtual DOM! Most the HTML of a web app does not change when data changes. `xo` uses "surgical updates" that only executes the smallest number of DOM operations per data change, without doing large-scale diffing. At it's core `xo` uses a tree structure of nodes that can be of one of 4 types; Data, Blueprints, Components, or a List.

This would be the tree structure from the above example:

```
root
 - component (MyApp)
   - blueprint (div)
     - data (click function)
     - blueprint (h3)
       - data (name string)
     - data (click number)
```

#### Data
A data node can be any value; functions, booleans, strings, numbers, nulls (not arrays or objects, see Lists). `xo` will do a strict comparison between the old value and the new value when determining if it should do a surgical update to the DOM. `xo` will know the exact element and attribute type you are targeting so *only one* DOM operation is made per data update.

#### Blueprints
Blueprints are generated using the `xo.x` function which takes a template string of HTML that can have injected javascript values throughout it. It uses the browser's builtin [DOM Parser](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser) to create a valid DOM element. It also maps out where all those "holes" or slots in the template string are in this new DOM element. And finally, it also returns an array of the data values passed in for those holes. So a `blueprint` data structure has: a cloneable DOM element, an array of slot locations, and an array of values that should go into those slots.

`xo` will use those slot locations to do it's surgical updates efficiently whenever that values within those slots change.

#### Components
Components are a data structure that has a single function that, when ran, returns another node. `xo` will run this function with a modified scope to give it access to it's own instance of Hooks (see the Component API). Whenever it's arguments change or whenever it's state changes, `xo` will re-run the component function and update the DOM with it's results.


#### Lists
Lists can either be arrays or objects. Lists are a node that tracks multiple and variable number of nodes within it. When updating, it tries to minimize updates as best as possible, unmounting subnodes that have been removed, mounting new nodes added, and moving re-arranged nodes in the DOM.

If you just use arrays, `xo` can not tell if the same sub-node has changed it's position within the list. For simple sub-nodes this may not matter, but if they are `components` using hooks, you generally don't want to completely unmount, destroy, and then re-mount the same component for being moved into a different position in the list. React solves this problem by using [keys](https://reactjs.org/docs/lists-and-keys.html), `xo` solves this by using objects, where the key is the sub-nodes identifier and the value is the sub-node.


*Example*
```js
const {x, comp} = require('pico-xo');

//Simple unordered list
const Ingredients = (ingredientList)=>{
	return x`<ul>
		${ingredientList.map(item=>x`<li>${item}</li>`)};
	</ul>`;
}

//A list using complex items that may have hooks
const UserList = (users)=>{
	return x`<div class='user_list'>
		${Object.fromEntries(users.map(user=>{
			return [user.id, UserProfile(user)];
		}))}
	</div>`;
};

```


---


## API

### Component scope

#### `this.useState(init)`

Same as [React's `useState`](https://reactjs.org/docs/hooks-state.html). `useState()` returns a two element array, where the first element is the current value of the state, and the second is a function to update this state value. If the new value is different from the old one, it triggers a re-render of this component. Re-renders in `xo` are throttled, so calling this multiple times in quick succession will only result in a single re-render.

`init` can be any value. If it is a function, the function is executed one time only to generate the initial value for this state, then ignored.

```js
const Counter = comp(function(){
	const [counter, setCounter] = this.useState(0);
	return x`<div onclick=${()=>setCounter(counter+1)}>${counter}</div>`;
});
```

The setter function can take an optional second parameter of `true` if you want to force a re-render with this new value, regardless if it's the same as the old value.


#### `this.useEffect(effectFunction, dependency=true)`
Same as [React's `useEffect`](https://reactjs.org/docs/hooks-effect.html). Runs the `effectFunction` whenever any value in the `dependency` changes. If `dependency` is an empty array, the `effectFunction` will only ever run after the initial mount. If the `effectFunction` returns a function, `xo` will call that before re-running the `effectFunction` or when unmounting the component. This is used as a "cleanup function" which is useful for event listeners.

```js

const UserBlock = comp(function(userId){
	const [userinfo, setUserinfo] = this.useState(()=>UserData.get(userId));

	this.useEffect(()=>{
		UserData.subscribe(userId, ()=>{
			setUserinfo(UserData.get(userId));
		});
		return ()=>UserData.unsubscribe(userId);
	}, [userId]); //Whenever the userId changes, unsubscribe from the old id, and subscribe to the new one

	this.useEffect(()=>console.log('Mounted!', userId), []); //This will only log on the initial render since the watch_args is an empty array

	return x`<div class='UserBlock'>...</div>`;
});
```

#### `this.useMemo(value, dependacy=true)`
Same as [React's `useEffect`](https://reactjs.org/docs/hooks-effect.html).



#### `this.useSignal(init)`
Creates an observable value that functions like state. However instead of calling a set state function, you can simply mutate the value to trigger re-renders. A signal must be assigned to the component's scope in order to work.

```js
const Counter = comp(function(){
	this.counter = this.useSignal(0);
	return x`<div onclick=${()=>this.counter++}>${this.counter}</div>`;
});
```



#### `this.useAsync(async_func, init_val)`
This is a custom hook we added to `xo` since we found we use this design pattern so often. `useAsync` wraps around an async function and provides stateful information about that async call. In particular, a pending status, it's current result, and if it generated any errors. Each of these values are stored as state, so whenever they change, the entire component will re-render.

```js
/*
	In this example we have a component that relies on async data.
	It has a button to re-fetch the data, as well as spinner to show the pending process
	and a div that will conditionally display errors
*/

const UserBlock = comp(function(id){
	const FetchUser = this.useAsync(async ()=>{
		const result = await UserService.fetch(id);
		if(!result.ok) throw result.err;
		return result.user;
	}, false);

	this.useEffect(()=>FetchUser(), []); //On first mount, fetch the user info

	let errBlock;
	if(FetchUser.errors){
		errBlock = x`<div class='errors'>${FetchUser.errors.toString()}</div>`
	}

	return x`<div class='UserBlock'>
		${FetchUser.pending && Spinner()}
		${FetchUser.result && x`<span>${FetchUser.result.name}</span>`}

		<button onclick=${()=>FetchUsers()} disabled=${FetchUser.pending}>Reload User Info</button>
		${errBlock}
	</div>`
});
```


#### `this.redraw()`
Calling this forces `xo` to re-render the component. Used internally by `useState` and `useSignal`, it's exposed because there are niche times when it's useful. Re-renders in `xo` are throttled based on animation frames, so calling this multiple times in quick succession will only result in a single re-render.


#### `this.el` & `refs`

`this.el` stores a direct reference to the DOM element this specific component instance is being rendered into. This is useful for wrapping 3rd parties libraries such as Google maps or CodeMirror, which usually want an element they can target.


[`refs`](https://reactjs.org/docs/refs-and-the-dom.html) in `xo` are just properties attached to `this`. Creating and modifying them do not trigger re-renders, and simply store values between renders. Shouldn't need to use this often, but it's useful for tracking transient values like scroll position, references to other DOM values, or instances from 3rd party libraries that should only be created one time, such as maps, editors, and what not.



```js
//This is a small xo wrapper around CodeMirror to make an event-y and update-able CodeMirror Editor that's a valid xo component
const Editor = comp(function(initVal, onChange, opts={}){
	this.useEffect(()=>{
		this.editor = CodeMirror.fromTextArea(this.el, opts);
		this.editor.on('change', ()=>{
			onChange(this.editor.getValue());
		});
		return ()=>this.editor.toTextArea();
	}, []);
	this.useEffect(()=>{
		if(this.editor.getValue() !== initVal){
			this.editor.setValue(initVal);
		}
	},[initVal]);
	return x`<textarea></textarea>`;
});
```




## Other fun things


### Custom Hooks
A great feature of react is being able to write complex custom hooks that many components can use. `xo` supports this feature as well, but since a component is given it's own state scope, you'll have to pass that to the custom hook.


*Example:* Let's create a hook that stores and reads a state value from Local Storage
```js

const useLocalState = (scope, key, init)=>{
	const [val, setVal] = scope.useState(()=>{

		//for the initial value of the state, it will attempt to use what's in Local Storage
		// otherwise it falls back to the `init`
		try{
			return JSON.parse(window.localStorage.getItem(key)) ?? init;
		}catch(err){
			return init;
		}
	});
	//Returns the same signature of useState, but attempts to write the new value into local storage before setting it.
	return [val, (newVal)=>{
		try{
			window.localStorage.setItem(key, JSON.stringify(newVal));
		}catch(err){}
		setVal(newVal);
	}];
};

const Greeting = comp(function(init_name){
	const [name, setName] = useLocalstate(this, 'user_name', init_name);
	//...
});

```

### `xo.cx(args...)`

`xo.cx` is a micro-implementation of the lovely [`classnames`](https://www.npmjs.com/package/classnames) package. `cx` takes any number of arguments and produce a single valid HTML class string from them. If an arg is a string it passes through. If it's an array, it applies `cx` to each value. If it's an object, it returns the string of all the keys with truthy values. It then concates everything together.

```js
x`<div class=${cx('foo', tags, {selected, hovered, big : val > 5})}></div>`
```


### Server-side Rendering
Even though `xo` is only 300 lines, it still supports server-side rendering. When you call the `xo.render()` function in an environment where `window` does not exist, `xo.render` will instead return the rendered HTML string for your component. It stubs out all component scoped functions and other various utils, so that it will not trigger any side-effects while rendering.

`xo` does not support any form of [hydration](https://reactjs.org/docs/react-dom.html#hydrate). This is incredibly complicated to build and support all the edge cases for. Instead `xo` will draw over any server-side rendered HTML on it's initial client-side render. This process does not cause any flicker or visual issues for the user.




## Why make this?

Excellent question! There's tons of React alternatives out there, so why add another to the pile? First and foremost, I made `xo` for myself. The best way I learn how a library works is by trying to distill it's essence and try to re-create it for myself. I've been an avid React programmer since v0.11, before hooks, before classes. It's greatly streamlined web development for me and I've built some beautiful things with it.

However React has it's rough edges:
- The need for a transpiler is the biggest pain for me. I work on many smaller personal projects and setting up, configuring and maintaining bundling systems, especially ones that still work over the years has been a nightmare.
- React subtly changing core HTML events and attributes for consistency has resulted in many gotchas.
- It very much has a "black magic" feel to what exactly is going on under the hood. This is especially true since the introduction of Fibers. Trying to read and understand the source code has become a hecurlean effort.
- While the Virtual DOM is an impressive bit of computer science (I strongly recommend reading the white paper on "solving") it feels like overkill when the bulk of the DOM of your app doesn't change that often. I was deeply inspired by lit-html's approach to this problem, while also solving the transpiler issue at the same time!
- React team has been slowly introducing spookier and spookier features that I have no need for. Suspense, frames, fibers, fragments, event delegations. While I am sure these are useful for the Facebook team and others, I personally have needed needed these features and the complexity they bring. I would much prefer if instead these were separate libraries you could pull in.
- Unsure about it's future. The React team likes to change it's focus and core offering quite frequently. This has resulted in many of my old projects becoming a multi-day effort to just get them running again, and ultimately many of them moth-balled. I have become increasing tired of fiddling with my build system over the years and now want things to Just Workᵗᵐ.

So in my journey in trying to understand React's source code, and it's contemporaries (lit-html, Vue, Angular) I had the inspiration to distill down the core ideas I love about the framework into a project that _I_ would want to use on a daily basis.

This project is a passion project spanning many months, many late nights manipulating DOM trees in my head, and endless experiments on how to cut out as much fluff as possible. I hope you enjoy, can learn some things for this work, and ultimately build some beautiful things with it ♥.




### What's new in `xo` v2

- (Biggest change) `xo` now attaches all relevant data to DOM nodes instead of internal structures.
	- This means when DOM nodes are removed or manipulated outside of `xo`, it doesn't cause weird race conditions or bugs. This also means that we can rely on the browser's garbage collector instead of doing the work in the framework.
	- Easy introspection by analyzing DOM nodes using the inspector.
- Completely re-worked the HTML parser.
	- Now runs in `O(n)` instead of `O(n²)` time.
	- Internally uses `<template>` tags instead of the `DOMparser`, which makes caching them much simpler.
- Lists have been re-worked completely to be much much reliable. Removed all duplication bugs.
- Added 'Signals' as a new hook for simpler state management
- Added useMemo as a hook to help reduce re-renders for functions and expensive calculations
- A cleaner internal type system reducing the amount of duck-typing
- Component scope is now much more stable and reliable between re-renders. More things are computed once and cached, rather than computed each render.
- Component's now check if their associated DOM node still exists before rendering, removing even more edge case bugs.
- Using MutationObservers to detect unmounts for components instead of tracking it internally. If an DOM node with an associated component is removed by any means (the browser, the user, an extension, or another lib), it no longer causes weird rendering issues or bugs, and is cleaned up and unmounted properly.
- Blueprints now diff slot values efficiently before rendering removing even more unnecessary re-renders.
- Still under 300 lines of code with no dependencies or build steps.




reeeeeeeeaaaaaaaaaallll quick tl;dr. I came up with a weird idea for a front-end framework (like vue or react) a while ago, and just recently started sketching it out.
kk, it's built in two parts
1. You write components functionally like new react, except you use "tagged template literals" instead of JSX.
eg. x<a href=${link}>${text}</a>
This produces two arrays, the first with all the string parts, and the second with all the injected data. Cool, so this part does a HTML parse through this input and figures out how to modify each injected data field if it was in the DOM, eg. 1) modify the root elements href attr, and 2) modify the root element's innerHTML. I call these "surgical" updates.
This work is then cached. Cool cool cool.
2. Rendering. You give a target DOM element to render in to and a top-level component (this may have nested components). It loops through and builds out a "cache-tree" of both reference nodes in the DOM and the injected data values for each rendered element. Remember that each data value has an associated "surgical update" function, so on subsequent renders, it uses this cache-tree on only if the data fields change does it call the surgical update with the new value on the cached reference node.
15:53
so instead of keeping a virtual-dom and doing complicated diffs, this framework is some simple tree-traversal and simple dom calls on each update.