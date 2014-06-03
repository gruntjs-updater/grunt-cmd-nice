/**
 * User: garcia.wul (garcia.wul@alibaba-inc.com)
 * Date: 2014/05/26
 * Time: 16:16
 *
 */

var fs = require("fs");
var path = require("path");
var util = require("util");

var _ = require("underscore");
var StringUtils = require("underscore.string");
var Concat = require("./plugins/concat");

module.exports = function(grunt) {
    grunt.registerMultiTask("cmd_concat", "concat cmd files", function() {
        var self = this;
        var options = self.options({
            separator: ";",
            useCache: false,
            paths: [],
            filters: false,
            include: "relative"
        });
        var concat = new Concat(options);
        var counter = 0;
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
                return;
            }
            concat.execute(inputFile);
            ++ counter;
        });
        grunt.log.writeln("concat " + counter.toString().cyan + " files");
    });
};