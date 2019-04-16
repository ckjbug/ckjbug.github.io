/* 
* ClassM
* Copyright (c) 2013 Class	http://gaoge.name
* E-Mail:g@gaoge.name
* Date: 2013-08 
*/ 
(function($){
	//ClassM
	$.classM = function(options){
		var defaults = {
			content:"<div class='classM'><a href='http://www.jq22.com/' target='_blank' class='M_1'></a><a href='other/love/index.html' target='_blank' class='M_2'></a><a href='javascript:;' class='M_3'></a><a href='#' target='_blank' class='M_4'></a></div>",//Content
			width:388,//this Tip Width
			height:93,//this Tip Height
			background:"images/bg.png",//this Tip Background
			time:500,//show Time
			animateTime:200//animate
		}
		var options = $.extend(defaults, options);
		$(document).each(function(){
			$("body").mousedown(function(e){
				setM = setTimeout(mouseD,options.time);
				winW = $(window).width();
				winH = $(document).height();
				winX = e.originalEvent.x || e.originalEvent.layerX || 0;
				winY = e.originalEvent.y || e.originalEvent.layerY || 0;
				if ( winW-winX < options.width ) { winX = winX-options.width }
				winScroll = $(document).scrollTop()
				winY = winY+winScroll;
			})
			$("body").mouseup(function(){
				clearTimeout(setM)
			})
			$(document).scroll(function(){
				removeClassM()
			})
		})
		mouseD = function mouseD(){
			$("body").append("<div class='classMBg' style='position:absolute;top:0;left:0;background:#fff;width:100%;height:"+winH+"px;z-index:9999;'></div>");
			$(".classMBg")
			.css("opacity","0")
			.click(function(){removeClassM()});
			$(".classMBox").remove();
			$("body").append(
			"	<div class='classMBox' style='position:absolute;top:"+winY+"px;left:"+winX+"px;z-index:99999;display:none;width:0;text-align:center'>"
			+	"<div style='width:"+options.width+"px;height:"+options.height+"px;background:url("+options.background+");'>"
			+	options.content
			+	"</div></div>");
			$(".classMBox a").focus(function(){ $(this).blur() })
			$(".classMBox a").hover(function(){ $(this).fadeTo("slow",0.5) },function(){ $(this).fadeTo("slow",1) })
			$(".classMBox").show().animate({width:options.width+"px"},options.animateTime)
			$(document).keydown(function(event){
				if ( event.keyCode == 27 ) { removeClassM() }
			})			
		}
		function removeClassM(){
			$(".classMBox").animate({width:"0"},options.animateTime,function(){ $(".classMBg,.classMBox").remove() })
		}
	}
	//	
})(jQuery);