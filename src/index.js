#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import ip from 'ip';
import chalk from 'chalk';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import clearConsole from 'console-clear';
import ProgressBarPlugin from 'progress-bar-webpack-plugin';
import cssnext from 'postcss-cssnext';
import discardComments from 'postcss-discard-comments';
import Zip from 'adm-zip';
import { crossPlatformPathRegex } from './util';

export default function run(args, callback) {

	//if it is just package, then package appropriately
	if (args.package) {
		return packageZimlet(args, callback);
	}

	let config = configure(args);

	let compiler = webpack(config);

	compiler.plugin('failed', err => {
		console.error(err.stack || err);
		if (err.details) console.error(err.details);
	});

	compiler.plugin('done', stats => {
		let info = stats.toJson();

		if (stats.hasErrors()) {
			process.stdout.write(chalk.red('Build failed!\n\n'));
			info.errors.forEach(err => console.error(err));
		}
		else {
			clearConsole();

			if (stats.hasWarnings()) {
				info.warnings.forEach(err => console.warn(err));
			}

			process.stdout.write(chalk.green('Compiled successfully!\n\n'));

			if (config.devServer) {
				let { https, host, port } = config.devServer;
				let protocol = https ? 'https' : 'http';
				if (host === '0.0.0.0') host = 'localhost';
				let serverAddr = `${protocol}://${host}:${chalk.bold(port)}/index.js`;
				let localIpAddr = `${protocol}://${ip.address()}:${chalk.bold(port)}/index.js`;

				process.stdout.write('You can view the application in browser.\n\n');
				process.stdout.write(`${chalk.bold('Local:')}            ${serverAddr}\n`);
				process.stdout.write(`${chalk.bold('On Your Network:')}  ${localIpAddr}\n`);
			}
		}
	});

	if (config.devServer) {
		new WebpackDevServer(compiler, config.devServer).listen(config.devServer.port);
	}
	else {
		compiler.run( (err, stats) => {
			if (!err && stats.hasErrors()) {
				err = `${stats.errors.length} errors`;
			}
			callback(err, null);
		});
	}
}

export function configure(env) {
	env = env || {};
	const watch = env.watch || env.w || process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development';
	const PROD = !watch;

	let https = !(process.env.HTTPS === 'false' || env.https === false),
		host = process.env.HOST || env.host || 'localhost',
		port = process.env.PORT || env.port || 8081;

	let cwd = process.cwd(),
		context = cwd,
		pkg;

	try {
		pkg	= require(path.resolve(cwd, 'package.json'));
	}
	catch (e) {}

	if (!pkg) {
		pkg = { main: 'index.js' };

	}

	// entry point (initial file to load)
	let entry = path.resolve(cwd, pkg.module || pkg['jsnext:main'] || pkg.main);
	if (isDir(entry)) entry = path.resolve(entry, 'index.js');

	// attempt to use ./src dir if present:
	if (isDir(path.resolve(cwd, 'src'))) context = path.resolve(context, 'src');


	// normalize desination dir
	let dest = path.resolve(cwd, env.dest || 'build');

	// use absolute paths
	context = path.resolve(context);

	let componentDirs = [
		path.resolve(context, 'components'),
		path.resolve(context, 'screens'),
		path.resolve(context, 'pages')
	];

	let cssLoaderOptions = {
		autoprefixer: false,
		sourceMap: watch && !PROD
	};

	let postCssLoaderOptions = {
		plugins: [
			cssnext({ browsers: ['last 2 versions', 'ie >= 11', 'iOS >= 8'] }),
			discardComments({ removeAll: true })
		]
	};

	let cssModulesRegexp = crossPlatformPathRegex(/(?:([^/@]+?)(?:-(?:pages?|components?|screens?))?\/)?src\/(?:pages|components|screens)\/(.+?)(\/[a-z0-9._-]+[.](less|css))?$/);

	let webpackConfig = {
		context,
		entry: path.resolve(__dirname, 'entry.js'),

		output: {
			path: dest,
			filename: `index.js`,
			chunkFilename: '[name].[chunkhash:8].chunk.js',
			// NOTE: Explicit public path is required in order to make HMR work within an sourceless iframe.
			// This is due to a bug in webpack-dev-server that uses the document protocol for all https pages:
			// https://github.com/webpack/webpack-dev-server/blob/c490b245ad65f315762e03e51710f7f7177b1e7b/client/index.js#L188-L190
			publicPath: watch ? `http${https?'s':''}://${host}:${port}/` : '/'
		},

		resolve: {
			extensions: ['.jsx', '.js', '.json', '.css', '.less'],
			mainFields: ['browser', 'module', 'jsnext:main', 'main'],
			modules: [
				path.resolve(cwd, 'node_modules'),
				path.resolve(__dirname, '..', 'node_modules'),
				path.resolve(__dirname, '../../..'), // Resolves to the `packages` directory
				'node_modules'
			],

			alias: {
				preact: path.resolve(__dirname, 'preact.js'),
				react: 'preact',
				'react-dom': 'preact-compat',
				style: path.resolve(context, 'style'),
				'zimlet-cli-entrypoint': path.resolve(context, entry)
			}
		},

		resolveLoader: {
			modules: [
				path.resolve(__dirname, 'loaders'),
				path.resolve(__dirname, '..', 'node_modules'),
				path.resolve(cwd, 'node_modules')
			]
		},

		module: {
			rules: [
				{
					test: /\.jsx?$/,
					loader: 'babel-loader',
					options: {
						babelrc: false,
						comments: false,
						presets: [
							[require.resolve('babel-preset-es2015'), { loose: true, modules: false }],
							require.resolve('babel-preset-stage-0')
						],
						plugins: [
							require.resolve('babel-plugin-transform-decorators-legacy'),
							require.resolve('babel-plugin-transform-object-assign'),
							[require.resolve('babel-plugin-transform-react-jsx'), { pragma: 'preact.h' }]
						]
					}
				},
				{
					test: /\.(less|css)$/,
					// include: /(^|\/)src\/(?:components|screens)\//,
					include: componentDirs,
					use: [
						{
							loader: path.resolve(__dirname, 'zimlet-style-loader.js')
						},
						{
							loader: 'css-loader',
							options: {
								...cssLoaderOptions,
								modules: true,
								importLoaders: 1,
								localIdentRegExp: cssModulesRegexp,
								localIdentName: '[1]_[2]_[local]'
							}
						},
						{
							loader: 'postcss-loader',
							options: postCssLoaderOptions
						},
						{
							loader: 'less-loader'
						}
					]
				},
				{
					test: /\.(less|css)$/,
					// exclude: /(^|\/)src\/(?:components|screens)\//,
					exclude: componentDirs,
					use: [
						{
							loader: path.resolve(__dirname, 'zimlet-style-loader.js')
						},
						{
							loader: 'css-loader',
							options: cssLoaderOptions
						},
						{
							loader: 'postcss-loader',
							options: postCssLoaderOptions
						},
						{
							loader: 'less-loader'
						}
					]
				},
				{
					test: /\.(xml|html|txt|md)$/,
					loader: 'raw-loader'
				},
				{
					test: /\.(svg|ttf|woff2?|eot|otf|jpe?g|png|gif)$/i,
					loader: watch ? 'url-loader' : 'file-loader'
				}
			]
		},

		node: PROD ? {
			console: false,
			Buffer: false,
			__filename: false,
			__dirname: false,
			setImmediate: false
		} : {},

		plugins: [].concat(
			PROD ? [
				new webpack.NoEmitOnErrorsPlugin(),
				new webpack.HashedModuleIdsPlugin(),
				new webpack.optimize.ModuleConcatenationPlugin(),
				new webpack.optimize.UglifyJsPlugin()
			] : [
				new webpack.NamedModulesPlugin(),
				new webpack.HotModuleReplacementPlugin()
			],

			new webpack.LoaderOptionsPlugin({
				minimize: PROD,
				debug: !PROD
			}),

			new ProgressBarPlugin({
				format: '\u001b[90m\u001b[44mBuild\u001b[49m\u001b[39m [:bar] \u001b[32m\u001b[1m:percent\u001b[22m\u001b[39m (:elapseds) \u001b[2m:msg\u001b[22m',
				renderThrottle: 100,
				summary: false
			}),

			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify(PROD?'production':'development')
			})
		),

		watchOptions: {
			ignored: [
				'build',
				dest,
				path.resolve(cwd, 'node_modules')
			]
		},

		stats: 'errors-only',

		devtool: watch ? 'cheap-module-eval-source-map' : 'source-map'
	};

	if (watch) {
		webpackConfig.entry = [
			webpackConfig.entry,
			`webpack-dev-server/client?${https ? 'https' : 'http'}://${host}:${port}/`,
			`webpack/hot/dev-server?${https ? 'https' : 'http'}://${host}:${port}/`
		];

		webpackConfig.devServer = {
			host,
			port,
			hot: !process.env.DISABLE_HOT,
			https,
			compress: true,
			publicPath: '/',
			contentBase: context,
			disableHostCheck: true,
			before(app) {
				app.use(require('cors')({
					maxAge: 3600
				}));
			},
			watchOptions: {
				ignored: [
					'build',
					dest,
					path.resolve(cwd, 'node_modules')
				]
			},
			overlay: false,
			noInfo: true,
			quiet: true,
			stats: 'errors-only'
		};
	}

	return webpackConfig;
}

function packageZimlet(args, callback) {

	// normalize built files source directory and desination package dir
	let cwd = process.cwd();
	let builddir = path.resolve(cwd, args.builddir || 'build');
	let dest = path.resolve(cwd, args.dest || 'pkg', `${args.name}.zip`);

	//Create the xml descriptor file for the zimlet
	let xmlFile = `${args.name}.xml`;

	let zimletXML = `<zimlet name="${args.name}" version="${args['pkg-version']}" description="${args.description}">`;

	fs.readdir(builddir, (err, files) => {
		files.forEach(file => {
			if (file.match(/\.js$/)) {
				zimletXML += `\n\t<include>${file}</include>`;
			}
			else if (file.match(/\.css$/)) {
				zimletXML += `\n\t<includeCSS>${file}</includeCSS>`;
			}
			else if (file !== xmlFile) {
				zimletXML += `\n\t<resource>${file}</resource>`;
			}
		});

		zimletXML += '\n</zimlet>';

		fs.writeFile(path.resolve(builddir, xmlFile), zimletXML,
			(err) => {
				if (err) {
					return callback('Failed to write XML file: ' + err);
				}

				//Zip up the contents of the build dir along with the xml file as the final zimlet deliverable
				let zipFile = new Zip();
				zipFile.addLocalFolder(builddir, '');
				zipFile.writeZip(dest);

				return callback(null, `Successfully packaged zimlet to: ${dest}\n`);
			});
	});

}

function isDir(filepath) {
	try {
		return !!fs.statSync(filepath).isDirectory();
	}
	catch (err) { }
}