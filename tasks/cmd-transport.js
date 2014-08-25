/*
 * grunt-cmd-nice
 * https://github.com/magicsky/grunt-cmd-nice
 *
 * Copyright (c) 2014 吴亮
 * Licensed under the MIT license.
 */

var fs = require('graceful-fs');
var path = require("path");
var util = require("util");

var _ = require("underscore");
var StringUtils = require("underscore.string");

var HandlebarsTemplate = require("./plugins/handlebars-template");
var Json = require("./plugins/json");
var LessStyle = require("./plugins/less-style");
var SassStyle = require("./plugins/sass-style");
var Script = require("./plugins/script");
var Style = require("./plugins/style");
var Text = require("./plugins/text");
var UnderscoreTemplate = require("./plugins/underscore-template");
var Handlebars = require("handlebars");
var verboseTemplate = Handlebars.compile(
    "transporting: {{{src}}} -> {{{dest}}}"
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

module.exports = function (grunt, done) {
    grunt.registerMultiTask('cmd_transport', 'transport cmd', function () {
        var self = this;
        var async = self.async();
        var options = this.options({
            useCache: false,
            rootPath: process.cwd(),
            paths: [],
            alias: {},
            aliasPaths: {},
            parsers: {
                ".handlebars": HandlebarsTemplate,
                ".json": Json,
                ".less": LessStyle,
                ".scss": SassStyle,
                ".js": Script,
                ".css": Style,
                ".html": Text,
                ".tpl": UnderscoreTemplate
            },
            handlebars: {
                id: 'alinw/handlebars/1.3.0/runtime',
                knownHelpers: [
                    "if",
                    "unless",
                    "each"
                ],
                knownHelpersOnly: false
            },
            sassOptions: {},
            lessOptions: {},
            cssOptions: {}
        });

        var parsers = {};

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
            var extName = path.extname(inputFile.src);
            if (!_.has(options.parsers, extName)) {
                grunt.log.warn("Can not find any parsers: " + inputFile.src);
                grunt.file.copy(inputFile.src, inputFile.dest);
                size -= 1;
                return;
            }

            var Parser = options.parsers[extName];
            var parser = null;
            if (_.has(parsers, extName)) {
                parser = parsers[extName];
            }
            else {
                parser = new Parser(options);
                parsers[extName] = parser;
            }
            grunt.log.writeln(verboseTemplate({
                src: inputFile.src.toString().cyan,
                dest: inputFile.dest.toString().cyan
            }));
            parser.execute(inputFile).then(function(code) {
                statistics.success += 1;
                dumpFile(inputFile.dest, code);
            }).fail(function(error) {
                statistics.fail += 1;
                if (_.isObject(error) && _.isString(error.message)) {
                    if (_.isString(error.level)) {
                        grunt.log[error.level](error.message);
                    }
                    else {
                        grunt.log.error(error.message);
                    }
                }
                dumpFile(inputFile.dest, inputFile.content);
            }).finally(function() {
                counter += 1;
                size -= 1;
                if (size <= 0) {
                    async();
                    grunt.log.writeln("transport " + counter.toString().cyan + " files");
                    if (_.isFunction(done)) {
                        done(statistics);
                    }
                }
            });
        });

    });
};
