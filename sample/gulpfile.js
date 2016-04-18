var gulp = require('gulp'),
    htmlmin = require('gulp-htmlmin'),
    uglify = require("gulp-uglify"),
    cssnano = require('gulp-cssnano'),
    concat = require("gulp-concat"),
    rename = require('gulp-rename'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    order = require('gulp-order'),
    del = require('del');

gulp.task('clean', function () {
    del(['dist/*']);
});

gulp.task('images', function() {
    gulp.src(['src/assets/*.png'])
    .pipe(gulp.dest('dist'));

    gulp.src('src/assets/css/images/*')
    .pipe(gulp.dest('dist/css/images'));

    return gulp.src('src/images/*')
    .pipe(imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant()]
    }))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', function() {
    return gulp.src([
        'src/assets/fonts/fontawesome-webfont.*'])
        .pipe(gulp.dest('dist/fonts/'));
});

gulp.task('jsmin', function() {

    gulp.src('./src/assets/js/*.js')
    //.pipe(uglify())
    .pipe(gulp.dest('./dist/js'));

    return gulp.src('./src/assets/vendor/*.js')
    .pipe(order([
        'jquery*.js',
        'socket.io*.js',
        'adapter.js',
        '*.js'
    ]))
    .pipe(concat("vendor-all.js"))
    //.pipe(uglify())
    .pipe(rename('vendor-bundle.js'))
    .pipe(gulp.dest('./dist/js'));
});

gulp.task('cssmin', function() {
    return gulp.src('./src/assets/css/*.css')
    .pipe(order([
        'ie8.css',
        'ie9.css',
        'noscript.css',
        'font-awesome.min.css',
        'bootstrap.css',
        'bootstrap-theme.css',
        'bootstrap-select.css',
        'bootstrap-slider.css',
        'main.css'
    ]))
    .pipe(concat('all-styles.css'))
    //.pipe(cssnano())
    .pipe(rename('bundle.css'))
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('htmlmin', function() {
    return gulp.src('src/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('./dist'))
});

gulp.task('watch', function() {
  gulp.watch('src/**/*', ['build']);
});

gulp.task("build", ['jsmin', 'cssmin', 'htmlmin', 'images', 'fonts']);

gulp.task("default", [ 'watch']);
