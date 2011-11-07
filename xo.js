$(document).ready(function () {
	
});


$.fn.extend({
	xoexpand: function(trigger,show,delay){
		var target = $(this);
		if(show==false){ target.hide(); }
		delay = delay || 500 //default value of 500 milliseconds
		trigger.css('cursor', 'pointer');
		trigger.click(function() {
			target.slideToggle(delay);
		});
	},/*
	xocomplete: function(keywords){
		$(this).autocomplete(keywords);
	},*/
	xobutton: function(onClick,onHover){
		var btn = $(this);
		btn.css('cursor', 'pointer');
		if(typeof onHover !="undefined"){
			btn.hover(function(){
				onHover(btn);
			});
		}
		btn.click(function(){
			onClick();
		});
	},
	xotimer: function(startTime, trigger, accur){
		var box = $(this);
		accur = accur || 0;
		startCountDownTime = new Date;
		countDownId = self.setInterval(function() { 
			box.text((startTime - (new Date - startCountDownTime) / 1000).toFixed(accur));
			if((new Date - startCountDownTime) > startTime*1000 - 500){
				clearInterval(countDownId);
				trigger();
			}
		}, 10); 
	}
});

function xoajax(url, data, callback, image){
	if(typeof onHover !="undefined"){
		image.attr("src", "images/loading.gif");
		image.css("width","30px");
		image.css("height","30px");
	}
	$.ajax({
		type: "GET",
		url: url,
		data: data,
		success: function(response){
			if(typeof onHover !="undefined"){image.hide();}
			callback(response);}
	});
}

