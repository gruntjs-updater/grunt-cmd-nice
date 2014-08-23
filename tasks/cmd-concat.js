/**
 * User: garcia.wul (garcia.wul@alibaba-inc.com)
 * Date: 2014/05/26
 * Time: 16:16
 *
 */

var fs = require('graceful-fs');
var path = require("path");
var util = require("util");

var _ = require("underscore");
var StringUtils = require("underscore.string");
var Concat = require("./plugins/concat");

module.exports = function(grunt, done) {
    grunt.registerMultiTask("cmd_concat", "concat cmd files", function() {
        var self = this;
        var async = self.async();
        var options = self.options({
            separator: ";",
            useCache: false,
            paths: []
        });
        var concat = new Concat(options);
        var counter = 0;
        var size = self.files.length;
        var statistics = {
            success: 0,
            fail: 0
        };
        _.each(self.files, function(file) {
            var inputFile = {
                src: null,
                dest: file.dest
            };
            if (_.isArray(file.src) && file.src.length > 0) {
                inputFile.src = file.src[0];
            }
            else if (_.isString(file.src)) {
                inputFile.src = file.src;
            }
            else {
                grunt.log.error("Can not recognise src ...");
                -- size;
            }
            grunt.log.writeln("concat: " + inputFile.src.toString().cyan);
            concat.execute(inputFile).then(function() {
                statistics.success += 1;
            }).fail(function() {
                statistics.fail += 1;
            }).finally(function() {
                ++ counter;
                size -= 1;
                if (size <= 0) {
                    async();
                    grunt.log.writeln("concat " + counter.toString().cyan + " files");
                    if (_.isFunction(done)) {
                        done(statistics);
                    }
                }
            });
        });
    });
};