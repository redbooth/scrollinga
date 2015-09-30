module.exports = {
  entry: './scrollinga.js'
, output: {
    path: __dirname + '/dist'
  , filename: 'scrollinga.js'
  , libraryTarget: 'umd'
  , library: 'Scrollinga'
  }
, module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"}
    ]
  }
};
