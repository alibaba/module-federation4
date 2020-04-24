const ModuleFederationPlugin = require('../../../lib');
const path = require('path');

module.exports = {
	entry: {
		main: path.join(__dirname, './index.js'),
	},
	output: {
		publicPath: path.join(__dirname, './dist'),
		libraryTarget: 'commonjs',
	},
	target: 'node',
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
	optimization: {
		minimize: false,
	},
	plugins: [
		new ModuleFederationPlugin({
			name: '_federation_project2',
			library: {
				type: 'global',
				name: '_federation_project2',
			},
			filename: 'remoteEntry.js',
            remotes: {
                'project1': '_federation_project1'
			},
		}),
	],
};
