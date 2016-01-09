var j2c = require('j2c')
var util = require('util_extend_exclude')
// var m = window.m || require('mithril')
var m = function(){}	// user should pass m to this module, for optimize file size

var DEFAULT_NS = 'global_j2c'
var namespace = DEFAULT_NS
var j2cGlobal = {}
var j2cStore = {}
var domClassMap = []

j2cGlobal[namespace] = j2cStore;

var isBrowser = typeof document==='object' && document && document instanceof Node;

function findDom(dom) {
	for(var i=0, n=domClassMap.length; i<n; i++ ){
		if(domClassMap[i].dom === dom) return i
	}
	return -1
}

// check if the given object is HTML element
function isElement(o){return (typeof HTMLElement === "object" ? o instanceof HTMLElement :o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"); }

function stylize(element, sheet){
	if(!isBrowser) return;
    element.type = 'text/css';
    if (element.styleSheet){
    	element.styleSheet.cssText = sheet;
    } else {
    	// empty all style when re-apply new style
    	while(element.firstChild) element.removeChild(element.firstChild);
    	element.appendChild(document.createTextNode(sheet));
    }
    return element;
}

function addStyleToHead(styleObj) {
	if(!isBrowser) return;
	if(!styleObj.dom){
		var el = document.createElement('style')
		document.head.appendChild(el)
		styleObj.dom = el
	}
	styleObj.dom.setAttribute('data-ns', namespace + '_' + styleObj.version)
	stylize(styleObj.dom, styleObj.sheet)
}

function intervdom (sheet, vdom){
	if(vdom.attrs&&vdom.attrs.className){
		vdom.attrs.className = vdom.attrs.className.split(/\s+/).map(function(c){
			var g = c.match(/global\((.*)\)/);
			if(g) return g.pop();
			if(sheet[c]) return sheet[c];
			return c
		}).join(' ')
	}
	if(vdom.children) vdom.children.forEach(function(v){ intervdom(sheet, v)  } )
	return vdom
}
function applyStyle (sheet, vdom){
	if( {}.toString.call(vdom)==="[object Array]" ) return vdom.map( function(v){ return applyStyle(sheet, v) } );
	return [intervdom(sheet, vdom)]
}

function removeDom (styleObj) {
	if(!isBrowser) return;
	var dom = styleObj.dom;
	dom && dom.parentNode && dom.parentNode.removeChild(dom);
	delete styleObj.dom
}

function m_j2c(name, vdom) {
	// usage: m_j2c() will return all j2cStore
	if(!name) return j2cStore;
	if( isElement(name) ) return m_j2c.applyDom.apply(this, arguments);
	var styleObj = j2cStore[name]
	// usage: m_j2c('name') will return all j2cStore['name']
	if(!vdom) return styleObj;
	// usage: m_j2c('name', mithril_v_dom) will add style to vdom and create <style> for it, cache style_dom
	if( !styleObj || !styleObj.sheet ) return applyStyle({}, vdom);
	var sheet = styleObj.sheet;
	var styleDom = m('style', {
		config:function(el, isinit, context, vdom){
			if(!isinit) {
                stylize(el, sheet);
                styleObj.dom = el;
            }
		}
	});
	styleDom.attrs[ 'data-'+ namespace + '_' + name+'_'+styleObj.version ] = true;
	return [ styleDom, applyStyle(sheet, vdom) ]
}

m_j2c.removeNS = function( ns ){
	if(!ns) return;
	if(ns===namespace){
		for(var i in j2cStore){
			removeDom( j2cStore[i] )
		}
		m_j2c.applyClass(null,null,false)
		namespace = DEFAULT_NS
		j2cStore = j2cGlobal[namespace]
		m.redraw()
	}
	return delete j2cGlobal[ns]
}
m_j2c.getNS = function( ns ){
	return ns ? j2cGlobal[ns] : namespace
}
m_j2c.setNS = function( ns ){
	if(ns){
		namespace = ns;
		for(var i in j2cStore){
			removeDom( j2cStore[i] )
		}
		m_j2c.applyClass(null,null,false)
		if(!j2cGlobal[namespace]) j2cGlobal[namespace] = j2cStore = {} ;
		else j2cStore = j2cGlobal[namespace];
		for(i in j2cStore){
			m_j2c.add( i, j2cStore[i].cssObj )
		}
		m.redraw()
	}
	return m_j2c
}
m_j2c.setM = function(mithrilGlobal) {
	if(mithrilGlobal) m = mithrilGlobal;
	return m_j2c;
}

m_j2c.add = function( name, cssObj ) {
	if(!name)return;
	var styleObj
	var isHead = name.indexOf('<head')===0;
	if(!j2cStore[name]){
		styleObj = j2cStore[name] = { cssObj:cssObj, version:0, sheet:j2c.sheet(cssObj) };
	} else {
		styleObj = j2cStore[name]
		util._extend( styleObj.cssObj, cssObj )
		styleObj.sheet = j2c.sheet(styleObj.cssObj);
		styleObj.version++
	}
	if( isHead ) addStyleToHead(styleObj)
	else if( styleObj.dom ) m.redraw();

	return j2cStore[name];
}
m_j2c.remove = function(name, cssObj) {
	if(!name)return;
	var isHead = name.indexOf('<head')===0;
	var styleObj = j2cStore[name];
	if(!cssObj){
		delete j2cStore[name]
	}else{
		util._exclude(styleObj.cssObj, cssObj, null);
		styleObj.sheet = j2c.sheet(styleObj.cssObj);
		styleObj.version++
	}
	if( isHead ) {
		cssObj
		? addStyleToHead(styleObj)
		: removeDom( styleObj )
	}
	else if( styleObj.dom ) m.redraw();

	return styleObj
}
m_j2c.getClass = function (nameRegex){
	var sheet, list = {}
	nameRegex = nameRegex||/./
	for(var i in j2cStore){
		// tutpoint: string.match(undefined) ?
		if( (sheet=j2cStore[i].sheet) && i.match(nameRegex) ){
			for(var name in sheet){ if(sheet.hasOwnProperty(name)&& !name.match(/^\d/) ) list[name]=sheet[name] }
		}
	}
	// console.log(list)
	return list;
}
m_j2c.getClassMap = function () {
	return domClassMap
}
m_j2c.applyClass = function (target, nameRegex, isClear){
	if(! isBrowser) return;
	var list = m_j2c.getClass(nameRegex)
	var _addClassToDom = function(dom){
		var pos, c = dom.className&&dom.className.split(/\s+/)
	    if(c) dom.className = c.map(function(v){
	    	if( isClear===false ) {
	    		if((pos=findDom(dom))!==-1){
		    		var old = domClassMap[pos].original
		    		domClassMap.splice(pos,1)
		    		return old
	    		}else{
	    			return v
	    		}
	    	}else{
		    	var j2cClass = list[v]
		    	if(j2cClass) domClassMap.push( { dom:dom, original:v } );
		    	return j2cClass||v
	    	}
	    }).join(' ')
	}
	if( !isElement(target) ) target=document.body;
	_addClassToDom(target)
	var items = target.getElementsByTagName("*")
	for (var i = items.length; i--;) {
	    _addClassToDom(items[i])
	}
}


exports = module.exports = m_j2c;

// Usage:
// m_j2c.add( '<head abc>', {' body':{font_size:'10px', }} )
// m_j2c.add( '<head def>', {' body':{color:'red', ' .text':{color:'blue'} }  } )

// m_j2c('body_style', m('.list') )
// 

