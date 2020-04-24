const ModuleFederationPlugin = require('../../../lib');
const path = require('path');

module.exports = {
	entry: {
		main: path.join(__dirname, './index.js'),
	},
	output: {
		publicPath: path.join(__dirname, './dist'),
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
					presets: [],
				},
			},
		],
	},
	plugins: [
		new ModuleFederationPlugin({
			name: '_federation_project1',
			library: {
				type: 'var',
				name: '_federation_project1',
			},
			filename: 'remoteEntry.js',
			exposes: {
				index: './index.js'
			},
		}),
	],
};
