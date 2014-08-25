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
var Debug = require("./plugins/debug");
var Handlebars = require("handlebars");
var verboseTemplate = Handlebars.compile(
    "create debug: {{{src}}} -> {{{dest}}}"
);
var shutils = require("shutils");
var filesystem = shutils.filesystem;

var dumpFile = function(filename, content) {
    var dirName = path.dirname(filename);
    if (!fs.existsSync(filename)) {
        filesystem.makedirsSync(dirName);
    }
    fs.writeFileSync(filename, content, "utf-8");
};

module.exports = function(grunt, done) {
    grunt.registerMultiTask("cmd_debug", "create cmd debug files", function() {
        var self = this;
        var async = self.async();
        var options = self.options({
            postfix: "-debug"
        });
        var debug = new Debug(options);
        var counter = 0;
        var statistics = {
            success: 0,
            fail: 0
        };
        var files = _.filter(self.files, function(file) {
            if (_.isArray(file.src) && file.src.length > 0 && fs.existsSync(file.src[0])) {
                return true;
            }
            else if (_.isString(file.src) && fs.existsSync(file.src)) {
                return true;
            }
            return false;
        });
        files = _.map(files, function(file) {
            if (_.isArray(file.src)) {
                return {
                    src: path.normalize(fs.realpathSync(file.src[0])),
                    dest: file.dest,
                    content: fs.readFileSync(file.src[0], "utf-8")
                }
            }
            else {
                return {
                    src: path.normalize(fs.realpathSync(file.src)),
                    dest: file.dest,
                    content: fs.readFileSync(file.src[0], "utf-8")
                }
            }
        });
        var size = files.length;
        _.each(files, function(inputFile) {
            grunt.log.writeln(verboseTemplate({
                src: inputFile.src.toString().cyan,
                dest: inputFile.dest.toString().cyan
            }));
            debug.execute(inputFile).then(function(code) {
                statistics.success += 1;
                dumpFile(inputFile.dest, code);
            }).fail(function() {
                statistics.fail += 1;
                dumpFile(inputFile.dest, inputFile.content);
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