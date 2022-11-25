# Hook Ideas

> Just writing out a bunch of different hook ideas


## Hooks overall

- `memo` : creates a value once, updates with second param changes
	use case:
		1. easily wrap functions to reduce re-renders
		2. Store expensive calculations, and only update when needed too

- `state` : a value that triggers a refresh when changed
	use case:
		1. Reactive data that your UI cares about

- `ref` : a value that persists between re-renders
	use case:
		1. store flags or cached values or generated instances (eg. a google-maps instance after load)

- `effects` : Functions (and undo functions), that run when second param changes. Runs _after_ render.
	use case:
		1. Attach or interact with rendered elements (set up maps, etc.)
		2. Set up listeners to event handlers (APIs based on userid)



```js
const Thing = comp(function(user_id, other_arg){
	this.user = this.useState(false);

	this.user2 = this.useSignal(false);


	this.useEffect(()=>{
		return SubscribeToUser(user_id, (user_data)=>{
			this.user(user_data);
		});
	}, user_id);

	this.useEffect(()=>{
		this.refs.map = gMaps.initMap(this.el.findElementByClass('map'));
	}); //no param means only runs once after mount




	//weird double
	this.handleClick = this.useMemo(()=>(evt)=>{
		alert(this.user().name, other_arg);
	}, other_arg); //recalculates memo when second param changes (so not to lose scope-ness)

	return x`<div onclick=${this.handleClick}>

		${this.user && x`<span>User id: ${this.user().id}` /*Bug! this.user is a function, not the user value*/ }


		<div class='map'></div>
	</div>

});


```


### Ideas:
- Should effects run immediately? And use a special behaviour.





this.useState always returns a "usable" state proxy











### State


### react flavour

```js
const [counter, setCounter] = useState(()=>6);
````


❌ setter gets out of sync when used in effects
❌ Can't attach to scope
✅ counter is raw value




### Built-in

Provide a nested proxy object attached to scope

```js
comp(function(){
	this.state.counter = this.initState(6); //returns an exotic value that this.state knows how to use

	this.state.counter += 1; //updates

	console.log(this.state.counter);


	const foo = this.initState(7); //Returns a garbage weird value

});
```

❌ initialization is tricky. Proxy doesn't know what's set up code and reactive code, so have to do something exotic
❌ Must be attached to an object, no free-floating state variables
✅ Simple get and update, intuitive
✅ Can be nested, and changing nested values




### Functional Wrapper

```js

const counter = useState(()=>6);
console.log(counter()); //get

counter(counter() + 1); //set
```

❌ setter and getter both use more notation, unintuitive
❌ can accidentally use `counter` and have bugs
✅ very simple internals, no proxies


### Encapsulated Object

Similar to Functional Wrapper, but with slightly different notation



