/*
This software allows execution of arbitrary JavaScript code.

The author is NOT responsible for:
- any damage caused
- malicious use
- security issues
- data loss

Use at your own risk.

By using this software, you agree that all responsibility lies with the user.
*/
(function() {
    const vm = Scratch.vm;
    const runtime = vm.runtime;

    let parentExtension = null;
    class JSeval {
        constructor() {
            parentExtension = this;
            this.functions = {};
            this.activations=null

            vm.runtime.on("PROJECT_LOADED", () => {
                this._setupExtensionStorage();
                this.loadFunctions();
            });
        }

        getInfo() {
            return {
                id: 'jseval',
                name: 'evaluate+',
                color1: "#aeaeae",
                blocks: [
                     {
                        opcode: 'JSevalBlock',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'evauluate [C]',
                        arguments: {
                            C: {
                                type: Scratch.ArgumentType.STRING
                            }
                        }
                    },
                    "---",
                    {
                        blockType: Scratch.BlockType.BUTTON,
                        func: "viewJS",
                        text: "JS functions",
                    },
                    "---",
                    {
                        opcode: 'getFunc',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'value of JS function [N]',
                        arguments: {
                            N: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "a"
                            }
                        }
                    },
                    {
                        opcode: 'runFunc',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'run JS function [N]',
                        arguments: {
                            N: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "a"
                            }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.EVENT,
                        opcode: 'funcActivation',
                        text: 'When activated by JS function',
                        isEdgeActivated: false, // required boilerplate
                    },
                    {
                        opcode: 'sectionLegacy',
                        blockType: Scratch.BlockType.LABEL,
                        text: 'legacy blocks'
                    },
                    {
                        opcode: 'newFunc',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'create new JS function [N]',
                        arguments: {
                            N: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "a"
                            }
                        }
                    },
                    {
                        opcode: 'delFunc',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'delete JS function [N]',
                        arguments: {
                            N: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "a"
                            }
                        }
                    },
                    {
                        opcode: 'funcAddLine',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'add line [V] to JS function [N]',
                        arguments: {
                            V: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "alert('hi')"
                            },
                            N: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "a"
                            }
                        }
                    },
                ],
                menus:{

                }
            };
        }

        //Stolen from ObviousAlex :3
        _setupExtensionStorage() {
            if (!runtime.extensionStorage) return;

            if (!runtime.extensionStorage["jseval"]) {
                console.log("creating empty functions dict");
                runtime.extensionStorage["jseval"] = {
                    functions: {}
                };
            }
        }
        loadFunctions() {
            if (!runtime.extensionStorage?.["jseval"]) return;
            console.log(runtime.extensionStorage["jseval"].functions);

            this.functions = runtime.extensionStorage["jseval"].functions || {};
        }

        saveFunctions() {
            if (!runtime.extensionStorage?.["jseval"]) {
                console.log("missing extension storage for some reason...hmmm");
                console.log("attempting to fix...");
                this._setupExtensionStorage();
            };
            console.log("saving...")
            runtime.extensionStorage["jseval"].functions = this.functions;
        }
        JSevalBlock(args){
            eval(args.C)
        }
        newFunc(args){
            this.functions[args.N] = this.functions[args.N] || ""
            this.saveFunctions();
        }
        delFunc(args){
            delete this.functions[args.N];
            this.saveFunctions();
        }
        listFuncs(){
            this.saveFunctions();
            return (Object.keys(this.functions))
        }

        funcAddLine(args){
            if (this.functions[args.N] !== undefined){
                this.functions[args.N] = `${this.functions[args.N]}${args.V};\n`;
            } else {
                console.warn("Function not defined:", args.N);
            }
            this.saveFunctions();
        }

        getFunc(args){
            return this.functions[args.N] || `no function named ${args.N} defined.`;
        }

        runFunc(args){
            this.saveFunctions();
            const triggerHat =  function() {//u can call this function inside ur custom JS scripts to make it active it. Essentially, JS scripts can talk back to scratch :3
                runtime.startHats('jseval_funcActivation');
            }
            eval(this.functions[args.N]);
            
        }


        //UI nonsense
initOverlay(){
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'white';
    overlay.style.boxShadow = '0 0 15px rgba(0,0,0,0.5)';
    overlay.style.zIndex = '10000';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems="center"
    overlay.style.border = '2px solid black';
    overlay.style.overflowY = 'auto';
    return overlay;
}
initButtonRow(headerText) {
    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.justifyContent = 'flex-start';
    buttonRow.style.alignItems='center';
    buttonRow.style.width = '90%';
    buttonRow.style.gap="10px";
    buttonRow.style.marginBottom = '10px';
    buttonRow.style.marginTop = '10px';
    const pgHeader = document.createElement('p');
    pgHeader.textContent=headerText;
    pgHeader.style.color="#000000"
    buttonRow.appendChild(pgHeader);
    return buttonRow;
}
async editContent(funcName){
    //document.body.removeChild(document.getElementById("listOfJSFilesAddedByJSEvalExtension"));
    const overlay=this.initOverlay()
    const buttonRow=this.initButtonRow(`Editing JS function \'${funcName}\'`)

    const closeButton = document.createElement('button');
    closeButton.innerText = 'Close';
    closeButton.style.padding = '5px 10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.backgroundColor = '#f44336';
    closeButton.style.color = 'white';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });

    const saveButton = document.createElement('button');
    saveButton.innerText = 'Save file';
    saveButton.style.padding = '5px 10px';
    saveButton.style.cursor = 'pointer';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '5px';
    saveButton.style.backgroundColor = '#009a27';
    saveButton.style.color = 'white';
    saveButton.addEventListener('click', () => {
        this.functions[funcName]=document.getElementById("newJSinputAreaForInlineJSScripts").value;
        this.saveFunctions();
        alert("function saved!")
    });
    buttonRow.appendChild(closeButton);
    buttonRow.appendChild(saveButton);
    overlay.appendChild(buttonRow);
    const textBox = document.createElement('textarea');
    textBox.style.width = '90%';
    textBox.style.height = '75%';
    textBox.style.margin = '10px 0';
    textBox.style.padding = '10px';
    textBox.style.border = '1px solid #7b7b7b';
    textBox.style.resize = 'none';
    textBox.style.background = "#d5d5d5"
    textBox.style.color="#393939"
    textBox.style.borderRadius = '5px';
    textBox.value = this.functions[funcName];
    textBox.id="newJSinputAreaForInlineJSScripts"//intentionally long name to prevent it from accidentally being targeted by the browser
    overlay.appendChild(textBox);
    document.body.appendChild(overlay);
}
async viewJS() {
    this.saveFunctions()
    const overlay=this.initOverlay()
    const buttonRow=this.initButtonRow("JS functions stored in project: ")
    const closeButton = document.createElement('button');
    closeButton.innerText = 'Close';
    closeButton.style.padding = '5px 10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.backgroundColor = '#f44336';
    closeButton.style.color = 'white';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    const newFuncButton = document.createElement('button');
    newFuncButton.innerText = 'New function';
    newFuncButton.style.padding = '5px 10px';
    newFuncButton.style.cursor = 'pointer';
    newFuncButton.style.border = 'none';
    newFuncButton.style.borderRadius = '5px';
    newFuncButton.style.backgroundColor = '#14c6e5';
    newFuncButton.style.color = 'white';
    newFuncButton.addEventListener('click', () => {
        const inputOverlay = document.createElement('div');
        inputOverlay.style.position = 'fixed';
        inputOverlay.style.top = '50%';
        inputOverlay.style.left = '50%';
        inputOverlay.style.transform = 'translate(-50%, -50%)';
        inputOverlay.style.background = 'white';
        inputOverlay.style.padding = '20px';
        inputOverlay.style.border = '2px solid black';
        inputOverlay.style.zIndex = '10001';
        inputOverlay.style.display = 'flex';
        inputOverlay.style.flexDirection = 'column';
        inputOverlay.style.gap = '10px';
        inputOverlay.style.borderRadius = "15px";

        const input = document.createElement('input');
        input.placeholder = "Function name";
        input.style.padding = '5px';

        const confirm = document.createElement('button');
        confirm.innerText = "Create";

        const cancel = document.createElement('button');
        cancel.innerText = "Cancel";

        confirm.onclick = () => {
            const name = input.value.trim();

            if (!name) return;

            if (this.functions[name] !== undefined) {
                alert("Function already exists!");
                return;
            }

            this.functions[name] = "";
            this.saveFunctions();

            document.body.removeChild(inputOverlay);

            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }

            this.viewJS();
        };

        cancel.onclick = () => {
            document.body.removeChild(inputOverlay);
        };

        inputOverlay.appendChild(input);
        inputOverlay.appendChild(confirm);
        inputOverlay.appendChild(cancel);

        document.body.appendChild(inputOverlay);

        input.focus();
    });
    buttonRow.appendChild(closeButton);
    buttonRow.appendChild(newFuncButton);
    overlay.appendChild(buttonRow);

    // Loop through dictionary keys
    for (const funcName in this.functions) {
        if (this.functions.hasOwnProperty(funcName)) {
            const selectButton = document.createElement('button');
            selectButton.textContent = funcName;
            selectButton.style.padding = '10px';
            selectButton.style.margin = '5px 0';
            selectButton.style.cursor = 'pointer';
            selectButton.style.width = "90%";
            selectButton.style.border = '1px solid #7b7b7b';
            selectButton.style.borderRadius = '5px';
            selectButton.style.backgroundColor = '#eee';
            selectButton.style.color="#000000"
            selectButton.style.display="flex"
            selectButton.style.justifyContent="flex-start"
            
            // Call the function when button clicked
            selectButton.addEventListener('click', () => {
                this.editContent(funcName)
            });

            overlay.appendChild(selectButton);
        }
    }

    document.body.appendChild(overlay);
}

    }
    Scratch.extensions.register(new JSeval());
})();
