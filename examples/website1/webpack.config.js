const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('../../');

module.exports = {
	entry: './src/index',
	cache: false,

	mode: 'development',
	devtool: 'source-map',

	optimization: {
		minimize: false,
	},

	output: {
		publicPath: 'http://localhost:3001/',
	},

	resolve: {
		extensions: ['.jsx', '.js', '.json'],
	},

	module: {
		rules: [
			{
				test: /\.jsx?$/,
				loader: require.resolve('babel-loader'),
				options: {
					rootMode: 'upward',
					presets: [require.resolve('@babel/preset-react')],
				},
			},
		],
	},

	plugins: [
		new ModuleFederationPlugin({
			remotes: {
				'website2': '_federation_website2'
			},
			// shared is not support now
			shared: ['react', 'react-dom']
		}),
		new HtmlWebpackPlugin({
			template: './src/template.html',
			chunks: ['main'],
		}),
	],
};
