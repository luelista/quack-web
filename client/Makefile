jssrc = bower_components/angular/angular.js \
		bower_components/angular-aria/angular-aria.js \
		bower_components/angular-animate/angular-animate.js \
		bower_components/angular-material/angular-material.js \
		bower_components/angular-route/angular-route.js \
		bower_components/angular-ui-sortable/sortable.js \
		stanzaio.bundle.js

UGLIFY = uglifyjs

all: vendor.js vendor.min.js


vendor.min.js: $(jssrc)
	$(UGLIFY) -o $@ $^
vendor.js: $(jssrc)
	cat $^ > $@
