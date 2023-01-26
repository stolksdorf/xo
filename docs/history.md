
## The Start

The first commit to the `xo` repo was probably around 10 years. I was running an e-commerce company at the time that built plugins, add-ons and custom solutions for various e-commerce platforms; Magento, Big Commerce, etc.

Each of these platforms had their own frameworks and systems for interacting with the underlying e-commerce features, as well as defined ways for extending their interfaces. However, they were wildly different from each other, and as number of our projects grew, the split effort of maintaining several different codebases for each project for each platform, in conjunction with new releases, onboarding new hires, and understanding the weird edge cases just became too much.

So I built a wrapper around the most popular UI framework library at the time, Backbone.js. This wrapper would lets us write our plugins using Backbone.js, and then it would know how to translate those models, views, and controllers into something that could interact with whatever underlying framework there was. It worked fantastic, and over time we slowly added more and more features, extending even the functionality of Backbone itself. I named it `xo` after "exoskeleton" since I was supercharging our backbone. Eventually, I moved onto greener pastures and put `xo` on the shelf.


Years later, React came out and it _immediately_ clicked for me. It had so many ideas that I had in `xo` but packaged in a clean, simple, and elegant way.




## What I don't like about React

### JSX and transpiling

I hate hate hate transpiling. Your project's build process should be as simple, as fast, and as reliable as possible. A complicated or finicky build process can be a barrier of entry for new members of your team, or contributors for open source.

The fact that React requires it when you have [Tagged Template Literals]() sitting in the language right there baffles my mind.


### Synthetic Events

React tries to smooth out the events interface to HTML, which is quite fragmented between common components (I'm looking at you `<input type="text">` and `<textarea>`). At first I _loved_ this, but over time switching back and forth between React, other frameworks, and vanilla HTML, I kept forgetting which parts React added. After running into a few multi-day bugs because of this (eg. no `onChange` for checkboxes in native HTML), and not being able to easily copy and paste HTML code around, my opinion changed on this.


### VDOM

Capturing and diffing the _entire markup_ when often a small defined subset of it is changing, regardless of how fast they made it, is overkill and ripe with footguns. Much of React's recent releases focus on throttling, splitting, pausing, resuming, fibering, these markup changes. I really loved when I _knew_ a component would be re-rendered and updated in React, but slowly overtime the Black-Magic crept in and I lost that insight.








## What I do like about React

### Functional Components


### Hooks







## Why don't use [X]?

Here's a quick overview of my thoughts of some other existing solutions. I haven't used many of these extensively, so take my opinions with a grain of salt.


### Angular



### Vue



### Svelte

The release of Svelte was actually the big push for me to work on `xo` again. Svelte does a lot of things right, and I strongly suggest checking it out. However, it needs to be transpiled, and it's a bit too Black-Magic-y for my tastes.



### Custom Components

Custom Components solve problems I don't have, and don't solve the ones I have. They are very boilerplate-y, don't have a nice way to do templating or state. They excel in creating these isolated drop-in HTML-like components that Just Workᵗᵐ, regardless of what framework or system you are using.

However the majority of the projects I work on, I have full control over everything? So all the affordances just get in my way.

It's a very well-made spec, and I think it has a ton of uses cases, but just not for me.






Features of XO


No transpiling. Uses Tagged Templates for HTML. code using `xo` is runnable vanilla JS.


