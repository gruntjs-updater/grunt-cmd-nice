/**
 * User: garcia.wul (garcia.wul@alibaba-inc.com)
 * Date: 2014/05/22
 * Time: 14:01
 *
 */

var path = require("path");
var _ = require("underscore");
var StringUtils = require("underscore.string");
var Handlebars = require("handlebars");
var idNameTemplate = Handlebars.compile("{{{family}}}/{{{name}}}/{{{version}}}/{{{filename}}}");

var Script = require("../plugins/script");

var config = {
    debug: true,
    rootPath: path.normalize(path.join(__dirname, "..")),
    paths: [
        path.normalize(path.join(__dirname, ".."))
    ],
    alias: {
        $: "alinw/jquery/1.8.3/jquery",
        _: "gallery/underscore/1.6.0/underscore",
        "underscore.string": "alinw/underscore.string/0.0.1/underscore-string"
    },
    aliasPaths: {
        testPath: "test"
    },
    idRule: function(id, filePath) {
        var self = this;
        return idNameTemplate({
            family: "alinw",
            name: "bpms",
            version: "0.0.1",
            filename: StringUtils.rstrip(StringUtils.lstrip(
                StringUtils.lstrip(filePath, {source: self.options.rootPath}),
                {source: path.sep}
            ), {source: ".js"})
        })
    },
    handlebars: {
        id: "alinw/handlebars/1.3.0/handlebars",
        knownHelpers: [
            "if",
            "unless",
            "each"
        ]
    }
};

var script = new Script(config);
script.execute({
    src: path.join(__dirname, "a.js"),
    dest: path.join(__dirname, "a-test.js")
});

var Concat = require("../plugins/concat");
var concat = new Concat({
    paths: [
        __dirname
    ]
});
concat.execute({
    src: path.join(__dirname, "e.js"),
    dest: path.join(__dirname, "e-concat.js")
});

var Debug = require("../plugins/debug");
var debug = new Debug({});
debug.execute({
    src: path.join(__dirname, "e.js"),
    dest: path.join(__dirname, "e-debug.js")
});

var HandlebarsTemplate = require("../plugins/handlebars-template");
var handlebarsTemplate = new HandlebarsTemplate(config);
handlebarsTemplate.execute({
    src: path.join(__dirname, "t1.handlebars"),
    dest: path.join(__dirname, "t1.handlebars.js")
});

var UnderscoreTemplate = require("../plugins/underscore-template");
var underscoreTemplate = new UnderscoreTemplate(config);
underscoreTemplate.execute({
    src: path.join(__dirname, "t2.tpl"),
    dest: path.join(__dirname, "t2.tpl.js")
});

var Style = require("../plugins/style");
var style = new Style(config);
style.execute({
    src: path.join(__dirname, "t2.css"),
    dest: path.join(__dirname, "t2.css.js")
});

var LessStyle = require("../plugins/less-style");
var lessStyle = new LessStyle(config);
lessStyle.execute({
    src: path.join(__dirname, "t3.less"),
    dest: path.join(__dirname, "t3.less.js")
});

var Json = require("../plugins/json");
var json = new Json(config);
json.execute({
    src: path.join(__dirname, "t4.json"),
    dest: path.join(__dirname, "t4.json.js")
});

var SassStyle = require("../plugins/sass-style");
var sassStyle = new SassStyle(config);
sassStyle.execute({
    src: path.join(__dirname, "t5.scss"),
    dest: path.join(__dirname, "t5.scss.js")
});

var Text = require("../plugins/text");
var text = new Text(concat);
text.execute({
    src: path.join(__dirname, "t6.html"),
    dest: path.join(__dirname, "t6.html.js")
});