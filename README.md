## module-federation4

`webpack-plugin-module-federation` for Webpack4, backport from https://github.com/ScriptedAlchemy/webpack-external-import

## State

not production ready at present.

## Usage

```shell
npm install --save-dev webpack-plugin-module-federation
```

Configure your `webpack.config.js`

```js
const moduleFederationPlugin = require('webpack-plugin-module-federation');

module.exports = {
    output: {
		publicPath: 'http://localhost:3002/',
	},
    plugins: [
        new moduleFederationPlugin({
            new ModuleFederationPlugin({
                name: '_federation_website2',
                library: 'website2',
                filename: 'remoteEntry.js',
                libraryTarget: 'global',
                remotes: {
                    'website1': 'website1'
                },
                expose: {
                    Title: './src/Title',
                    App: './src/App'
                },
            }),
        });
    ]
};
```

## Import module from remote

In remote project, configure `webpack.config.js`.

```js
const moduleFederationPlugin = require('webpack-plugin-module-federation');

module.exports = {
    output: {
		publicPath: 'http://localhost:3001/',
	},
    plugins: [
        new moduleFederationPlugin({
            new ModuleFederationPlugin({
                name: '_federation_website1',
                library: 'website1',
                filename: 'remoteEntry.js',
                libraryTarget: 'global',
                remotes: {
                    'website2': '_federation_website2'
                },
                expose: {
                    App: './src/App'
                },
            }),
        });
    ]
};
```

Add `remoteEntry` in your HTML

```html
<html>
	<head>
		<script src="http://localhost:3002/remoteEntry.js"></script>
	</head>
	<body>
		<div id="app"></div>
	</body>
</html>
```

Then use dynamic import 

```jsx
import React, { lazy, Suspense, useState } from 'react';
import Footer from './Footer';

const Title = lazy(() => import('website2/Title')); // federated

export default () => {
	return (
		<>
			<Suspense fallback={'fallback'}>
				<Title />
			</Suspense>
			<p>
				This app loads the heading above from website2, and doesnt expose
				anything itself.
			</p>
			<Footer />
		</>
	);
};
```

## Exmaple

See [examples here](./examples).

## Preview

![preview](https://img.alicdn.com/tfs/TB1kD5fDeT2gK0jSZFvXXXnFXXa-600-311.gif)