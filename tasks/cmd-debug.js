/**
 * User: garcia.wul (garcia.wul@alibaba-inc.com)
 * Date: 2014/08/23
 * Time: 20:20
 *
 */

var fs = require('graceful-fs');
var path = require("path");
var util = require("util");

var _ = require("underscore");
var StringUtils = require("underscore.string");
var Concat = require("./plugins/concat");
var Debug = require("./plugins/debug");

module.exports = function(grunt, done) {
    grunt.registerMultiTask("cmd_debug", "create cmd debug files", function() {
        var self = this;
        var async = self.async();
        var options = self.options({
            postfix: "-debug"
        });
        var debug = new Debug(options);
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
            grunt.log.writeln("creating debug file: " + inputFile.src.toString().cyan);
            debug.execute(inputFile).then(function() {
                statistics.success += 1;
            }).fail(function() {
                statistics.fail += 1;
            }).finally(function() {
                ++ counter;
                size -= 1;
                if (size <= 0) {
                    async();
                    grunt.log.writeln("created " + counter.toString().cyan + " debug files");
                    if (_.isFunction(done)) {
                        done(statistics);
                    }
                }
            });
        });
    });
};