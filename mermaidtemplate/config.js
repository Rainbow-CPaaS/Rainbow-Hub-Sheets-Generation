module.exports = {
    output: "./bin/jsdoc/sheets/", // Specify the path to the mermaid output file
    visibility: "public", // Can be "all", "private", "public"
    enum: false, // Parse and add enumeration to doc
    allowUndefinedType: false, // If type is undefined or null, attributes / functions are removed
    printParametersName: false, // If true print myFunction(type, type) instead of myFunction(type name, type name)
}