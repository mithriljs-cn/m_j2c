define('m_j2c', ['j2c', 'util_extend_exclude'], function (j2c, util) { 'use strict';

	j2c = 'default' in j2c ? j2c['default'] : j2c;
	util = 'default' in util ? util['default'] : util;

	// import m from 'mithril'
	// have to manually set m ref when required
	var m= typeof window!='undefined'&&window.m||null

	var OBJECT = "[object Object]";
	var ARRAY = "[object Array]";
	var REGEXP="[object RegExp]";
	var type = {}.toString;

	var j2cGlobal = {}
	var domClassMap = []

	m_j2c.DEFAULT_NS = 'default';
	m_j2c.j2c = j2c;
	var namespace = m_j2c.DEFAULT_NS

	j2cGlobal[m_j2c.DEFAULT_NS] = {};

	var isBrowser = typeof document==='object' && document && document instanceof Node;

	// check if the given object is HTML element
	function isElement(o){return (typeof HTMLElement == "object" ? o instanceof HTMLElement :o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"); }
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

	function addStyleToHead(styleObj, ns, name) {
		if(!isBrowser) return;
		name=name||''
		var id = 'style_'+ ns + '_' + name + '_' + styleObj.version
		if( document.getElementById(id) ) return;
		if(!styleObj.dom){
			var el = document.createElement('style')
			document.head.appendChild(el)
			styleObj.dom = el
		}
		styleObj.dom.setAttribute('id', id.replace(/\"/g,'&quot;').replace(/\'/g,'&apos;') )
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
		if( type.call(vdom.children) ===ARRAY ) vdom.children.forEach(function(v){ applyStyle(sheet, v)  } )
		return vdom
	}
	function applyStyle (sheet, vdom){
		if( type.call(vdom)===ARRAY ) return vdom.map( function(v){ return applyStyle(sheet, v) } );
		if( type.call(vdom)!==OBJECT) return vdom
		return intervdom(sheet, vdom)
	}

	function removeDom (styleObj) {
		if(!isBrowser) return;
		var dom = styleObj.dom;
		dom && dom.parentNode && dom.parentNode.removeChild(dom);
		delete styleObj.dom
	}

	function m_j2c(ns, name, vdom) {
		var args = arguments;
		if(args.length===0) return j2cGlobal;	//m_j2c()
		if(args.length===1){
			//if it's mithril ref
			if(typeof ns=='function' && ns.prop){	//m_j2c(m)
				m=ns; return m_j2c;
			}
			name=ns, ns=namespace;	//m_j2c('name')-> curNS,name
		}
		if(typeof args[1]=='object') vdom=name, name=ns, ns=namespace;	//m_j2c('name', vdom)-> curNS,name(vdom)
		ns=ns||m_j2c.DEFAULT_NS	//m_j2c('', 'name') -> DEFAULT_NS, name

		if(!name) return j2cGlobal[ns];	//m_j2c('')->curNS  ||  m_j2c('', '')->DEFAULT_NS
		else if(!vdom) return j2cGlobal[ns]&&j2cGlobal[ns][name];	//m_j2c('name')->curNS,name &&  m_j2c('', 'name')->DEFAULT_NS,name

		if( type.call(name)==OBJECT ){
			//support {'.item li':{float:left}} as name
			var tempName='temp_'+Date.now()+Math.random()
			m_j2c.add(ns, tempName, name)
			name=tempName
		}
		if( isElement(vdom) ) return m_j2c.applyClass(ns, name, vdom);
		var styleObj = j2cGlobal[ns][name]
		// usage: m_j2c('name', mithril_v_dom) will add style to vdom and create <style> for it, cache style_dom
		if( !styleObj || !styleObj.sheet ) return applyStyle({}, vdom);
		// Known Issue: the dom will always re-created when pass to mithril, so we set below to skip next redraw()
		// m.redraw.strategy('none')
		var ret = applyStyle(styleObj.sheet, vdom)
		// console.log(ret)
		return  ret
	}
	m_j2c.removeNS = function( ns ){
		// DEFAULT_NS cannot be removed
		if(!ns||ns===m_j2c.DEFAULT_NS) return;
		if(ns===namespace){
			var j2cStore = j2cGlobal[ns]
			for(var i in j2cStore){
				removeDom( j2cStore[i] )
			}
			m_j2c.revertClass()
			namespace = m_j2c.DEFAULT_NS
			m&&m.redraw()
		}
		delete j2cGlobal[ns]
		return m_j2c
	}
	m_j2c.getNS = function( ns ){
		return ns ? j2cGlobal[ns] : namespace
	}
	m_j2c.setNS = function( ns ){
		var j2cStore = j2cGlobal[namespace]
		ns = ns||m_j2c.DEFAULT_NS
		namespace = ns;
		for(var i in j2cStore){
			removeDom( j2cStore[i] )
		}
		m_j2c.revertClass()

		if(!j2cGlobal[namespace]) j2cGlobal[namespace] = j2cStore = {} ;
		else j2cStore = j2cGlobal[namespace];
		for(i in j2cStore){
			m_j2c.add( i, j2cStore[i].cssObj )
		}
		m&&m.redraw()

		return m_j2c
	}
	m_j2c.add = function( ns, name, cssObj ) {
		var args = arguments;
		if(args.length===0) return j2cGlobal[namespace];
		if(args.length===1) name=ns, ns=namespace;
		if(typeof args[1]=='object') cssObj=name, name=ns, ns=namespace;
		ns=ns||m_j2c.DEFAULT_NS

		if(!name)return j2cGlobal[ns];
		else if(!cssObj)return j2cGlobal[ns]&&j2cGlobal[ns][name];

		var j2cStore = j2cGlobal[ns]
		if(!j2cStore) j2cGlobal[ns]={};
		// revert all class for ns/name
		var changeList=[]
		domClassMap.forEach( function(v){_addClassToDom(v.dom,changeList,ns,name,false)} )
		var styleObj
		if(!j2cStore[name]){
			styleObj = j2cStore[name] = { cssObj:cssObj, version:0, sheet:j2c.sheet(cssObj) };
		} else {
			styleObj = j2cStore[name]
			util._extend( styleObj.cssObj, cssObj )
			styleObj.sheet = j2c.sheet(styleObj.cssObj);
			styleObj.version++
		}
		addStyleToHead(styleObj, ns, name)
		m&&m.redraw();
		changeList.forEach( function(v){_addClassToDom(v.dom,[],ns,name,true)} )
		return j2cStore[name];
	}
	m_j2c.remove = function(ns, name, cssObj) {
		var args = arguments;
		if(args.length===0) return j2cGlobal[namespace];
		if(args.length===1) name=ns, ns=namespace;
		if(typeof args[1]=='object') cssObj=name, name=ns, ns=namespace;
		ns=ns||m_j2c.DEFAULT_NS

		var j2cStore = j2cGlobal[ns]
		if(!name || !j2cStore || !j2cStore[name]) return;
		// revert all class for ns/name
		var changeList=[]
		domClassMap.forEach( function(v){
			_addClassToDom(v.dom,changeList,ns,name,false)
		} )
		var styleObj = j2cStore[name];
		if(!cssObj){
			delete j2cStore[name]
			removeDom( styleObj )
		}else{
			util._exclude(styleObj.cssObj, cssObj, null);
			styleObj.sheet = j2c.sheet(styleObj.cssObj);
			styleObj.version++
			addStyleToHead(styleObj, ns, name)
			changeList.forEach( function(v){_addClassToDom(v.dom,[],ns,name,true)} )
		}
		m&&m.redraw();
		return styleObj
	}
	m_j2c.getClass = function (ns, name) {
		var args = arguments
		if(args.length===0) return j2cGlobal[namespace];	//getClass()->curNS
		if(args.length===1) name=ns, ns=namespace	//getClass('name')->curNS,name
		ns=ns||m_j2c.DEFAULT_NS	//getClass('', 'name')->DEFAULT_NS,name
		var sheet, list = {}, store= j2cGlobal[ns]
		if(!store||!name) return;
		for(var i in store){
			// tutpoint: string.match(undefined) ?
			if( (sheet=store[i].sheet) && ( type.call(name)==REGEXP ? i.match(name) : i==name ) ){
				for(var key in sheet){ if(sheet.hasOwnProperty(key)&& !key.match(/^\d/) ) list[key]=sheet[key] }
			}
		}
		return list;
	}

	var _addClassToDom = function(dom, domRange, ns, name, isAdd) {
		var pos, c = dom.className&&dom.className.split(/\s+/)
	    if(c) dom.className = c.map(function(v){
	    	if( isAdd===false ) {
	    		for(var i=domClassMap.length;i--;){
	    			var d=domClassMap[i]
	    			ns=ns||d.ns
	    			name=name||d.name
	    			if(d.ns==ns&&d.name==name&&d.dom===dom && d.j2c==v){
	    				domRange&&domRange.push( d )
	    				return d.original
	    			}
	    		}
	    		return v
	    	}else{
	    		var list = m_j2c.getClass(ns, name)
	    		if(!list)return
		    	var j2cClass = list[v]
		    	if(j2cClass){
		    		var obj={ ns:ns, name:name, dom:dom, original:v, j2c:j2cClass }
		    		domRange&&domRange.push( obj );
		    		domClassMap.push( obj );
		    	}
		    	return j2cClass||v
	    	}
	    }).join(' ')
	}

	m_j2c.domClassMap = function (){
		return domClassMap
	}
	m_j2c.revertClass = function (target, ns, name) {
		var domRange=[]
		if( !target||!isElement(target) )target=document.body;
		if(ns==='') ns=m_j2c.DEFAULT_NS;
		ns=ns||namespace
		_addClassToDom(target,domRange,ns,name,false)
		var items = target.getElementsByTagName("*")
		for (var i = items.length; i--;) {
		    _addClassToDom(items[i],domRange,ns,name,false)
		}
		return domRange
	}
	m_j2c.applyClass = function (ns, name, target){
		if(! isBrowser) return;
		var args = arguments;
		if(typeof args[1]=='object') target=name, name=ns, ns=namespace;
		if(name===undefined) name=ns, ns=namespace;
		if( !target||!isElement(target) )target=document.body;
		ns=ns||m_j2c.DEFAULT_NS
		if( type.call(name)==OBJECT ){
			//support {'.item li':{float:left}} as name
			var tempName='temp_'+Date.now()+Math.random()
			m_j2c.add(ns, tempName, name)
			name=tempName
		}
		var domRange=[]
		_addClassToDom(target, domRange, ns, name)
		var items = target.getElementsByTagName("*")
		for (var i = items.length; i--;) {
		    _addClassToDom(items[i], domRange, ns, name)
		}
		return domRange
	}

	var m_j2c$1 = m_j2c

	// exports = module.exports = m_j2c;

	// Usage:
	// m_j2c.add( '<head abc>', {' body':{font_size:'10px', }} )
	// m_j2c.add( '<head def>', {' body':{color:'red', ' .text':{color:'blue'} }  } )

	// m_j2c('body_style', m('.list') )
	//

	return m_j2c$1;

});