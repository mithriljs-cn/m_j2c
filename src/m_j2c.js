var j2c = require('j2c')
var m = require('mithril')
var util = require('util_extend_exclude')

var isBrowser = typeof document==='object' && document && document instanceof Node;

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

function addStyleToHead(styleObj){
	if(!isBrowser) return;
	if(!styleObj.dom){
		var el = document.createElement('style')
		document.head.appendChild(el)
		styleObj.dom = el
	}
	styleObj.dom.setAttribute('data-version', 'head_'+styleObj.version)
	stylize(styleObj.dom, styleObj.sheet)
}

var intervdom = function (sheet, vdom){
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
var applyStyle = function(sheet, vdom){
	if( {}.toString.call(vdom)==="[object Array]" ) return vdom.map( function(v){ return applyStyle(sheet, v) } );
	return [intervdom(sheet, vdom)]
}

var j2cStore = {}
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
	styleDom.attrs[ 'data-'+name+'_'+styleObj.version ] = true;
	return [ styleDom, applyStyle(sheet, vdom) ]
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
		: styleObj.dom&&styleObj.dom.parentNode.removeChild(styleObj.dom)
	}
	else if( styleObj.dom ) m.redraw();

	return styleObj
}
m_j2c.getClass = function (nameRegex){
	var sheet, list = {}
	for(var i in j2cStore){
		// tutpoint: string.match(undefined) ?
		if( (sheet=j2cStore[i].sheet) && i.match(nameRegex) ){
			for(var name in sheet){ if(sheet.hasOwnProperty(name)&& !name.match(/^\d/) ) list[name]=sheet[name] }
		}
	}
	// console.log(list)
	return list;
}
m_j2c.applyClass = function (target, nameRegex){
	var list = m_j2c.getClass(nameRegex)
	var _addClassToDom = function(dom){
		var c = dom.className&&dom.className.split(/\s+/)
	    if(c) dom.className = c.map(function(v){ return list[v]||v }).join(' ')
	}
	if( !isElement(target) ) return;
	_addClassToDom(target)
	var items = target.getElementsByTagName("*")
	for (var i = items.length; i--;) {
	    _addClassToDom(items[i])
	}
}

module.exports = exports = m_j2c;

// Usage:
// m_j2c.add( '<head abc>', {' body':{font_size:'10px', }} )
// m_j2c.add( '<head def>', {' body':{color:'red', ' .text':{color:'blue'} }  } )

// m_j2c('body_style', m('.list') )
// 

