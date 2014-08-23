/**
 * User: garcia.wul (garcia.wul@alibaba-inc.com)
 * Date: 2014/05/24
 * Time: 11:21
 *
 */

var fs = require('graceful-fs');
var path = require("path");
var util = require("util");

var _ = require("underscore");
var StringUtils = require("underscore.string");
var Handlebars = require("handlebars");

var Base = require("./base");

var amdTemplate = Handlebars.compile([
    'define("{{{id}}}", [], function(require, exports, module) {',
    "   module.exports = '{{{code}}}';",
    '});'
].join(""));

var Text = function(options) {
    var self = this;
    Base.call(self, options);
};
util.inherits(Text, Base);

Text.prototype.execute = function(inputFile) {
    var self = this;
    var source = path.normalize(fs.realpathSync(inputFile.src));
    if (!fs.existsSync(source)) {
        self.logger.error("%s does not exist", source);
        return;
    }

    // Step 1: 读取文件
    var content = fs.readFileSync(source, "utf-8");
    content = content.split(/\r\n|\r|\n/).map(function(line) {
        return line.replace(/\\/g, '\\\\');
    }).join('\\\n').replace(/\'/g, '\\\'');

    // Step 2: 先分析得到文件的id
    var id = StringUtils.lstrip(StringUtils.lstrip(self.toUnixPath(source),
        {source: self.options.rootPath}), {source: "/"}
    );
    if (_.isFunction(self.options.idRule)) {
        id = self.options.idRule.call(self, id, source);
    }

     // Step 3: 得到AMD格式的代码
    var code = amdTemplate({
        id: id,
        code: content
    });

    code = self.beautify(code, "js");
    self.dumpFile(inputFile.dest, code);
    return true;
};

module.exports = Text;