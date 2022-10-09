'use strict';
const vscode = require('vscode');
const fs = require('fs');
const pathModule = require('path');
const ext = require("./extension");

function CreateProperties() {
    const config = vscode.workspace.getConfiguration(), configMql = vscode.workspace.getConfiguration('mql_tools'), workspacepath = vscode.workspace.workspaceFolders[0].uri.fsPath, 
        incPath = pathModule.join(workspacepath, 'Include'), arrPath = ['${workspaceFolder}/**', incPath];
    let objectcpp = {}, incDir, CommI;

    if (vscode.workspace.name.includes('MQL4')) {
        incDir = configMql.Metaeditor.Include4Dir;
        CommI = ext.lg['path_include_4'];
    }
    else {
        incDir = configMql.Metaeditor.Include5Dir;
        CommI = ext.lg['path_include_5'];
    }

    if (incDir.length > 0) {
        if (!fs.existsSync(incDir)) {
            return vscode.window.showErrorMessage(`${CommI} [ ${incDir} ]`);
        }
        else {
            incDir = pathModule.join(incDir, 'Include');
            const regEx = new RegExp(incDir.replace(/\\/g, '\\\\'), 'ig');

            if (!incPath.match(regEx))
                arrPath.push(incDir);
        }
    }

    Object.assign(objectcpp, config.C_Cpp.default.includePath);

    if (arrPath.length < Object.keys(objectcpp).length) {
        config.update('C_Cpp.default.includePath', arrPath, false);
    }
    else {
        for (let arg of arrPath) {
            if (!Object.values(objectcpp).includes(arg)) {
                config.update('C_Cpp.default.includePath', arrPath, false);
                break;
            }
        }
    }

    const object = {
        '**/*.ex4': true,
        '**/*.ex5': true,
    };

    const obj_token = {
        textMateRules: [
            { scope: 'token.error.mql', settings: { foreground: '#F44747' } },
            { scope: 'token.done.mql', settings: { foreground: '#029c23d3' } },
            { scope: 'token.warning.mql', settings: { foreground: '#ff9d00' } },
            { scope: 'token.info.mql', settings: { foreground: '#0861fc' } },
            { scope: 'token.heading.mql', settings: { foreground: '#6796E6' } },
        ],
    };

    const obj_associations = {
        '*.mqh': 'cpp',
        '*.mq4': 'cpp',
        '*.mq5': 'cpp'
    };

    config.update('C_Cpp.errorSquiggles', 'Disabled', false);
    config.update('mql_tools.context', true, false);
    config.update('editor.tokenColorCustomizations', obj_token, false);
    config.update('files.exclude', object, false);
    config.update('files.associations', obj_associations, false);
}

function Cpp_prop(incDir) {
    const config = vscode.workspace.getConfiguration(), workspacepath = vscode.workspace.workspaceFolders[0].uri.fsPath,
        object = {}, incPath = pathModule.join(workspacepath, 'Include'), arrPath = ['${workspaceFolder}/**', incPath],
        regEx = new RegExp(incDir.replace(/\\/g, '\\\\'), 'ig');

    incDir = pathModule.join(incDir, 'Include');    

    if (!incPath.match(regEx))
        arrPath.push(incDir);

    Object.assign(object, config.C_Cpp.default.includePath);

    if (arrPath.length < Object.keys(object).length) {
        config.update('C_Cpp.default.includePath', arrPath, false);
    }
    else {
        for (let arg of arrPath) {
            if (!Object.values(object).includes(arg)) {
                config.update('C_Cpp.default.includePath', arrPath, false);
                break;
            }
        }
    }
}

module.exports = {
    CreateProperties,
    Cpp_prop
}