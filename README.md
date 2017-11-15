# Rainbow-Hub-Sheets-Generation
The Alcatel-Lucent Enterprise (ALE) Rainbow Hub sheets generation is a tool for generating documentation

This project use [mermaid](https://github.com/knsv/mermaid) and a custom JsDoc to generate class diagram from documentation
## Installation

  * Clone this repo manually into your project.
 
  * Use this repo as a [Git submodules](https://git-scm.com/docs/git-submodule).

## Usage

1. Install package  
```npm install```

2. Generate Mermaid file with the custom JsDoc template  
```jsdoc path/to/file -t mermaidtemplate```

3. Include Mermaid script in your html page  
```<script src="./mermaid.js"></script>```

4. Write the JsDoc output into a div with class "mermaid"  
```html
<div class="mermaid">
Jsdoc output goes here
...
...
</div>
```

5. Initialize mermaid  
```html
<script>
    mermaid.initialize({startOnLoad: true, theme: 'grey'});
</script>
```

## Mermaid

This version of mermaid is modified to include :

  * Cardinality and event in class diagram
  * New theme