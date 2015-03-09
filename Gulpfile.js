var gulp        = require('gulp'),
    lazypipe    = require('lazypipe'),
    del         = require('del'),
    vinylPaths  = require('vinyl-paths'),
    stylish     = require('jshint-stylish'),
    jshint      = require('gulp-jshint'),
    umd         = require('gulp-umd'),
    rename      = require('gulp-rename'),
    concat      = require('gulp-concat'),
    uglify      = require('gulp-uglify'),
    sourcemaps  = require('gulp-sourcemaps'),
    notify      = require('gulp-notify'),
    plumber     = require('gulp-plumber');

var onError = function( err ) {
  notify.onError( {
    title:    'Gulp Failure!',
    message:  err.message || err || 'Error',
    sound:    'Beep'
  } );

  this.emit( 'end' );
  this.end();
};

var sources = {
  utils: ['./src/utils/**/*.js'],
  app: [
    './src/application.js',
    './src/router.js',
    './src/views.js',
    './src/local.js',
    './src/analytics.js',
    './src/experiments.js',
    './src/transition.js'
  ]
};

var umdConf = {
  dependencies: function(file) {
    return [
      {
        name: 'lodash',
        amd: 'lodash',
        cjs: 'lodash',
        global: '_',
        param: '_'
      },
      {
        name: 'backbone',
        amd: 'backbone',
        cjs: 'backbone',
        global: 'Backbone',
        param: 'Backbone'
      },
      {
        name: 'localStorage',
        amd: 'storage',
        cjs: 'storage',
        global: 'localStorage',
        param: 'localStorage'
      }
    ];
  },
  exports: function(file) {
      return 'Monaco';
  },
  namespace: function(file) {
    return 'Monaco';
  }
};

var jshintOptions = {
  // browser:   true,      // standard browser globals should be predefined( e.g: window, document, etc...)
  camelcase: false,     // force camelCase style or UPPER_CASE variable style
  curly:     true,      // mandatory curly braces
  eqeqeq:    false,     // not enforcing the strict equality ( BUT HIGHLY RECOMMENDED )
  forin:     true,      // must filter object items in for in loops ( obj.hasOwnProperty )
  freeze:    true,      // prohibits overwriting prototypes of native objects
  immed:     true,      // prohibits the use of immediate function invocations without wrapping them in parentheses
  indent:    2,         // enforces specific tab width
  latedef:   true,      // prohibits the use of a variable before it was defined
  newcap:    true,      // requires you to capitalize names of constructor functions
  noarg:     true,      // prohibits the use of arguments.caller and arguments.callee ( deprecated methods )
  nonbsp:    true,      // warns about "non-breaking whitespace" characters
  nonew:     true,      // prohibits the use of constructor functions for side-effects
  quotmark:  true,      // don't enforce one particular style but want some consistency
  undef:     true,      // prohibits the use of explicitly undeclared variables
  unused:    'vars',    // warns when you define and never use your variables ( not for function parameters )
  // strict:    true,      // requires all functions to run in ECMAScript 5's strict mode
  trailing:  true,      // makes it an error to leave a trailing whitespace in your code
  maxlen:    180,       // sets the max length of a line

  // these options will make JSHint produce less warnings about your code

  boss:      false,     // DO NOT suppresses warnings about the use of assignments in cases where comparisons
                        // are expected
  eqnull:    false,     // DO NOT suppresses warnings about == null comparisons
  evil:      false,     // DO NOT suppresses warnings about the use of eval
  maxerr:    10,        // allows you to set the maximum amount of warnings JSHint will produce before giving up

  // these options let JSHint know about some pre-defined global variables
  globals : {
    'escape' : true,
    'encodeURIComponent' : true,
    '_gaq': true,
    '_' : true,
    'Backbone' : true,
    'localStorage' : true,
    'Promise': true
  }
};


var lintScripts = lazypipe()
  .pipe( jshint, jshintOptions )
  .pipe( jshint.reporter, stylish )
  .pipe( jshint.reporter, 'fail' );


gulp.task('monaco:clean', function() {
  return gulp.src(['./monaco.*', './lib/**/*.*'], {read: false})
    .pipe(plumber({errorHandler: onError}))
    .pipe(vinylPaths(del));
} );

gulp.task('monaco:utils', function() {
  return gulp.src(sources.utils)
    .pipe( plumber( { errorHandler: onError } ) )
    .pipe(lintScripts())
    .pipe(umd(umdConf))
    .pipe(rename({prefix: 'monaco-'}))
    .pipe(gulp.dest('./lib/utils/'));
});

gulp.task('monaco:modules', function() {
  return gulp.src(sources.app)
    .pipe( plumber( { errorHandler: onError } ) )
    .pipe(lintScripts())
    .pipe(umd(umdConf))
    .pipe(rename({prefix: 'monaco-'}))
    .pipe(gulp.dest('./lib/'))
});

gulp.task('monaco', ['monaco:utils', 'monaco:modules'], function() {
  return gulp.src(sources.app)
  .pipe( plumber( { errorHandler: onError } ) )
  .pipe(lintScripts())
  .pipe(umd(umdConf))
  .pipe(concat('monaco.js'))
  .pipe(gulp.dest('./'))
  .pipe(sourcemaps.init())
  .pipe(uglify())
  .pipe(rename({extname: '.min.js'}))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('./'));
});

