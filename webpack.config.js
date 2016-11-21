var debug = process.env.NODE_ENV !== "production";
var webpack = require('webpack');

module.exports = {
    context: __dirname,
    devtool: debug ? "inline-sourcemap" : null,
    entry: debug ? "./js/scripts-es6.js" : "./js/scripts.js",
    output: {
        path: __dirname + "/js",
        filename: "scripts.min.js"
    },
    plugins: debug ? [] : [
        new webpack.ProvidePlugin({"$":"jquery",
            "jQuery":"jquery",
            "window.jQuery":"jquery"}),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({ compress: false, mangle: false, sourcemap: false })
    ],
};
