import JavascriptModulesPlugin from 'webpack/lib/JavascriptModulesPlugin';
import Template from 'webpack/lib/Template';
import propertyAccess from './webpack/lib/propertyAccess';
import ImportDependency from 'webpack/lib/dependencies/ImportDependency';

import validateOptions from 'schema-utils';
import ContainerExposedDependency from './ContainerExposedDependency';
import { ConcatSource } from 'webpack-sources';
import ContainerEntryDependency from './ContainerEntryDependency';
import ContainerEntryModuleFactory from './ContainerEntryModuleFactory';
import RemoteModule from './RemoteModule';
import SharedModule from './SharedModule';
import ContainerEntryModule from './ContainerEntryModule';

const UNSPECIFIED_EXTERNAL_TYPE_REGEXP = /^[a-z0-9]+ /;

const globalType = 'global';

export default class ModuleFederationPlugin {
	static get name() {
		return ModuleFederationPlugin.constructor.name;
	}

	constructor(options) {
		const name = options.name ?? `remoteEntry`;
		validateOptions(
			{
				type: 'object',
				properties: {
					shared: {
						type: ['object', 'array'],
					},
					exposes: {
						type: ['object', 'array'],
					},

					remotes: {
						type: ['object', 'array'],
					},
					name: {
						type: 'string',
						default: name,
					},
					
					library: {
						type: 'object',
						properties: {
							name: {
								type: 'string'
							},
							type: {
								type: 'string',
								default: 'var',
								enum: [
									'var',
									'this',
									'window',
									'self',
									'global',
									'commonjs',
									'commonjs2',
									'amd',
									'amd-require',
									'umd',
									'umd2',
									'system',
								]
							},
						}
					},

					filename: {
						anyOf: [{ type: 'string' }, { instanceof: 'Function' }],
					},
				},
				additionalProperties: false,
			},
			options,
			{ name: ModuleFederationPlugin.name },
		);

		this.options = {
			shared: options.shared ?? null,
			name,
			library: options.library ?? {
				type: 'global',
				name: name,
			},
			filename: options.filename ?? undefined, // Undefined means, use the default behaviour
			exposes: options.exposes ?? {},
			remotes: options.remotes ?? {},
		};

		let exposedMap = this.options.exposes || {};

		if (Array.isArray(this.options.exposes)) {
			exposedMap = {};
			for (const exp of this.options.exposes) {
				// TODO: Check if this regex handles all cases
				exposedMap[exp.replace(/(^(?:[^\w])+)/, '')] = exp;
			}
		}

		let sharedMap = this.options.shared || {};

		if (Array.isArray(this.options.shared)) {
			sharedMap = {};
			for (const exp of this.options.shared) {
				// TODO: Check if this regex handles all cases
				sharedMap[exp.replace(/(^(?:[^\w])+)/, '')] = exp;
			}
		}

		this.options.shared = sharedMap;
		this.options.exposes = exposedMap;

		if (!this.options.library.name) {
			this.options.library.name = name;
		}
	}

	apply(compiler) {
		if (compiler.options.optimization.runtimeChunk) {
			throw new Error(
				'This plugin cannot integrate with RuntimeChunk plugin, please remote `optimization.runtimeChunk`.',
			);
		}

		compiler.options.output.jsonpFunction = `${
			compiler.options.output.jsonpFunction
		}${compiler.name ?? ''}${this.options.name}`;

		let deps = [];

		compiler.hooks.make.tapAsync(
			ModuleFederationPlugin.name,
			(compilation, callback) => {
			
				const asyncMap = {
					...this.options.exposes,
				};
				deps = Object.entries(asyncMap).map(([name, request], idx) => {
					const dep = new ContainerExposedDependency(name, request);
					dep.loc = {
						name,
						index: idx,
					};
					return dep;
				})
				
				
				compilation.addEntry(
					compilation.context,
					new ContainerEntryDependency(
						deps,
						this.options.name,
					),
					this.options.name,
					callback,
				);

			},
		);

		const handleRemote = (value, type, callback) => {
			/** @type {string} */
			let externalConfig = value;
			// When no explicit type is specified, extract it from the externalConfig
			// if (
			// 	type === undefined &&
			// 	UNSPECIFIED_EXTERNAL_TYPE_REGEXP.test(externalConfig)
			// ) {
			// 	const idx = externalConfig.indexOf(' ');
			// 	type = externalConfig.substr(0, idx);
			// 	externalConfig = externalConfig.substr(idx + 1);
			// }

			callback(
				null,
				new RemoteModule(
					externalConfig,
					type || globalType,
					value,
					this.options.remotes,
					this.options.shared,
				),
			);
		};


		const handleShared = (value, type, callback) => {

			let externalConfig = value;

			// When no explicit type is specified, extract it from the externalConfig
			if (
				type === undefined &&
				UNSPECIFIED_EXTERNAL_TYPE_REGEXP.test(externalConfig)
			) {
				const idx = externalConfig.indexOf(' ');
				type = externalConfig.substr(0, idx);
				externalConfig = externalConfig.substr(idx + 1);
			}

			callback(
				null,
				new SharedModule(
					externalConfig,
					'default', // TODO: remove hardcode
					value,
				),
			);
		};


		compiler.hooks.normalModuleFactory.tap(ModuleFederationPlugin.name, (nmf) => {
			nmf.hooks.factory.tap(ModuleFederationPlugin.name, (fn) => {
				return (result, callback) => {
					const request = result?.request;
					const requestScope = result?.request?.split('/')?.shift?.();
					
					if (this.options.remotes[requestScope]) {
						return handleRemote(result.request, null, callback);
					}
					if (this.options.shared[request]) {
						return handleShared(
							this.options.shared[request],
							undefined,
							callback,
						);
					}
					fn(result, (error, mod) => {
						callback(error, mod);
					});
				};
			});

			// nmf.hooks.factory.tap();
		});


		// compiler.hooks.compile.tap(
		// 	ContainerPlugin.name,
		// 	() => {
		// 		new OverridablesPlugin(
		// 			this.options.shared,
		// 		).apply(compiler);
		// 	},
		// );


		compiler.hooks.thisCompilation.tap(
			ModuleFederationPlugin.name,
			(compilation, { normalModuleFactory }) => {
				compilation.dependencyFactories.set(
					ContainerEntryDependency,
					new ContainerEntryModuleFactory(),
				);

				compilation.dependencyFactories.set(
					ContainerExposedDependency,
					normalModuleFactory,
				);

				compilation.hooks.afterOptimizeChunkAssets.tap(
					ModuleFederationPlugin.name,
					(chunks) => {
	
						for (let chunk of chunks) {
							if (!chunk.rendered) {
								// Skip already rendered (cached) chunks
								// to avoid rebuilding unchanged code.
								continue;
							}
							
							for (const fileName of chunk.files) {
								const source = compilation.assets[fileName];

								let result = source;

								if (chunk.name === this.options.name) {
									const libName = Template.toIdentifier(
										compilation.getPath(this.options.library.name, {
											chunk,
										}),
									);

									switch (this.options.library.type) {
										case 'var': {
											result = new ConcatSource(`var ${libName} =`, source);
											break;
										}
										case 'this':
										case 'window':
										case 'self':
											result = new ConcatSource(
												`${this.options.library.type}${propertyAccess([libName])} =`,
												source,
											);
											break;
										case 'global':
											result = new ConcatSource(
												`${compiler.options.output.globalObject}${propertyAccess([
													libName,
												])} =`,
												source,
											);
											break;
										case 'commonjs':
										case 'commonjs2': {
											result = new ConcatSource(
												`exports${propertyAccess([libName])} =`,
												source,
											);
											break;

										}
										case 'amd': // TODO: Solve this?
										case 'amd-require': // TODO: Solve this?
										case 'umd': // TODO: Solve this?
										case 'umd2': // TODO: Solve this?
										case 'system': // TODO: Solve this?
										default:
											throw new Error(
												`${this.options.library.type} is not a valid Library target`,
											);

									}

								}
								compilation.assets[fileName] = result;											

							}
						}
					}
				)
				

				compilation.hooks.afterChunks.tap(ModuleFederationPlugin.name, chunks => {
					for (const chunk of chunks) {
						if (chunk.name === this.options.name) {
							chunk.filenameTemplate = this.options.filename;
						}
					}
				});
			},
		);
	}
}
