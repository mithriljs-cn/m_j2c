var assert = require('assert')
var m_j2c = require('../dist/m_j2c.js')

describe('### Add new j2c object with name', function () {

	var cssObj = { '.text':{font_size:'12px'} }
	m_j2c.add('body', cssObj )

	it('# should generate j2c sheet object', function(){
		var sheet = m_j2c('body').sheet
		assert.equal( true, sheet.constructor === String )
		assert.equal( true, /\.text_j2c_/.test( sheet.valueOf() ) )
	})

	it('# cssObj should be properly saved', function(){
		assert.deepEqual( m_j2c('body').cssObj, cssObj )
	})
	
	it('# add to <head> should be work in node ', function(){
		assert.doesNotThrow(
		  function() {
		    m_j2c.add('<head abc>', cssObj )
		  },
		  ReferenceError
		);
	})

}  )

