var fs = require( 'fs' )
var zlib = require( 'zlib' )
var rollup = require( 'rollup' )
var uglify = require('uglify-js')

// **** build.js modified from pygy's j2c project *****

var roll = rollup.rollup({
  entry: 'src/m_j2c.js'
})

var formats = {
  amd:'amd',
  cjs:'commonjs',
  es6:'es6',
  umd:'umd',
  iife:'global',
}
Object.keys(formats).forEach(function(format){
  roll.then( function ( bundle ) {
    var name = formats[format]
    var result = bundle.generate({
      // output format - 'amd', 'cjs', 'es6', 'iife', 'umd'
      format: format,
      moduleId: 'm_j2c',
      moduleName: 'm_j2c',
    });
    fs.writeFileSync( 'dist/m_j2c_'+ name +'.js', result.code );

    if(format!=='iife') return; // only minify for global

    var minified = uglify.minify(result.code, {
      fromString: true,
      mangle: true,
      compress: {}
    }).code
    fs.writeFileSync('dist/m_j2c_' + name + '.min.js', minified)

    zlib.gzip(minified, function(_, buf){
      console.log(name, _ || buf.length)
      fs.writeFileSync('dist/m_j2c_' + name + '.min.js.gz', buf)
    })

  }).then(null, function (e) {console.log(format, e)})

})


