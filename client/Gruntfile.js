module.exports = function(grunt) {

  grunt.initConfig({
    uglify: {
      vendor: {
        files: {
          'vendor.min.js': [
            "bower_components/angular/angular.js",
            "bower_components/angular-aria/angular-aria.js",
            "bower_components/angular-animate/angular-animate.js",
            "bower_components/angular-material/angular-material.js",
            "bower_components/angular-route/angular-route.js",
            "bower_components/angular-ui-sortable/sortable.js",
            "stanzaio.bundle.js"
          ]
        }
      },
      options: {
        sourceMap: true
      }
    },
    concat: {
      vendor: {
        src: [
            "bower_components/angular/angular.js",
            "bower_components/angular-aria/angular-aria.js",
            "bower_components/angular-animate/angular-animate.js",
            "bower_components/angular-material/angular-material.js",
            "bower_components/angular-route/angular-route.js",
            "bower_components/angular-ui-sortable/sortable.js",
            "stanzaio.bundle.js"
          ],
        dest: 'vendor.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['uglify', 'concat']);

};
