module.exports = function(grunt) {
	'use strict';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		jsbeautifier: {
			files: ['Gruntfile.js', 'gamepad.js', 'test/**/*.js'],
			options: grunt.file.readJSON('.jsbeautifyrc')
		},

		// Run JSHint on all sources
		jshint: {
			options: {
				jshintrc: './.jshintrc'
			},
			all: ['Gruntfile.js', 'gamepad.js', 'test/**/*.js']
		},

		// Run js-uglify on the actual library code
		uglify: {
			lib: {
				files: {
					'gamepad.min.js': ['gamepad.js']
				},
				options: {
					compress: {
						sequences: false
					}
				}
			}
		},

		// Run tests using buster
		buster: {
			libRaw: {
				test: {
					reporter: 'specification',
					'config-group': 'Library tests raw'
				}
			}
		},

		// Create YUI documentation
		yuidoc: {
			lib: {
				name: '<%= pkg.name %>',
				description: '<%= pkg.description %>',
				version: '<%= pkg.version %>',
				url: '<%= pkg.homepage %>',
				options: {
					paths: ['.'],
					exclude: '*.min.js',
					outdir: 'doc/'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-buster');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-yuidoc');
	grunt.loadNpmTasks('grunt-jsbeautifier');

	grunt.registerTask('format', ['jsbeautifier', 'jshint']);
	grunt.registerTask('compile', ['uglify']);
	grunt.registerTask('document', ['yuidoc']);
	grunt.registerTask('test', ['buster']);
	grunt.registerTask('default', ['format', 'compile', 'test', 'document']);
};
