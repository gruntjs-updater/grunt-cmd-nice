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
var CmdNice = require("cmd-nice");
var Concat = CmdNice.Concat;
var Handlebars = require("handlebars");
var verboseTemplate = Handlebars.compile(
    "concat: {{{src}}} -> {{{dest}}}"
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
    grunt.registerMultiTask("cmd_concat", "concat cmd files", function() {
        var self = this;
        var async = self.async();
        var options = self.options({
            separator: ";",
            useCache: true,
            paths: [],
            transportConfig: require("./transport-config")
        });
        var concat = new Concat(options);
        var counter = 0;
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
            concat.execute(inputFile).then(function(code) {
                dumpFile(inputFile.dest, code);
            }).fail(function(error) {
                if (_.isString(error.level)) {
                    grunt.log[error.level](error.message);
                }
                else {
                    grunt.log.error(error.message);
                }
                dumpFile(inputFile.dest, inputFile.content);
            }).finally(function() {
                ++ counter;
                size -= 1;
                if (size <= 0) {
                    async();
                    grunt.log.writeln("concat " + counter.toString().cyan + " files");
                }
            });
        });
    });
};