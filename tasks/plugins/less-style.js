/**
 * User: garcia.wul (garcia.wul@alibaba-inc.com)
 * Date: 2014/05/23
 * Time: 14:30
 * 将less文件转换成css内容，并且transport
 */

var fs = require('graceful-fs');
var path = require("path");
var util = require("util");

var _ = require("underscore");
var StringUtils = require("underscore.string");
var Handlebars = require("handlebars");
var less = require("less");
var CleanCSS = require("clean-css");
var cleanCss = new CleanCSS({
    keepSpecialComments: 0
});
var Q = require("q");
var through = require("through");

var Base = require("./base");
var CssConcat = require("../utils/css-concat");

var amdTemplate = Handlebars.compile([
    'define("{{{id}}}", [], function(require, exports, module) {',
    "   seajs.importStyle('{{{code}}}')",
    '});'
].join(""));

/**
 * 构造函数
 * @param options
 * * lessOptions: less编译的参数, 具体参考: http://lesscss.org/#using-less-usage-in-code
 * * cssOptions: css合并的参数,是一个对象，目前就需要配置一个paths参数
 * @constructor
 */
var LessStyle = function(options) {
    var self = this;
    Base.call(self, options);
    self.lessParser = new(less.Parser)(options.lessOptions || {});
    self.cssConcat = new CssConcat(options.cssOptions || {});
};
util.inherits(LessStyle, Base);

LessStyle.prototype.execute = function(inputFile) {
    var self = this;
    var deferred = Q.defer();
    var source = path.normalize(fs.realpathSync(inputFile.src));
    if (!fs.existsSync(source)) {
        self.logger.error("%s does not exist", source);
        process.nextTick(function() {
            deferred.reject();
        });
        return deferred.promise;
    }

    var content = fs.readFileSync(source, "utf-8");
    var id = StringUtils.lstrip(StringUtils.lstrip(self.toUnixPath(source),
        {source: self.options.rootPath}), {source: "/"}
    );
    if (_.isFunction(self.options.idRule)) {
        id = self.options.idRule.call(self, id);
    }

    // Step 3: 从Less中编译出CSS
    self.lessParser.parse(content, function(e, result) {
        if (e) {
            self.logger.error("parse %s error: %s", source, e);
            deferred.reject();
            return;
        }
        var compiled = result.toCSS({
            compress: false
        });
        // Step 4: 压缩得到的CSS
        compiled = self.cssConcat.concat(compiled, source);
        compiled = cleanCss.minify(compiled);
        compiled = _.map(compiled.split(/\r\n|\r|\n/), function(line) {
            return line.replace(/\\/g, '\\\\');
        }).join("\n").replace(/\'/g, '\\\'');

        // Step 5: 得到AMD格式的代码
        var code = amdTemplate({
            id: id,
            code: compiled
        });
        code = self.beautify(code, "js");
        self.dumpFile(inputFile.dest, code);
        deferred.resolve();
    });

    return deferred.promise;
};
module.exports = LessStyle;