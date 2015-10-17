module.exports = function(grunt) {
  //--------------------------------------------------
  //------------Project config------------------------
  //--------------------------------------------------
  var pkg = grunt.file.readJSON('package.json');
  grunt.initConfig({
    // Metadata.
    pkg: pkg,
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Released under the <%= pkg.license %> License */\n',
    // Task configuration.
    peg: {
      parser: {
        src: 'src/dust.pegjs',
        dest: 'lib/parser.js',
        options: {
          wrapper: function(src, parser) {
            var buildMsg = 'Do not edit this file directly. It is automatically generated from src/dust.pegjs';
            var wrapper = grunt.file.read("src/umdParserWrapper.js").replace('@@build', buildMsg).split('@@parser');
            return wrapper[0] + parser + wrapper[1];
          }
        }
      }
    },
    execute: {
      testRhino: {
        src: 'node_modules/.bin/rhino*',
        options: {
          args: ['-f', 'test/rhino.spec.js']
        }
      },
      buildParser: {
        src: 'src/build.js'
      }
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      core: {
        src: ['lib/dust.js', 'src/amd-core.js'],
        dest: 'tmp/dust-core.js'
      },
      full: {
        src: ['lib/dust.js', 'lib/parser.js', 'lib/compiler.js', 'src/amd-full.js'],
        dest: 'tmp/dust.js'
      }
    },
    copy: {
      core: {
        src: 'tmp/dust-core.js',
        dest: 'dist/dust-core.js'
      },
      coreMin: {
        src: 'tmp/dust-core.min.js',
        dest: 'dist/dust-core.min.js'
      },
      full: {
        src: 'tmp/dust.js',
        dest: 'dist/dust.js'
      },
      fullMin: {
        src: 'tmp/dust.min.js',
        dest: 'dist/dust.min.js'
      },
      license: {
        src: 'LICENSE',
        dest: 'dist/'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>',
        mangle: {
          except: ['require', 'define', 'module', 'dust']
        }
      },
      core: {
        src: '<%= concat.core.dest %>',
        dest: 'tmp/dust-core.min.js'
      },
      full: {
        src: '<%= concat.full.dest %>',
        dest: 'tmp/dust.min.js'
      }
    },
    clean: {
      build: ['tmp/*'],
      dist: ['dist/*']
    },
    jshint: {
      options: {
        jshintrc: true
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      libs: {
        src: ['lib/**/*.js', '!lib/parser.js'] // don't hint the parser which is autogenerated from pegjs
      }
    },
    connect: {
     testServer: {
       options: {
         port: 3000,
         keepalive: false
       }
     }
    },
    'saucelabs-jasmine': {
      all: {
        options: {
          urls: ["http://localhost:3000/"],
          build: process.env.TRAVIS_JOB_ID,
          throttled: 3,
          testname: 'core',
          browsers: [
            {browserName: 'chrome'},
            {browserName: 'firefox', platform: 'Windows 10'},
            {browserName: 'safari', version: 7, platform: 'OS X 10.9'},
            {browserName: 'safari', version: 6, platform: 'OS X 10.8'},
            {browserName: 'internet explorer', version: 11, platform: 'Windows 10'},
            {browserName: 'internet explorer', version: 10, platform: 'Windows 8'},
            {browserName: 'internet explorer', version: 9, platform: 'Windows 7'},
            {browserName: 'internet explorer', version: 8, platform: 'Windows 7'}
          ],
          sauceConfig: {
            'video-upload-on-pass': false
          }
        }
      }
    },
    jasmine: {
      options: {
        outfile: 'index.html',
        display: 'short',
        specs: ['test/templates/all.js', 'test/helpers/template.helper.js', 'test/templates.spec.js'],
        vendor: ['node_modules/ayepromise/ayepromise.js', 'test/lib/highland.js', 'test/lib/jsreporter.js']
      },
      /*tests production (minified) code*/
      testProd: {
        src: 'tmp/dust.min.js'
      },
      /*tests unminified code, mostly used for debugging by `grunt dev` task*/
      testDev : {
        src: 'tmp/dust.js'
      },
      /*runs unit tests with jasmine and collects test coverage info via istanbul template
      * tests unminified version of dust to make sure test coverage starts are correctly calculated
      * istanbul jumbles source code in order to record coverage, so this task is not suited for
      * debugging while developing. Use jasmine:testClient instead, which runs on unminified code
      * and can be easily debugged*/
      coverage : {
        src: 'tmp/dust.js',
        options: {
          display: 'none',
          template: require('grunt-template-jasmine-istanbul'),
          templateOptions: {
            coverage: 'tmp/coverage/coverage.json',
            report: 'tmp/coverage',
            thresholds: {
              lines: 82,
              statements: 82,
              branches: 70,
              functions: 85
            }
          }
        }
      }
    },
    jasmine_nodejs: {
      options: {
        useHelpers: true,
        reporters: {
          console: {
            colors: false,
            verbosity: 0
          }
        }
      },
      core: {
        specs: ['test/core.spec.js']
      },
      cjs: {
        specs: ['test/commonJS.spec.js']
      },
      dustc: {
        helpers: ['test/cli/matchers.helper.js'],
        specs: ['test/cli/*']
      },
      templates: {
        specs: ['test/templates.spec.js']
      }
    },
    watch: {
      lib: {
        files: ['<%= jshint.libs.src %>'],
        tasks: ['clean:build', 'buildLib']
      },
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: ['<%= jshint.libs.src %>', '<%= jasmine.options.specs %>'],
        tasks: ['testPhantom']
      }
    },
    bump: {
      options: {
        files: ['package.json', 'bower.json', 'lib/dust.js'],
        updateConfigs: ['pkg'],
        push: false,
        commitFiles: ['-a']
      }
    },
    log: {
      coverage: {
        options: {
          message: 'Open <%=jasmine.coverage.options.templateOptions.report%>/index.html in a browser to view the coverage.'
        }
      },
      copyForRelease: {
        options: {
          message: 'OK. Done copying version <%= pkg.version %> build from tmp to dist'
        }
      },
      release: {
        options: {
          message: ['OK. Done bumping, adding, committing, tagging and pushing the new version',
                    '',
                    'You still need to manually do the following:',
                    '  * git push upstream && git push upstream --tags',
                    '  * npm publish'].join('\n')
        }
      }
    },
    githubChanges: {
      dist: {
        options: {
          owner: "linkedin",
          repository: "dustjs",
          tagName: "v<%= pkg.version %>",
          onlyPulls: true,
          useCommitBody: true,
          auth: true
        }
      }
    }
  });

  //--------------------------------------------------
  //------------Custom tasks -------------------------
  //--------------------------------------------------
  grunt.registerMultiTask('log', 'Print some messages', function() {
    grunt.log.ok(this.data.options.message);
  });

  //--------------------------------------------------
  //------------External tasks -----------------------
  //--------------------------------------------------
  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-peg');
  grunt.loadNpmTasks('grunt-jasmine-nodejs');
  grunt.loadNpmTasks('grunt-github-changes');
  grunt.loadNpmTasks('grunt-saucelabs');

  //--------------------------------------------------
  //------------Grunt task aliases -------------------
  //--------------------------------------------------
  grunt.registerTask('buildLib',       ['jshint:libs', 'concat']);
  grunt.registerTask('build',          ['clean:build', 'peg', 'buildLib', 'uglify']);

  //test tasks
  grunt.registerTask('testNode',       ['jasmine_nodejs:templates', 'jasmine_nodejs:core', 'jasmine_nodejs:cjs']);
  grunt.registerTask('testRhino',      ['build', 'execute:testRhino']);
  grunt.registerTask('testPhantom',    ['build', 'jasmine:testProd']);
  grunt.registerTask('testCli',        ['jasmine_nodejs:dustc']);
  grunt.registerTask('test',           ['build', 'jasmine:testProd', 'testCli', 'testNode', 'execute:testRhino', 'jasmine:coverage']);

  //sauce labs integration (browser testing)
  grunt.registerTask('sauce',          process.env.SAUCE_ACCESS_KEY ? ['jasmine:testProd:build', 'connect:testServer', 'saucelabs-jasmine'] : []);

  //decide whether to run all tests or just the Node tests for Travis CI
  grunt.registerTask('travis',         (process.env.TEST === 'all') ? ['test', 'sauce'] : ['testNode', 'testCli']);

  //task for debugging in browser
  grunt.registerTask('dev',            ['build', 'jasmine:testDev:build', 'connect:testServer', 'watch:lib']);

  //task to run unit tests on client against prod version of code
  grunt.registerTask('testClient',     ['build', 'jasmine:testProd:build', 'connect:testServer', 'watch:lib_test']);

  //coverage report
  grunt.registerTask('coverage',       ['build', 'jasmine:coverage', 'log:coverage']);

  //release tasks
  grunt.registerTask('copyForRelease', ['clean:dist', 'copy', 'log:copyForRelease']);
  grunt.registerTask('buildRelease',   ['test', 'githubChanges', 'copyForRelease']);
  grunt.registerTask('releasePatch',   ['bump-only:patch', 'buildRelease', 'bump-commit', 'log:release']);
  grunt.registerTask('releaseMinor',   ['bump-only:minor', 'buildRelease', 'bump-commit', 'log:release']);
  // major release should probably be done with care
  //grunt.registerTask('releaseMajor',   ['bump-only:major', 'buildRelease', 'bump-commit:major', 'log:release']);

  //default task - full test
  grunt.registerTask('default',        ['test']);
};
