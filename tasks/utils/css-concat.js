/**
 * User: garcia.wul (garcia.wul@alibaba-inc.com)
 * Date: 2014/05/27
 * Time: 17:04
 *
 */

var fs = require("fs");
var path = require("path");

var _ = require("underscore");
var StringUtils = require("underscore.string");
var cssParse = require('css-parse');
var stringify = require('css-stringify');

var CssConcat = function(options) {
    var self = this;
    self.options = {
        paths: []
    };
    if (_.isObject(options)) {
        self.options = _.extend(self.options, options);
    }
};

CssConcat.prototype.concat = function(source, file) {
    var self = this;
    var parsed = cssParse(source);
    if (_.isObject(parsed) && _.isObject(parsed.stylesheet) &&
        _.isArray(parsed.stylesheet.rules)) {
        parsed.stylesheet.rules = self.parseImports(parsed.stylesheet.rules, file);
    }
    return stringify(parsed);
};

CssConcat.prototype.parseImports = function(rules, file) {
    var self = this;
    var results = [];
    _.each(rules, function(rule) {
        if (rule.type !== "import") {
            results.push(rule);
            return;
        }
        var url = rule.import;
        url = StringUtils.strip(url, {source: '"'});
        url = StringUtils.strip(url, {source: "'"});
        url = StringUtils.strip(url, {source: '"'});
        var newFile = null;
        if (url.indexOf("../") === 0 || url.indexOf("./") === 0) {
            newFile = self.findFileBySelf(url, file);
        }
        if (!newFile) {
            newFile = self.findFileByPaths(url);
        }
        if (!newFile || !fs.existsSync(newFile)) {
            results.push(rule);
            return;
        }
        var content = fs.readFileSync(newFile, "utf-8");
        var parsed = cssParse(content);
        if (_.isObject(parsed) && _.isObject(parsed.stylesheet) &&
            _.isArray(parsed.stylesheet.rules)) {
            _.each(self.parseImports(parsed.stylesheet.rules, path.normalize(newFile)), function(result) {
                results.push(result);
            });
        }
        else {
            results.push(rule);
        }
    });
    return results;
};

CssConcat.prototype.findFileBySelf = function(url, file) {
    var dirName = path.dirname(file);
    var newFile = path.join(dirName, url);
    if (!fs.existsSync(newFile)) {
        return newFile;
    }
    return null;
};

CssConcat.prototype.findFileByPaths = function(url) {
    var self = this;
    var newFile = null;
    _.each(self.options.paths, function(p) {
        var tmp = path.join(p, url);
        if (newFile) {
            return;
        }
        if (fs.existsSync(tmp)) {
            newFile = tmp;
        }
    });
    return newFile;
};

module.exports = CssConcat;


