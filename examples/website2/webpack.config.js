const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('../../');

module.exports = {
	entry: {
		main: './src/index',
	},
	cache: false,
	devtool: 'source-map',
	mode: 'development',

	optimization: {
		minimize: false,
	},

	output: {
		publicPath: 'http://localhost:3002/',
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
			name: '_federation_website2',
			library: {
				type: 'var',
				name: '_federation_website2',
			},
			filename: 'remoteEntry.js',
			// shared is not support now
			shared: ['react', 'react-dom'],
			remotes: {
				'website1': 'website1'
			},
			exposes: {
				Title: './src/Title',
				App: './src/App'
			},
		}),
		new HtmlWebpackPlugin({
			template: './src/template.html',
			chunks: ['main'],
		}),
	],
	
};
