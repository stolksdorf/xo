const {x, comp, render} = xo;


Tests.Components = {
	async state(t){
		const Widget = comp(function(initTxt){
			const [text, setText] = this.useState(initTxt);
			const handleChange = this.useRef((evt)=>{
				setText(evt.target.value);
			});
			this.useEffect(()=>{
				setText('boop');
			});
			return x`<div>
				<textarea oninput=${handleChange}>${text}</textarea>
				<div>${text}</div>
			</div>`;
		});
		const Result = render(Widget('oh hello'));
		t.ok(Result.innerHTML.includes('oh hello'));
		await t.wait(50);
		t.ok(Result.innerHTML.includes('boop'));
	},
	async proxy_state(t){
		let renders = 0;
		const Counter = comp(function(){
			this.count = this.useState(0);
			this.useEffect(()=>{
				this.count++;
				setTimeout(()=>this.count = 4, 50);
				setTimeout(()=>this.count = this.count + 0, 150);
			});
			renders++;
			return x`<div>${this.count}</div>`;
		});
		Result = render(Counter());
		t.eq(Result.innerHTML, '0');
		t.eq(renders, 1);
		await t.wait(10);
		t.eq(Result.innerHTML, '1');
		t.eq(renders, 2);
		await t.wait(100);
		t.eq(Result.innerHTML, '4');
		t.eq(renders, 3);
		await t.wait(200);
		t.eq(Result.innerHTML, '4');
		t.eq(renders, 3, 'Should not render an extra time');
	},
	element(t){
		let renders = 0;
		const Widget = comp(function(){
			this.flip = this.useState(false);
			this.useEffect(()=>{
				setTimeout(()=>this.flip = true, 20);
			});

			this.useEffect(()=>{
				if(renders === 1) t.eq('DIV', this.el.tagName, 'Second render should be div');
				if(renders === 2){
					t.eq('SPAN', this.el.tagName, 'third render should be span');
					t.pass();
				}
			}, Symbol());

			if(renders === 0) t.eq(undefined, this.el, 'First render has no element yet');
			renders++;
			if(this.flip) return x`<span>flipped</span>`;
			return x`<div>not flipped</div>`;
		});
		Result = render(Widget());
		return t.wait();
	},
	useRef_elements(t){
		let renders = 0;
		const Widget = comp(function(){
			this.body = this.useRef();
			this.anchorTag = this.useRef();

			this.useEffect(()=>{
				t.eq('outer', this.body.el.id);
				t.eq('DIV', this.body.el.tagName);

				t.eq('link', this.anchorTag.el.id);
				t.eq('A', this.anchorTag.el.tagName);

				t.pass();
			});

			t.eq({}, this.body, 'refs should be empty to start');
			t.eq({}, this.anchorTag, 'refs should be empty to start');

			return x`<div id='outer' ref=${this.body}>
				<div>
					<a id='link' ref=${this.anchorTag}>test</a>
				</div>
			</div>`;
		});
		Result = render(Widget());
		return t.wait();
	},
	async maunal_unmounting(t){
		t.flop = 'Widget did not unmount';
		let widgetRef={};
		const Widget = comp(function(){
			this.useEffect(()=>{
				return ()=>t.pass();
			});
			return x`<div ref=${widgetRef}>unmount</div>`;
		});
		Result = render(x`<div>hello ${Widget()}</div>`);
		await t.wait(50);
		Result.removeChild(widgetRef.el);
		return t.wait();
	},
	async nested_unmounting(t){
		t.flop = 'Widget did not unmount';
		const Widget = comp(function(){
			this.useEffect(()=>{
				return ()=>t.pass();
			});
			return x`<span>unmount</span>`;
		});
		const Container = comp(function(){
			this.hide = this.useState(false);
			this.useEffect(()=>{ this.hide = true; });
			if(this.hide) return x`<blockquote>no widget</blockquote>`;
			return x`<div>hello <span>${Widget()}<span></div>`
		})
		Result = render(Container());
		return t.wait();
	}

}