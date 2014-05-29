define("alinw/bpms/0.0.1/test/t1.handlebars", ["alinw/handlebars/1.3.0/handlebars"], function(require, exports, module) {
    var Handlebars = require("alinw/handlebars/1.3.0/handlebars");
    var template = Handlebars.template;
    module.exports = template(function(Handlebars, depth0, helpers, partials, data) {
        this.compilerInfo = [4, '>= 1.0.0'];
        helpers = this.merge(helpers, Handlebars.helpers);
        data = data || {};
        var buffer = "",
            stack1, functionType = "function",
            escapeExpression = this.escapeExpression,
            self = this;

        function program1(depth0, data) {

            var buffer = "",
                stack1, helper;
            buffer += "\n        <span>";
            if (helper = helpers.name) {
                stack1 = helper.call(depth0, {
                    hash: {},
                    data: data
                });
            } else {
                helper = (depth0 && depth0.name);
                stack1 = typeof helper === functionType ? helper.call(depth0, {
                    hash: {},
                    data: data
                }) : helper;
            }
            buffer += escapeExpression(stack1) + "</span>\n    ";
            return buffer;
        }

        buffer += "\n\n\n\n\n\n<div>\n    ";
        stack1 = helpers['if'].call(depth0, (depth0 && depth0.name), {
            hash: {},
            inverse: self.noop,
            fn: self.program(1, program1, data),
            data: data
        });
        if (stack1 || stack1 === 0) {
            buffer += stack1;
        }
        buffer += "\n</div>";
        return buffer;
    });
});