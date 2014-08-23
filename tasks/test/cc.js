/**
 * User: garcia.wul (garcia.wul@alibaba-inc.com)
 * Date: 2014/08/23
 * Time: 14:45
 *
 */

var path = require("path");
var _ = require("underscore");
var StringUtils = require("underscore.string");
var Handlebars = require("handlebars");
var idNameTemplate = Handlebars.compile("{{{family}}}/{{{name}}}/{{{version}}}/{{{id}}}");

var Script = require("../plugins/script");

var config = {
    debug: false,
    logLevel: "debug",
    rootPath: "/Users/wul/zone/evaluation/src",
    paths: [
        "/Users/wul/zone/evaluation/src"
    ],
    alias: {
        "seajs-debug": "seajs/seajs-debug/1.1.1/seajs-debug",
        "$": "jquery/jquery/1.10.1/jquery",
        "jquery": "jquery/jquery/1.10.1/jquery",
        "handlebars": "gallery/handlebars/1.0.2/handlebars",
        "select": "alinw/select/2.0.0/select",
        "pagination": "alinw/pagination/2.0.3/pagination",
        "confirmbox": "alinw/confirmbox/1.0.2/confirmbox",
        "dialog": "alinw/dialog/2.0.0/dialog",
        "tip": "arale/tip/1.2.1/tip",
        "popup": "arale/popup/1.1.6/popup",
        "autosearch": "alinw/autosearch/1.0.9/autosearch",
        "dropdown": "alinw/dropdown/1.0.1/dropdown",
        "crystal": "alinw/crystal/1.0.1/crystal",
        "network": "alinw/network/1.1.0/network",
        "validator": "alinw/validator/2.0.0/validator",
        "widget": "arale/widget/1.1.1/widget",
        "selectperson": "alinw/selectperson/1.0.6/selectperson",
        "calendar": "alinw/calendar/1.0.8/calendar",
        "buclogindlg": "alinw/buclogindlg/1.0.4/buclogindlg",
        "condition-helpers": "alinw/handlebars-helpers/1.0.1/condition-helpers",
        "moment-helpers": "alinw/handlebars-helpers/1.0.1/moment-helpers",
        "autocomplete": "arale/autocomplete/1.3.0/autocomplete",
        "placeholder": "alinw/placeholder/3.0.2/placeholder"
    },
    aliasPaths: {
        testPath: "test"
    },
    handlebars: {
        id: "alinw/handlebars/1.3.0/handlebars",
        knownHelpers: [
            "if", "unless", "each"
        ]
    },
    idRule: function(id) {
        return idNameTemplate({
            family: "alinw",
            name: "bpms",
            version: "0.0.1",
            id: id
        })
    }
};

var script = new Script(config);
script.execute({
    src: "/Users/wul/zone/evaluation/src/p/people_receive_evaluate/index.js",
    dest: "/Users/wul/Downloads/index.js"
});

var Concat = require("../plugins/concat");
var concat = new Concat({
    paths: [
        "/Users/wul/zone/evaluation/dist"
    ],
    idExtractor: function(id) {
        var pattern = new RegExp("^alinw/bpms/0.0.1/(.*?)$");
        if (pattern.test(id)) {
            return pattern.exec(id)[1];
        }
        else {
            return id;
        }
    }
});
concat.execute({
    src: "/Users/wul/Downloads/index.js",
    dest: "/Users/wul/Downloads/index-min.js"
});