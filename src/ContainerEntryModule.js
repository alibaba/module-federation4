import Module from 'webpack/lib/Module';
import AsyncDependenciesBlock from 'webpack/lib/AsyncDependenciesBlock';
import RuntimeGlobals from './webpack/lib/RuntimeGlobals';
import Template from 'webpack/lib/Template';
import { ConcatSource, OriginalSource, RawSource } from 'webpack-sources';

const SOURCE_TYPES = new Set(['javascript']);
const RUNTIME_REQUIREMENTS = new Set([
	RuntimeGlobals.definePropertyGetters,
	RuntimeGlobals.exports,
	RuntimeGlobals.returnExportsFromRuntime,
]);

export default class ContainerEntryModule extends Module {
	constructor(dependency) {
		super('javascript/dynamic', null);
		this.expose = dependency?.exposedDependencies;
	}

	getSourceTypes() {
		return SOURCE_TYPES;
	}

	basicFunction(args, body) {
		return `function(${args}) {\n${Template.indent(body)}\n}`;
	}

	identifier() {
		return `container entry ${JSON.stringify(
			this.expose?.map(item => item.exposedName),
		)}`;
	}

	readableIdentifier() {
		return `container entry`;
	}

	needBuild(context, callback) {
		return callback(null, !this.buildMeta);
	}

	/**
     * Removes all dependencies and blocks
     * @returns {void}
     */
    clearDependenciesAndBlocks() {
        this.dependencies.length = 0;
        this.blocks.length = 0;
    }

	build(options, compilation, resolver, fs, callback) {
		this.buildMeta = {};
		this.buildInfo = {
			strict: true,
		};

		this.clearDependenciesAndBlocks();

		for (const dep of (this.expose || [])) {
			const block = new AsyncDependenciesBlock(
				undefined,
				dep.loc,
				dep.userRequest,
			);
			block.addDependency(dep);
			this.addBlock(block);
		}

		callback();
	}

	source(depTemplates, runtimeTemplate) {
		const runtimeRequirements = RUNTIME_REQUIREMENTS;
		const getters = [];

		let result = '';

		for (const block of this.blocks) {
			const {
				dependencies: [dep],
			} = block;
			const name = dep.exposedName;
			const mod = dep.module;
			const request = dep.userRequest;

			let str;

			if (!mod) {
				str = runtimeTemplate.throwMissingModuleErrorBlock({
					request: dep.userRequest,
				});
			} else {
				str = `return ${runtimeTemplate.blockPromise({
					block,
					message: request,
				})}.then(${this.basicFunction(
					'',
				`return ${runtimeTemplate.moduleRaw({
						module: mod,
						request,
						weak: false,
						runtimeRequirements,
					})}`,
				)});`;
			}

			getters.push(
				`${Template.toNormalComment(
					`[${name}] => ${request}`,
				)}"${name}": ${this.basicFunction('', str)}`,
			);
		}

		result = [
				`\n${"var"} __MODULE_MAP__ = {${getters.join(',')}};`,
				`\n${"var"} __GET_MODULE__ = ${this.basicFunction(
					['module'],
					`return typeof __MODULE_MAP__[module] ==='function' ? __MODULE_MAP__[module].apply(null) : Promise.reject(new Error('Module ' + module + ' does not exist.'))`,
				)};`,
				`\n\n module.exports = {\n`,
				Template.indent([
					`get: ${this.basicFunction(
						'id',
						'return __GET_MODULE__(id)',
					)},`,

					`override: ${this.basicFunction(
						'obj',
						`Object.assign(__MODULE_MAP__, obj)`,
					)},`,
					//  ${RuntimeGlobals.definePropertyGetters(
					// 	['module', 'getter'],
					// 	'__webpack_require__.shared[module] = getter;',
					// )}`
				]),
				`};`,
				// `)`,
			].join('');

		if (this.useSourceMap) {
			return new OriginalSource(result, this.identifier());
		} else {
			return new RawSource(result);
		}
	}

	/**
	 * Get a list of runtime requirements
	 * @param {SourceContext} context context for code generation
	 * @returns {Iterable<string> | null} required runtime modules
	 */
	getRuntimeRequirements(context) {
		return [RuntimeGlobals.module, RuntimeGlobals.require];
	}


	size(type) {
		return 42;
	}
}
