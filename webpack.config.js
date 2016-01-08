var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: {
        m_j2c: './src/m_j2c.js',
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js'
    },
    plugins:[
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
    ],
    module: {
        // loaders: [
        //     { 
        //         test: path.join(__dirname, 'script'),
        //         // include:[ path.join(__dirname, 'script') ],
        //         // exclude: /(node_modules|bower_components)/,
        //         loader: 'babel-loader',
        //         query:{
        //             cacheDirectory:true,
        //             // presets: ['es2015'],
        //             // plugins: ['transform-runtime']
        //         }
        //     }
        // ]
    }
}

