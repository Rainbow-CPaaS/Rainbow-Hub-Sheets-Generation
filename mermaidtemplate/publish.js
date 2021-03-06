/** @module publish */

"use strict";

var fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");
var config = require("./config");
/**
 * Generate documentation output.
 *
 * @param {TAFFY} data - A TaffyDB collection representing
 *                       all the symbols documented in your code.
 * @param {object} opts - An object with options information.
 */
exports.publish = function(data, opts) {
    data({undocumented: true}).remove();
    data({kind: "package"}).remove();


    var docs = data().get();

    /**
     * Function that remove space and special char in string
     * @param {string} text
     * @return {string}
     */
    var cleanName = function(text){
        return (text || '').trim().replace(/(\#|\/|\~|\-|\:)/g, '.');        
    };

    /**
     * Function that transform ArrayType from Jsdoc (ArrayType<Object>) to mermaid ArrayType (Object[])
     * @param {*} text
     * @return {string}
     */
    var cleanArrayType = function(text) {
        return text.match(/Array.<([^>]+)>/)[1] + "[]";
    };

    /**
     * Function that transform Promise Object from Jsdoc (Promise.<Object>) to mermaid PromiseType (Promise.Object)
     * @param {*} text
     * @return {string}
     */
    var cleanPromiseType = function(text) {

        if(text.indexOf("Array.") > 0) {
            var arrayType = cleanArrayType(text);
            return "Promise." + arrayType;
        }

        var regex = new RegExp("<|>", "g");
        return text.replace(regex, "");
    }

    /**
     * Function that append class to mermaid file 
     * @param {string} name 
     */
    var manageClass = function(name) {
        fs.appendFileSync(config.output + "diagram", "\nclass " + name);
        classData.push(name);
    };

    /**
     * Function that append enum and value to mermaid file
     * @param {string} name
     * @param {string} memberof
     * @param {string} values
     */
    var manageEnum = function(name, memberof, values) {
        values = values.substring(1, values.length -1).toLowerCase();
        values = values.split(/[,:](?=[^0-9])/)
        values = values.filter(function(elem, index, self) {
            return index == self.indexOf(elem);
        });
        
        fs.appendFileSync(config.output + "diagram", "\nclass " + name + " enum");
        manageRelation(memberof, name, "-->")

        values.forEach(function(value) {
            value = value.substring(1, value.length - 1);
            fs.appendFileSync(config.output + "diagram", "\n" + name + " : " + value);
        })
    };


    /**
     * function that append attribute to mermaid file
     * @param {string} className 
     * @param {string} attribute 
     * @param {string} type
     */
    var manageAttribute = function(className, attribute, type) {
        fs.appendFileSync(config.output + "diagram", "\n" + className + " : " + type + " : " + attribute);
    };

    /**
     * Function that append method to mermaid file
     * @param {string} className 
     * @param {string} returnType 
     * @param {string} name 
     * @param {string} params 
     */
    var manageFunction = function(className, returnType, name, params) {
        fs.appendFileSync(config.output + "diagram", "\n" + className + " : " + returnType + " : " + name + "(" + params + ")");
    }

    var manageEvent = function(className, name) {
        fs.appendFileSync(config.output + "diagram", "\n" + className + " ::event : " + name); 
    }
    /**
     * Function that append relation to mermaid file
     * @param {string} class1 
     * @param {string} class2 
     * @param {string} relationType 
     */
    var manageRelation = function(class1, class2, relationType) {
        fs.appendFileSync(config.output + "diagram", "\n" + class1 + " " + relationType + " " + class2);
    };
    
    if(!fs.existsSync(config.output)) {
        mkdirp.sync(config.output);
    }
    
    fs.writeFileSync(config.output + "diagram", "<!--START-->\nclassDiagram");

    var classData = [];
    var relationData = [];

    // First we are looking for class declaration
    var i = docs.length;
    while(i--) {
        if(docs[i].kind === "class" || docs[i].kind === "module") {
            var name = cleanName(docs[i].longname).split(".").pop();
            docs.splice(i, 1);
            manageClass(name);
        }
    }

    // Second we are looking for enumeration declaration
    i = docs.length;
    while(i--) {
        var name = cleanName(docs[i].longname).split(".").pop();
        var memberof = cleanName(docs[i].memberof);

        if(docs[i].isEnum) {

            if(config.visibility === "private" && docs[i].access !== "private" && docs[i].access !== undefined) { // presume that undefined = private
                continue;
            }

            if(config.visibility === "public" && docs[i].access !== "public") {
                continue;
            }


            if(config.enum && docs[i].meta && docs[i].meta.code && docs[i].meta.code.value) {
                manageEnum(name, memberof, docs[i].meta.code.value);
                docs.splice(i, 1);
            }
        }
    }

    // Third we are looking for attribute declaration
    var j = 0;
    docs.forEach(function(doc, index, object) {
          
        var path = cleanName(doc.longname);
        var memberof = cleanName(doc.memberof).split(".");
        memberof = memberof[memberof.length - 1];
        var name = path.split('.').pop();

        if(!classData.includes(memberof)) {
            return;
        }

        if(config.visibility === "private" && doc.access !== "private" && doc.access !== undefined) { // presume that undefined = private
            return;
        }

        if(config.visibility === "public" && doc.access !== "public") {
            return;
        }
        
        switch (doc.kind) {
            case "member":

                var type = "undefined";
                var card;

                if(doc && doc.properties && doc.properties[0] && doc.properties[0].type && doc.properties[0].type.names) { // check if type exist
                    if(doc.properties[0].type.names[0].indexOf("Array.") === 0) {
                        type = cleanArrayType(doc.properties[0].type.names[0]);
                        card = "*";
                    }
                    else if(doc.properties[0].type.names[0].indexOf("Promise.") === 0) {
                        returnType = cleanPromiseType(doc.properties[0].type.names[0]);
                    }
                    else {
                        type = cleanName(doc.properties[0].type.names[0]);
                        card = "1";
                    }

                    //type = type.replace(/\[\]/, "");

                    if(classData.includes(type)) {
                        manageRelation(memberof, type, "[1] --> [" + card + "]");
                    }
                }

                if(doc.type && doc.type.names && doc.type.names[0]) {
                    type = doc.type.names[0];
                }

                if(config.allowUndefinedType === false && type === "undefined") {
                    return;
                }

                manageAttribute(memberof, name, type);

                break;

            case "function":

                var returnType = "void";
                if(doc.returns && doc.returns[0] && doc.returns[0].type && doc.returns[0].type.names) { // check if return type exist

                    var returnType = doc.returns[0].type.names[0];
                    
                    if(doc.returns[0].type.names[0].indexOf("Array.") === 0) {
                        returnType = cleanArrayType(doc.returns[0].type.names[0]);
                    }
                    else if(doc.returns[0].type.names[0].indexOf("Promise.") === 0) {
                        returnType = cleanPromiseType(doc.returns[0].type.names[0]);                        
                    }
                    else {
                        returnType = cleanName(doc.returns[0].type.names[0]);
                    }

                }

                var params = "";
                if(doc.params) {
                    doc.params.forEach(function(param) {
                        var type = "";
                        if(param.type && param.type.names){
                            type = param.type.names[0];

                            if(type.indexOf("Array.") !== -1) {
                                type = cleanArrayType(type);
                            }
                            params += type;
                        }

                        if(config.printParametersName && param.name) {
                            params += " " + param.name;
                        }

                        params += ", ";
                        
                    }, this);

                    params = params.substring(0, params.length -2);
                }

                manageFunction(memberof, returnType, name, params);

                break;
            
            case "event":
                manageEvent(memberof, name);
                break;

            default:
                return;
        }
    }, this);

    fs.appendFileSync(config.output + "diagram", "\n<!--END-->");
};