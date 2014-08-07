/*
 * grunt-cmd-nice
 * https://github.com/magicsky/grunt-cmd-nice
 *
 * Copyright (c) 2014 吴亮
 * Licensed under the MIT license.
 */

var fs = require("fs");
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

var Debug = require("./plugins/debug");

module.exports = function (grunt, done) {
    grunt.registerMultiTask('cmd_transport', 'transport cmd', function () {
        var self = this;
        var options = this.options({
            debug: false,
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
            debugOptions: {
                postfix: "-debug"
            },
            sassOptions: {},
            lessOptions: {},
            cssOptions: {}
        });

        var parsers = {};

        var counter = 0;
        var statistics = {
            transport: {
            },
            debug: {}
        };
        _.each(options.parsers, function(value, key) {
            statistics.transport[key] = {
                success: 0,
                fail: 0
            };
            statistics.debug[key] = {
                success: 0,
                fail: 0
            };
        });

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
            var extName = path.extname(inputFile.src);
            if (!_.has(options.parsers, extName)) {
                grunt.log.warn("Can not find any parsers: " + inputFile.src);
                grunt.file.copy(inputFile.src, inputFile.dest);
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
            grunt.log.writeln("transporting: " + inputFile.src.toString().cyan);
            if (parser.execute(inputFile) === true) {
                statistics.transport[extName].success += 1;
            }
            else {
                statistics.transport[extName].fail += 1;
            }

            if (options.debug) {
                var debug = new Debug(options.debugOptions);

                var result = debug.execute({
                    src: inputFile.dest,
                    dest: inputFile.dest.replace(
                        new RegExp(extName === ".js" ? ".js$" : (extName + ".js$")),
                        options.debugOptions.postfix + (extName === ".js" ? "" : extName) + ".js")
                });
                if (result) {
                    statistics.debug[extName].success += 1;
                }
                else {
                    statistics.debug[extName].fail += 1;
                }
            }

            ++ counter;
        });
        grunt.log.writeln("transport " + counter.toString().cyan + " files");
        if (_.isFunction(done)) {
            done(statistics);
        }
    });
};
