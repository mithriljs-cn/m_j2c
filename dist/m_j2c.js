(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.m_j2c = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var j2c = require('j2c');
j2c = 'default' in j2c ? j2c['default'] : j2c;
var util = require('util_extend_exclude');
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
	if(!j2cStore) j2cGlobal[ns]=j2cStore={};
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

module.exports = m_j2c$1;
},{"j2c":2,"util_extend_exclude":3}],2:[function(require,module,exports){
'use strict';

var emptyObject = {};
var emptyArray = [];
var type = emptyObject.toString;
var own =  emptyObject.hasOwnProperty;
var OBJECT = type.call(emptyObject);
var ARRAY =  type.call(emptyArray);
var STRING = type.call('');
/*/-inline-/*/
// function cartesian(a, b, res, i, j) {
//   res = [];
//   for (j in b) if (own.call(b, j))
//     for (i in a) if (own.call(a, i))
//       res.push(a[i] + b[j]);
//   return res;
// }
/*/-inline-/*/

/* /-statements-/*/
function cartesian(a,b, selectorP, res, i, j) {
  res = []
  for (j in b) if(own.call(b, j))
    for (i in a) if(own.call(a, i))
      res.push(concat(a[i], b[j], selectorP))
  return res
}

function concat(a, b, selectorP) {
  // `b.replace(/&/g, a)` is never falsy, since the
  // 'a' of cartesian can't be the empty string
  // in selector mode.
  return selectorP && (
    /^[-\w$]+$/.test(b) && ':-error-bad-sub-selector-' + b ||
    /&/.test(b) && /* never falsy */ b.replace(/&/g, a)
  ) || a + b
}

function decamelize(match) {
  return '-' + match.toLowerCase()
}

/**
 * Handles the property:value; pairs.
 *
 * @param {array|object|string} o - the declarations.
 * @param {string[]} buf - the buffer in which the final style sheet is built.
 * @param {string} prefix - the current property or a prefix in case of nested
 *                          sub-properties.
 * @param {string} vendors - a list of vendor prefixes.
 * @Param {boolean} local - are we in @local or in @global scope.
 * @param {object} ns - helper functions to populate or create the @local namespace
 *                      and to @extend classes.
 * @param {function} ns.e - @extend helper.
 * @param {function} ns.l - @local helper.
 */

function declarations(o, buf, prefix, vendors, local, ns, /*var*/ k, v, kk) {
  if (o==null) return
  if (/\$/.test(prefix)) {
    for (kk in (prefix = prefix.split('$'))) if (own.call(prefix, kk)) {
      declarations(o, buf, prefix[kk], vendors, local, ns)
    }
    return
  }
  switch ( type.call(o = o.valueOf()) ) {
  case ARRAY:
    for (k = 0; k < o.length; k++)
      declarations(o[k], buf, prefix, vendors, local, ns)
    break
  case OBJECT:
    // prefix is falsy iif it is the empty string, which means we're at the root
    // of the declarations list.
    prefix = (prefix && prefix + '-')
    for (k in o) if (own.call(o, k)){
      v = o[k]
      if (/\$/.test(k)) {
        for (kk in (k = k.split('$'))) if (own.call(k, kk))
          declarations(v, buf, prefix + k[kk], vendors, local, ns)
      } else {
        declarations(v, buf, prefix + k, vendors, local, ns)
      }
    }
    break
  default:
    // prefix is falsy when it is "", which means that we're
    // at the top level.
    // `o` is then treated as a `property:value` pair.
    // otherwise, `prefix` is the property name, and
    // `o` is the value.
    k = prefix.replace(/_/g, '-').replace(/[A-Z]/g, decamelize)

    if (local && (k == 'animation-name' || k == 'animation')) {
      o = o.split(',').map(function (o) {
        return o.replace(/()(?::global\(\s*([-\w]+)\s*\)|()([-\w]+))/, ns.l)
      }).join(',')
    }
    if (/^animation|^transition/.test(k)) vendors = ['webkit']
    // '@' in properties also triggers the *ielte7 hack
    // Since plugins dispatch on the /^@/ for at-rules
    // we swap the at for an asterisk
    // http://browserhacks.com/#hack-6d49e92634f26ae6d6e46b3ebc10019a

    k = k.replace(/^@/, '*')

/*/-statements-/*/
    // vendorify
    for (kk = 0; kk < vendors.length; kk++)
      buf.push('-', vendors[kk], '-', k, k ? ':': '', o, ';\n')
/*/-statements-/*/

    buf.push(k, k ? ':': '', o, ';\n')

  }
}

var findClass = /()(?::global\(\s*(\.[-\w]+)\s*\)|(\.)([-\w]+))/g

/**
 * Hanldes at-rules
 *
 * @param {string} k - The at-rule name, and, if takes both parameters and a
 *                     block, the parameters.
 * @param {string[]} buf - the buffer in which the final style sheet is built
 * @param {string[]} v - Either parameters for block-less rules or their block
 *                       for the others.
 * @param {string} prefix - the current selector or a prefix in case of nested rules
 * @param {string} rawPrefix - as above, but without localization transformations
 * @param {string} vendors - a list of vendor prefixes
 * @Param {boolean} local - are we in @local or in @global scope?
 * @param {object} ns - helper functions to populate or create the @local namespace
 *                      and to @extend classes
 * @param {function} ns.e - @extend helper
 * @param {function} ns.l - @local helper
 */

function at(k, v, buf, prefix, rawPrefix, vendors, local, ns){
  var kk
  if (/^@(?:namespace|import|charset)$/.test(k)) {
    if(type.call(v) == ARRAY){
      for (kk = 0; kk < v.length; kk++) {
        buf.push(k, ' ', v[kk], ';\n')
      }
    } else {
      buf.push(k, ' ', v, ';\n')
    }
  } else if (/^@keyframes /.test(k)) {
    k = local ? k.replace(
      // generated by script/regexps.js
      /( )(?::global\(\s*([-\w]+)\s*\)|()([-\w]+))/,
      ns.l
    ) : k
    // add a @-webkit-keyframes block too.

    buf.push('@-webkit-', k.slice(1), ' {\n')
    sheet(v, buf, '', '', ['webkit'])
    buf.push('}\n')

    buf.push(k, ' {\n')
    sheet(v, buf, '', '', vendors, local, ns)
    buf.push('}\n')

  } else if (/^@extends?$/.test(k)) {

    /*eslint-disable no-cond-assign*/
    // pick the last class to be extended
    while (kk = findClass.exec(rawPrefix)) k = kk[4]
    /*eslint-enable no-cond-assign*/
    if (k == null || !local) {
      // we're in a @global{} block
      buf.push('@-error-cannot-extend-in-global-context ', JSON.stringify(rawPrefix), ';\n')
      return
    } else if (/^@extends?$/.test(k)) {
      // no class in the selector
      buf.push('@-error-no-class-to-extend-in ', JSON.stringify(rawPrefix), ';\n')
      return
    }
    ns.e(
      type.call(v) == ARRAY ? v.map(function (parent) {
        return parent.replace(/()(?::global\(\s*(\.[-\w]+)\s*\)|()\.([-\w]+))/, ns.l)
      }).join(' ') : v.replace(/()(?::global\(\s*(\.[-\w]+)\s*\)|()\.([-\w]+))/, ns.l),
      k
    )

  } else if (/^@(?:font-face$|viewport$|page )/.test(k)) {
    sheet(v, buf, k, k, emptyArray)

  } else if (/^@global$/.test(k)) {
    sheet(v, buf, prefix, rawPrefix, vendors, 0, ns)

  } else if (/^@local$/.test(k)) {
    sheet(v, buf, prefix, rawPrefix, vendors, 1, ns)

  } else if (/^@(?:media |supports |document )./.test(k)) {
    buf.push(k, ' {\n')
    sheet(v, buf, prefix, rawPrefix, vendors, local, ns)
    buf.push('}\n')

  } else {
    buf.push('@-error-unsupported-at-rule ', JSON.stringify(k), ';\n')
  }
}

/**
 * Add rulesets and other CSS statements to the sheet.
 *
 * @param {array|string|object} statements - a source object or sub-object.
 * @param {string[]} buf - the buffer in which the final style sheet is built
 * @param {string} prefix - the current selector or a prefix in case of nested rules
 * @param {string} rawPrefix - as above, but without localization transformations
 * @param {string} vendors - a list of vendor prefixes
 * @Param {boolean} local - are we in @local or in @global scope?
 * @param {object} ns - helper functions to populate or create the @local namespace
 *                      and to @extend classes
 * @param {function} ns.e - @extend helper
 * @param {function} ns.l - @local helper
 */
function sheet(statements, buf, prefix, rawPrefix, vendors, local, ns) {
  var k, kk, v, inDeclaration

  switch (type.call(statements)) {

  case ARRAY:
    for (k = 0; k < statements.length; k++)
      sheet(statements[k], buf, prefix, rawPrefix, vendors, local, ns)
    break

  case OBJECT:
    for (k in statements) {
      v = statements[k]
      if (prefix && /^[-\w$]+$/.test(k)) {
        if (!inDeclaration) {
          inDeclaration = 1
          buf.push(( prefix || '*' ), ' {\n')
        }
        declarations(v, buf, k, vendors, local, ns)
      } else if (/^@/.test(k)) {
        // Handle At-rules
        inDeclaration = (inDeclaration && buf.push('}\n') && 0)

        at(k, v, buf, prefix, rawPrefix, vendors, local, ns)

      } else {
        // selector or nested sub-selectors

        inDeclaration = (inDeclaration && buf.push('}\n') && 0)

        sheet(v, buf,
          (kk = /,/.test(prefix) || prefix && /,/.test(k)) ?
            cartesian(prefix.split(','), ( local ?
          k.replace(
            /()(?::global\(\s*(\.[-\w]+)\s*\)|(\.)([-\w]+))/g, ns.l
          ) : k
        ).split(','), prefix).join(',') :
            concat(prefix, ( local ?
          k.replace(
            /()(?::global\(\s*(\.[-\w]+)\s*\)|(\.)([-\w]+))/g, ns.l
          ) : k
        ), prefix),
          kk ?
            cartesian(rawPrefix.split(','), k.split(','), rawPrefix).join(',') :
            concat(rawPrefix, k, rawPrefix),
          vendors,
          local, ns
        )
      }
    }
    if (inDeclaration) buf.push('}\n')
    break
  case STRING:
    buf.push(
        ( prefix || ':-error-no-selector' ) , ' {\n'
      )
    declarations(statements, buf, '', vendors, local, ns)
    buf.push('}\n')
  }
}

var scope_root = '_j2c_' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '_' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '_' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '_' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '_';
var counter = 0;
function j2c(res) {
  res = res || {}
  var extensions = []

  function finalize(buf, i) {
    for (i = 0; i< extensions.length; i++) buf = extensions[i](buf) || buf
    return buf.join('')
  }

  res.use = function() {
    var args = arguments
    for (var i = 0; i < args.length; i++){
      extensions.push(args[i])
    }
    return res
  }
/*/-statements-/*/
  res.sheet = function(ns, statements) {
    if (arguments.length === 1) {
      statements = ns; ns = {}
    }
    var
      suffix = scope_root + counter++,
      locals = {},
      k, buf = []
    // pick only non-numeric keys since `(NaN != NaN) === true`
    for (k in ns) if (k-0 != k-0 && own.call(ns, k)) {
      locals[k] = ns[k]
    }
    sheet(
      statements, buf, '', '', emptyArray /*vendors*/,
      1, // local
      {
        e: function extend(parent, child) {
          var nameList = locals[child]
          locals[child] =
            nameList.slice(0, nameList.lastIndexOf(' ') + 1) +
            parent + ' ' +
            nameList.slice(nameList.lastIndexOf(' ') + 1)
        },
        l: function localize(match, space, global, dot, name) {
          if (global) {
            return space + global
          }
          if (!locals[name]) locals[name] = name + suffix
          return space + dot + locals[name].match(/\S+$/)
        }
      }
    )
    /*jshint -W053 */
    buf = new String(finalize(buf))
    /*jshint +W053 */
    for (k in locals) if (own.call(locals, k)) buf[k] = locals[k]
    return buf
  }
/*/-statements-/*/
  res.inline = function (locals, decl, buf) {
    if (arguments.length === 1) {
      decl = locals; locals = {}
    }
    declarations(
      decl,
      buf = [],
      '', // prefix
      emptyArray, // vendors
      1,
      {
        l: function localize(match, space, global, dot, name) {
          if (global) return space + global
          if (!locals[name]) return name
          return space + dot + locals[name]
        }
      })
    return finalize(buf)
  }

  res.prefix = function(val, vendors) {
    return cartesian(
      vendors.map(function(p){return '-' + p + '-'}).concat(['']),
      [val]
    )
  }
  return res
}

j2c.global = function(x) {
  return ':global(' + x + ')'
}

j2c.kv = kv
function kv (k, v, o) {
  o = {}
  o[k] = v
  return o
}

j2c.at = function at (rule, params, block) {
  if (
    arguments.length < 3
  ) {
    var _at = at.bind.apply(at, [null].concat([].slice.call(arguments,0)))
    _at.toString = function(){return '@' + rule + ' ' + params}
    return _at
  }
  else return kv('@' + rule + ' ' + params, block)
}

j2c(j2c)
delete j2c.use

module.exports = j2c;
},{}],3:[function(require,module,exports){

function _deepIt(a, b, callback) {
    if (a == null || b == null) {
        return a;
    }
    for( var key in b ) {
        if ( {}.toString.call(b[key]) == '[object Object]') {
            if ( {}.toString.call(a[key]) != '[object Object]') {
                callback(a, b, key)
            } else {
                a[key] = _deepIt(a[key], b[key], callback);
            }
        } else {
            callback(a, b, key)
        }
    }
    return a;
}

function _extend(x,y ){
    return _deepIt(x,y, function(a,b,key){
        a[key] = b[key]
    })
}

/*Usage: _exlucde(obj, {x:{y:1, z:1} }, [null] ) will delete x.y,x.z on obj, or set to newVal if present */
// _exclude( {a:1,b:{d:{ c:2} } }, { b:{d:{ c:1} } } )
function _exclude( x,y, newVal ){
    var args = arguments
    return _deepIt(x,y, function(a,b,key){
        if( typeof b[key]!=='object' && b[key] ){
            args.length==3 ? a[key]=newVal : delete a[key]
        } else {
            a[key] = b[key]
        }
    })
}

module.exports = {
    _deepIt: _deepIt,
    _extend: _extend,
    _exclude: _exclude
}

},{}]},{},[1])(1)
});