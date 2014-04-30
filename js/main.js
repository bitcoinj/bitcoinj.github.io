function addEvent(a,b,c){
//Attach event to a DOM node.
//Ex. addEvent(node,'click',function);
return (a.addEventListener)?a.addEventListener(b,c,false):(a.attachEvent)?a.attachEvent('on'+b,c):false;
}

function removeEvent(a,b,c){
//Detach event from a DOM node.
//Ex. removeEvent(node,'click',function);
return (a.removeEventListener)?a.removeEventListener(b,c,false):(a.detachEvent)?a.detachEvent('on'+b,c):false;
}

function getStyle(a,b){
//Return the value of the computed style on a DOM node.
//Ex. getStyle(node,'padding-bottom');
if(window.getComputedStyle)return document.defaultView.getComputedStyle(a,null).getPropertyValue(b);
var n=b.indexOf('-');
if(n!==-1)b=b.substr(0,n)+b.substr(n+1,1).toUpperCase()+b.substr(n+2);
return a.currentStyle[b];
}

function getWidth(a){
//Return the integer value of the computed width of a DOM node.
//Ex. getWidth(node);
var w=getStyle(a,'width');
if(w.indexOf('px')!==-1)return parseInt(w.replace('px',''));
var p=[getStyle(a,'padding-top'),getStyle(a,'padding-right'),getStyle(a,'padding-bottom'),getStyle(a,'padding-left')];
for(var i=0;i<4;i++){
	if(p[i].indexOf('px')!==-1)p[i]=parseInt(p[i]);
	else p[i]=0;
}
return Math.max(0,a.offsetWidth-p[1]-p[3]);
}

function getHeight(a){
//Return the integer value of the computed height of a DOM node.
//Ex. getHeight(node);
var h=getStyle(a,'height');
if(h.indexOf('px')!==-1)return parseInt(h.replace('px',''));
var p=[getStyle(a,'padding-top'),getStyle(a,'padding-right'),getStyle(a,'padding-bottom'),getStyle(a,'padding-left')];
for(var i=0;i<4;i++){
	if(p[i].indexOf('px')!==-1)p[i]=parseInt(p[i]);
	else p[i]=0;
}
return Math.max(0,a.offsetHeight-p[0]-p[2]);
}

function getLeft(a){
//Return the integer value of the computed distance between given node and the browser window.
//Ex. getLeft(node);
var b=a.offsetLeft;
while(a.offsetParent){a=a.offsetParent;b+=a.offsetLeft;}
return b;
}

function getTop(a){
//Return the integer value of the computed distance between given node and the browser window.
//Ex. getTop(node);
var b=a.offsetTop;
while(a.offsetParent){a=a.offsetParent;b+=a.offsetTop;}
return b;
}

function getPageYOffset(){
//Return the integer value for the vertical position of the scroll bar.
return (window.pageYOffset)?window.pageYOffset:document.documentElement.scrollTop;
}

function getPageXOffset(){
//Return the integer value for the horizontal position of the scroll bar.
return (window.pageXOffset)?window.pageXOffset:document.documentElement.scrollLeft;
}

function getWindowY(){
//Return the integer value for the browser window height.
return (window.innerHeight)?window.innerHeight:document.documentElement.clientHeight;
}

function getWindowX(){
//Return the integer value for the browser window width.
return (window.innerWidth)?window.innerWidth:document.documentElement.clientWidth;
}

function updateToc(){
//Update table of content style on scroll.
var updateToc=function(id,tags){
	var offset=getPageYOffset();
	var windowy=getWindowY();
	var toc=document.getElementById(id);
	//Set bottom to fit within window and not overflow its parent node
	if(id=='toc'){
		var div=toc.getElementsByTagName('DIV')[0];
		div.style.bottom=Math.max((offset+windowy)-(getHeight(toc.parentNode)+getTop(toc.parentNode)),20)+'px';
	}
	//Find all titles using specified tags
	var nodes=[];
	for(var i=0,n=tags.length;i<n;i++){
		for(var ii=0,t=document.getElementsByTagName(tags[i]),nn=t.length;ii<nn;ii++)nodes.push(t[ii]);
	}
	var first=last=closer=[nodes[0],getTop(nodes[0])];
	//Find first and last title on the page, and closer title to the current position.
	for(var i=0,n=nodes.length;i<n;i++){
		if(!nodes[i].id)continue;
		var top=getTop(nodes[i]);
		if(top<first[1])first=[nodes[i],top];
		if(top>last[1])last=[nodes[i],top];
		if(top<offset+10&&top>closer[1])closer=[nodes[i],top];
	}
	//Pick first or last title if at the top or bottom of the page
	if(offset<first[1])closer=[first[0],first[1]];
	if(windowy+offset>=getHeight(document.body))closer=[last[0],last[1]];
	//Remove .active class from toc and find new active toc entry
	var a=false;
	for(var i=0,t=toc.getElementsByTagName('*'),n=t.length;i<n;i++){
		var href='';
		if(t[i].getAttribute('href')!==null)href=t[i].getAttribute('href');
		if(href.indexOf('#')!==-1)href=href.substr(href.indexOf('#'));
		if(t[i].className&&t[i].className.indexOf('active')!==-1)t[i].className='';
		if(t[i].nodeName=='A'&&href=='#'+closer[0].id)a=t[i];
	}
	//Apply .active class on new toc entry
	if(a===false)return;
	while(a.parentNode.nodeName=='LI'||a.parentNode.nodeName=='UL'){
		a.className='active';
		a=a.parentNode;
	}
}
var update=function(){
	if(document.getElementById('toc'))updateToc('toc',['H2','H3','H4']);
	if(document.getElementById('menu'))updateToc('menu',['H1']);
}
var timeout=function(){
	var b=document.body;
	clearTimeout(b.getAttribute('toctimeout'));
	b.setAttribute('toctimeout',setTimeout(update,1));
}
addEvent(window,'scroll',timeout);
update();
}

function supportsSVG(){
//Return true if the browser supports SVG.
//Ex. if(!supportsSVG()){..apply png fallback..}
//Old FF 3.5 and Safari 3 versions have svg support, but a very poor one
//http://www.w3.org/TR/SVG11/feature#Image Defeat FF 3.5 only
//http://www.w3.org/TR/SVG11/feature#Animation Defeat Saf 3 but also returns false in IE9
//http://www.w3.org/TR/SVG11/feature#BasicGraphicsAttribute Defeat Saf 3 but also returns false in Chrome and safari4
//http://www.w3.org/TR/SVG11/feature#Text Defeat Saf 3 but also returns false in FF and safari4
if(!document.createElementNS||!document.createElementNS('http://www.w3.org/2000/svg','svg').createSVGRect)return false;
if(!document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image","1.1"))return false;
if(!document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicGraphicsAttribute","1.1")&&!document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Animation","1.1")&&!document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Text","1.1"))return false;
return true;
}

function fallbackSVG(){
//Replace all images extensions from .svg to .png if browser doesn't support SVG files.
if(supportsSVG())return;  
for(var i=0,nd=document.getElementsByTagName('*'),n=nd.length;i<n;i++){
	if(nd[i].nodeName=='IMG'&&/.*\.svg$/.test(nd[i].src))nd[i].src=nd[i].src.slice(0,-3)+'png';
	if(/\.svg/.test(getStyle(nd[i],'background-image')))nd[i].style.backgroundImage=getStyle(nd[i],'background-image').replace('.svg','.png');
	if(/\.svg/.test(getStyle(nd[i],'background')))nd[i].style.background=getStyle(nd[i],'background').replace('.svg','.png');
}
}
