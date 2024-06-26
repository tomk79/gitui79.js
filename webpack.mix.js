const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel applications. By default, we are compiling the CSS
 | file for the application as well as bundling up all the JS files.
 |
 */

mix
	.webpackConfig({
		module: {
			rules:[
				{
					test: /\.txt$/i,
					use: ['raw-loader'],
				},
				{
					test: /\.csv$/i,
					loader: 'csv-loader',
					options: {
						dynamicTyping: true,
						header: false,
						skipEmptyLines: false,
					},
				},
				{
					test:/\.twig$/,
					use:['twig-loader']
				}
			]
		},
		resolve: {
			fallback: {
				"fs": false,
				"path": false,
				"crypto": false,
				"stream": false,
			}
		}
	})


	// --------------------------------------
	// gitui79
	.js('src/gitui79.js', 'dist/')
	.js('src/gitui79.bundled.js', 'dist/')
	.sass('src/gitui79.scss', 'dist/')
	.sass('src/gitui79.bundled.scss', 'dist/')
	.sass('src/themes/darkmode.scss', 'dist/themes/')
	.sass('src/themes/darkmode.bundled.scss', 'dist/themes/')

;
