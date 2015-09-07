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

function getEvent(e,a){
// Return requested event property.
// Ex. var target = getEvent(event, 'target');
e=(e)?e:window.event;
switch(a){
case 'type':
	return e.type;
case 'target':
	return (e.target&&e.target.nodeType==3)?e.target.parentNode:(e.target)?e.target:e.srcElement;
}
}

function addClass(node,data){
// Add class to node.
var cl=node.className.split(' ');
for(var i=0,n=cl.length;i<n;i++){
	if(cl[i]==data)return;
}
cl.push(data);
node.className=cl.join(' ');
}

function removeClass(node,data){
// Remove class from node.
var ocl=node.className.split(' ');
var ncl=[];
for (var i=0,n=ocl.length;i<n;i++){
	if (ocl[i]!=data)ncl.push(ocl[i]);
}
node.className=ncl.join(' ');
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

function onTouchClick(e,callback,callbackClick){
// Detect and handle clicks using click and touch events while preventing accidental or ghost clicks.
var timeout=1000,
    srcEvent=e,
    touchEndListener=function(e){
    	// Call callback if touch events match the patterns of a click.
    	removeEvent(t,'touchend',touchEndListener);
    	setClickTimeout();
    	if(Math.abs(e.changedTouches[0].pageX-x)>20||Math.abs(e.changedTouches[0].pageY-y)>20)return;
    	callback(srcEvent);
    },
    wrongClickListener=function(e){
    	// Cancel click events on different targets within timeframe.
    	// This avoids accidental clicks when the page is scrolled or updated due to the 300ms click event delay on mobiles.
    	removeEvent(document.body,'click',wrongClickListener);
    	if(!clickReady()&&getEvent(e,'target')!=t)cancelEvent(e);
    },
    setClickTimeout= function(){
    	// Update timeout during which click events will be blocked.
    	document.body.setAttribute('data-touchtimeout',new Date().getTime()+timeout);
    },
    clickReady=function(){
    	// Check if timeout during click events are blocked has expired.
    	var ti=document.body.getAttribute('data-touchtimeout');
    	return (ti===null||ti===''||parseInt(ti,10)<new Date().getTime());
    };
if(callbackClick===undefined)callbackClick=function(){};
//Apply appropriate actions according to each event type.
switch(getEvent(e,'type')){
case 'touchstart':
	// Save initial touchstart coordinates and listen for touchend events and accidental click events.
	var x=e.changedTouches[0].pageX,
	    y=e.changedTouches[0].pageY,
	    t=e.changedTouches[0].target;
	setClickTimeout();
	addEvent(t,'touchend',touchEndListener);
	addEvent(document.body,'click',wrongClickListener);
	setTimeout(function(){
		removeEvent(document.body,'click',wrongClickListener);
	},timeout);
break;
case 'click':
	// Call callback on click in the absence of a recent touchstart event to prevent ghost clicks.
	// Always call callbackClick to let it cancel click events on links.
	callbackClick(srcEvent);
	if(!clickReady())return;
	callback(srcEvent);
break;
}
}

function menuShow(e){
// Show or hide mobile menu on tap.
function init(){
	var nd=document.getElementById('menucontainer'),
	    toc=document.getElementById('toc');
	(nd.className.indexOf('menuvisible')===-1)?addClass(nd,'menuvisible'):removeClass(nd,'menuvisible');
	addEvent(nd,'click',menuAutoHide);
	if(toc&&toc.parentNode!=nd)nd.appendChild(toc);
}
onTouchClick(e,init);
}

function menuAutoHide(e){
// Hide mobile menu when a link is clicked.
var t=getEvent(e,'target');
if(t.nodeName!='A')return;
removeClass(document.getElementById('menucontainer'),'menuvisible');
}

function menuScroll(e){
// Emulate scroll within an element with touch events.
function eventListener(e){
	// Trigger actions based on touch events.
	switch(e.type){
	case 'touchend':
		setSpeedCheckPoint(e);
		endScrollAnimation(nd,getSpeed(e));
		shutdown();
		break;
	case 'touchmove':
		setSpeedCheckPoint(e);
		updateScrollTop(e);
		e.preventDefault();
		break;
	}
}
function setSpeedCheckPoint(e){
	// Save last touch event position and time.
	var t=new Date().getTime();
	if(speedCheckPoint[0][0]-t<500)return;
	speedCheckPoint.pop();
	speedCheckPoint.unshift([t, e.changedTouches[0].pageY]);
}
function getSpeed(e){
	// Calculate scroll speed from the last recent touch events.
	var timeDiff=new Date().getTime()-speedCheckPoint[1][0],
	    pageYDiff=0-(e.changedTouches[0].pageY-speedCheckPoint[1][1]);
	return pageYDiff/timeDiff;
}
function updateScrollTop(e){
	// Update element scrollTop according to the touchmove event.
	var newPageY=e.changedTouches[0].pageY;
	nd.scrollTop=Math.max(0,nd.scrollTop+lastPageY-newPageY);
	lastPageY=newPageY;
}
function endScrollAnimation(nd,speed){
	// Decelerate scrolling to a halt when user releases touch.
	// speed argument is in px/ms and can be a negative number.
	function animate(){
		var p=(new Date().getTime()-startTime)/animationTime;
		var pp=p*(2-p);
		var scrollTop=Math.round(startScrollTop+(animationDistance*pp));
		if(p>=1||scrollTop===0||scrollTop>=nd.scrollHeight){
			nd.scrollTop=startScrollTop+animationDistance;
			clearAnimation();
			return;
		}
		nd.scrollTop=scrollTop;
	}
	var startTime=new Date().getTime(),
	    startScrollTop=nd.scrollTop,
	    animationTime=Math.sqrt(Math.abs(speed))*800,
	    animationDistance=speed*animationTime;
	clearInterval(nd.getAttribute('data-scrollStatus'));
	nd.setAttribute('data-scrollStatus',setInterval(animate,10));
}
function clearAnimation(){
	// Stop any scroll ongoing scroll animation.
	clearInterval(nd.getAttribute('data-scrollStatus'));
}
function shutdown(){
	// Remove event listener to destroy instance.
	nd.removeEventListener('touchmove',eventListener);
	nd.removeEventListener('touchend',eventListener);
}
var nd=document.getElementById('menucontainer'),
    lastPageY=e.changedTouches[0].pageY,
    time=new Date().getTime(),
    speedCheckPoint=[[time,lastPageY],[time,lastPageY]];
nd.addEventListener('touchmove',eventListener);
nd.addEventListener('touchend',eventListener);
clearAnimation();
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
	if(nodes.length===0)return;
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
	if(document.getElementById('toc'))updateToc('toc',['H1','H2','H3','H4']);
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
