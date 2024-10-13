const path = require('node:path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    main: [path.resolve(__dirname, 'src', 'main.ts')],
    background: path.resolve(__dirname, 'src', 'background.ts'),
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
      // {
      //   test: /\.(sa|sc)ss$/,
      //   use: [
      //     MiniCssExtractPlugin.loader,
      //     'css-loader',
      //     'sass-loader'
      //   ]
      // },
      {
        test: /\.(jpg|jpeg|png|gif|woff|woff2|eot|ttf|svg)$/i,
        use: 'url-loader?limit=1024',
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: '.', to: '.', context: 'public' }],
    }),
  ],
};
