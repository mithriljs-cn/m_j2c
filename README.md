# m_j2c  [![Build Status](https://travis-ci.org/mithriljs-cn/m_j2c.svg?branch=master)](https://travis-ci.org/mithriljs-cn/m_j2c)

Apply j2c style into DOM & virtual DOM(default support mithril)

[Demo](http://jsbin.com/vogibuw/3/edit?html,output)

## Installation

```Bash
$ npm install m_j2c
```

use in browser (can also be used in node)

```JavaScript
var j2c = require('j2c')
var m_j2c = require('m_j2c')
```

then below way of apply css to browser DOM:

````Javascript
var obj= { '.item li':{float:'left'} }	// define style object
m_j2c( obj, document.querySelector('#some_ul') )	//apply j2c style to #some_ul
````

This will do 3 things in order:

1. insert `style` tag into `header`, which contains css:
````CSS
.item_j2c_qh10fm_1imf8sp_8nqwug_810slq_6 li{
float:left;
}
````

2. `#some_ul` and it's children, change `.item` class into `.item_j2c_qh10fm_1imf8sp_8nqwug_810slq_6`
3. cache the generated style name && dom ref



## Benefit

- **no css name conflict**, all class is localized! ( powered by [j2c](https://github.com/j2css/j2c) )
- **js object computation to CSS**!
- add css **namespaces** to a page/dom, a js function call to switch



## More example

### apply named **style object** to DOM
````javascript
var css={
	navbar: { '.item':{color:'red'} },	// define sytle object
	content: { '.item':{color:'blue'} }	// define sytle object
}
m_j2c.setNS('colorfulSkin')		//will create if not exists
function applyCSS(){
	m_j2c.add('navbar', css.navbar)	// add sytle object to `navbar` key in `colorfulSkin` (create if not exists)
	m_j2c.add('content', css.content)	// add sytle object to `content` key in `colorfulSkin` (create if not exists)

	m_j2c('navbar', document.querySelector('#nav .item') )	// apply style to DOM
	m_j2c('content', document.querySelector('#content .item') )	// apply style to DOM
}
applyCSS()	// now the page style is colorful
````

above defined a `colorfulSkin` namespace, and two style names `navbar` & `content` in that namespace

then apply to two different dom accordingly.

now `#nav` and `#content` has different style for `.item`, thanks to the `j2c` localized class name.


### switch to another namespace
````javascript
var css={
	navbar: { '.item':{color:'white'} },	// define sytle object
	content: { '.item':{color:'black'} }	// define sytle object
}
m_j2c.setNS('blackwhite')		//will create if not exists
applyCSS()	// now the page style is black'n white
````

### add / remove some css style from existing rules
````javascript
m_j2c.add('navbar', { '.item':{color:'navy', float:'left'} } )  //will update `color`,add `float` for navbar style & dom
m_j2c.remove('navbar', { '.item':{float:'left'} } )  //will remove `float` for navbar style & dom
````


## Using with [Mithril](http://mithril.js.org)

it's very easy, m_j2c act with a `middleware` for mithril v-dom, so below code:
````javascript
var com = {
	view:function(){
		return m_j2c('navbar', m('div.item', 'content') )
	}
}
````
will apply `navbar` in current namespace(e.g. `blackwhite` above) to mithril v-dom, **return new v-dom with class name modified**

and later if you want to change style, just:
````javascript
m_j2c.add('navbar', { '.item':{color:'navy', float:'left'} } )  // will trigger m.redraw, and update the v-dom to apply new style
````

## `m_j2c` API

### *Variables*

#### m_j2c.DEFAULT_NS
- *string* internal var store, initial value is 'default', you can change directly, when first used

#### m_j2c.j2c
- *function* j2c reference. Mostly, you can use m_j2c to manager your j2c



### *Functions*

### m_j2c.setNS(ns)
**Set current namespace to ns, and refresh dom; previously applied dom style of current namespace will be reverted **
- `ns` [*string* *optional*] namespace. if omit, use `m_j2c.DEFAULT_NS`
````
m_j2c.setNS()	//switch to default namespace
m_j2c.setNS('colorful')	//set colorful as current namespace, and switch to it
````


### m_j2c.getNS()
**Get current active namespace **
````
m_j2c.getNS()	//'colorful'
````


### m_j2c.removeNS(ns)
**Remove namespace and it's style, swtich to default namespace(m_j2c.DEFAULT_NS) **
- `ns` [*string*] namespace to remove
````
m_j2c.removeNS('colorful')	//remove colorful name space, and switch current namespace to 'default'
````


### m_j2c(m)
**Specify mithril instance, for trigger m.redraw**
- `m` [*function*] mithril `m` instance. will check `window.m` internally first, or specified use it. `add`, `remove`, `setNS`, `removeNS` function will trigger a `m.redraw`. If no `m` detected, m_j2c also work except auto redraw. Only need call once.
- **return** `m_j2c` handler to allow chain with other function
````
m_j2c(m).add('name', cssObj)	//set m and
````


### m_j2c(cssObj, [dom||v-dom])
**Apply cssObj rule to dom/v-dom, using an auto generated name**
- `cssObj` [*object*] style to apply, auto generate a temp name
- `dom||v-dom` [*object* *optional*] the target to apply style.
- **return** modified `v-dom` or `dom` list that applied j2c class
````
m_j2c( {'.item':{ color:'red' }} , document.querySelector('div.item') )	//apply cssObj to dom `div.item` and it's children
m_j2c( {'.item':{ color:'red' }} , m('.item', 'content') )	// apply cssObj to  mithril `m` result
````


### m_j2c([ns], name, [dom||v-dom])
**Apply class rule to dom/v-dom**
- `ns` [*string* *optional*] namespace. if omit, use current namespace; `''` denote `m_j2c.DEFAULT_NS`
- `name` [*string*] name of ns to get style sheet, the `ns` and `name` just key path internally
- `dom||v-dom` [*object* *optional*] the target to apply style.
  For `dom`, just an alias for `m_j2c.applyClass` function
  For `v-dom`, transform to apply j2c. anything that is not normal `v-dom` will **return as is**, like `m.component`, `{subtree:retain}`
- **return** modified `v-dom` or `dom` list that applied j2c class
````
m_j2c('name', document.querySelector('div.abc') )	//apply current namespace:name style to dom `div.abc` and it's children
m_j2c('name', m('.item', 'content') )	// apply current namespace:name style to  mithril `m` result
m_j2c('', 'name', m('.item', 'content') )	//apply default namespace:name style to mithril `m` result
````


### m_j2c.add([ns], name, cssObj)
**Add class rule to ns:name, extend from cssObj and refresh dom/v-dom**
- `ns` [*string* *optional*] namespace. if omit, use current namespace; `''` denote `m_j2c.DEFAULT_NS`
- `name` [*string*] name of ns to get style sheet, the `ns` and `name` just key path internally
- `cssObj` [*object* *optional*] the style object to be added
````
m_j2c.add('name', {'.item':{ color:'red' }} )	//add red color to .item in current namespace:name, and update style&dom
m_j2c.add('', 'name', {'.item':{ color:'red' }} )	//add red color to .item in default namespace:name, and update style&dom
````


### m_j2c.remove([ns], name, [cssObj])
**Remove class rule from ns:name, which has truthy value in cssOb and refresh dom/v-domj**
- `ns` [*string* *optional*] namespace. if omit, use current namespace; `''` denote `m_j2c.DEFAULT_NS`
- `name` [*string*] name of ns to get style sheet, the `ns` and `name` just key path internally
- `cssObj` [*object* *optional*] the style object to be removed, which has truthy value in cssObj. If falsy, will detele ns:name style totally
````
m_j2c.remove('name' )	//remove current namespace:name totally
m_j2c.remove('name', {'.item':{ color:'red' }} )	//remove red color to .item in current namespace:name, and update style&dom
m_j2c.remove('', 'name', {'.item':{ color:'red' }} )	//remove red color to .item in default namespace:name, and update style&dom
````


### m_j2c.applyClass([ns], name, [target])
**Apply DOM node class name into j2c, return affected dom list**
- `ns` [*string* *optional*] namespace. if omit, use current namespace; `''` denote `m_j2c.DEFAULT_NS`
- `name` [*string*] name of ns to get style sheet, the `ns` and `name` just key path internally
- `target` [*DOM* *optional*] target to apply style to. If falsy, `document.body` will be used
````
m_j2c.applyClass('name' )	//apply current namespace:name to body and it's children
m_j2c.applyClass('name', document.querySelector('#some_ul') )	//apply current namespace:name to #some_ul and it's children
m_j2c.applyClass('', 'name', document.querySelector('#some_ul') )	//apply default namespace:name to #some_ul and it's children
````


### m_j2c.revertClass([target], [ns], [name])
**Revert DOM node class name into original, return affected dom list**
- `target` [*DOM* *optional*] target to apply style to. If falsy, `document.body` will be used
- `ns` [*string* *optional*] namespace. if omit, use current namespace; `''` denote `m_j2c.DEFAULT_NS`
- `name` [*string* *optional*] name of ns to get style sheet, the `ns` and `name` just key path internally
````
m_j2c.revertClass()	//revert all style of current namespace in body and it's children
m_j2c.revertClass(document.querySelector('#some_ul') )	 //revert all style of current namespace in #some_ul and it's children
m_j2c.revertClass(document.querySelector('#some_ul'), null, 'name')	 //revert style of current namespace:name in #some_ul and it's children
m_j2c.revertClass(document.querySelector('#some_ul'), '', 'name' )	//revert style of default namespace:name to #some_ul and it's children
````


### m_j2c.getClass([ns], name)
**Get class-j2c class map for name, return `object`, key is original class name, value is j2c class name **
- `ns` [*string* *optional*] namespace. if omit, use current namespace; `''` denote `m_j2c.DEFAULT_NS`
- `name` [*string*] name of ns to get style sheet, the `ns` and `name` just key path internally
````
m_j2c.getClass('name' )	//get current namespace:name style map
m_j2c.getClass('', 'name' )	//get default namespace:name style map
````


### m_j2c.domClassMap()
**Return internal dom list array which has j2c class applied **










