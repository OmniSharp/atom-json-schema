var gulp = require('gulp');
var ts = require('typescript');
var through = require('through2');
var gutil = require('gulp-util');
var merge = require('merge-stream');
var del = require('del');
var _ = require('lodash');
var path = require('path');

// Simply take TS code and strip anything not javascript
// Does not do any compile time checking.
function tsTranspile() {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        var res = ts.transpile(file.contents.toString(), { module: ts.ModuleKind.CommonJS });

        file.contents = new Buffer(res);
        file.path = gutil.replaceExtension(file.path, '.js');
        gutil.log(gutil.colors.cyan('Writing ') + gutil.colors.green(_.trim(file.path.replace(__dirname, ''), path.sep)));

        this.push(file);

        cb();
    });
}

function tsTranspiler(source, dest) {
    return source
        .pipe(tsTranspile())
        .pipe(gulp.dest(dest));
}

var metadata = {
    lib: ['lib/**/*.ts', '!lib/**/*.d.ts'],
    //spec: ['spec/**/*.ts'],
}


gulp.task('typescript', ['clean'], function() {
    var lib = tsTranspiler(gulp.src(metadata.lib), './lib');
    //var spec = tsTranspiler(gulp.src(metadata.spec), './spec');

    //return merge(lib, spec);
    return lib;
});

gulp.task('clean', ['clean:lib'/*, 'clean:spec'*/]);

gulp.task('clean:lib', function(done) {
    del(metadata.lib.map(function(z) { return gutil.replaceExtension(z, '.js'); }), function(err, paths) {
        _.each(paths, function(path) {
            gutil.log(gutil.colors.red('Deleted ') + gutil.colors.magenta(path.replace(__dirname, '').substring(1)));
        });
        done();
    });
});

gulp.task('clean:spec', function(done) {
    del(metadata.spec.map(function(z) { return gutil.replaceExtension(z, '.js'); }), function(err, paths) {
        _.each(paths, function(path) {
            gutil.log(gutil.colors.red('Deleted ') + gutil.colors.magenta(path.replace(__dirname, '').substring(1)));
        });
        done();
    });
});

gulp.task('npm-postinstall', ['typescript']);

gulp.task('npm-prepublish', ['typescript']);

// The default task (called when you run `gulp` from CLI)
gulp.task('default', ['typescript']);
