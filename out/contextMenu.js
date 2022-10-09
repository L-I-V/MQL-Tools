'use strict';
const vscode = require('vscode');
const childProcess = require('child_process');
const fs = require('fs');
const pathModule = require('path');
const ext = require("./extension");


function ShowFiles(...args) {
    const conf = vscode.workspace.getConfiguration(),
        object = {}, obj = {};

    Object.assign(object, conf.files.exclude);
    args.forEach(arg => arg in object ? Object.assign(obj, object[arg] === false ? { [arg]: true } : { [arg]: false }) : Object.assign(obj, { [arg]: true }));

    conf.update('files.exclude', obj, false);
}

function InsertIcon() {

    const options = {
        canSelectFolders: false,
        canSelectMany: false,
        defaultUri: vscode.Uri.file(pathModule.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'Images')),
        filters: {
            'Import Files': ['ico']
        }
    };

    vscode.window.showOpenDialog(options).then(fileUri => {
        if (fileUri && fileUri[0]) {
            const { document, selection, edit } = vscode.window.activeTextEditor, NName = fileUri[0].fsPath, RelativePath = vscode.workspace.asRelativePath(NName),
                d = selection.start.line, ns = document.lineAt(d).text.length, pos = new vscode.Position(d, ns),
                str = RelativePath.replace(/\//g, '\\\\');

            edit(edit => edit.insert(pos, (ns > 0 ? '\n' : '') + '#property icon ' + '\"\\\\' + str + '\"'));
        }
    });
}

function InsertMQL() {
    const options = {
        canSelectFolders: false,
        canSelectMany: false,
        defaultUri: vscode.Uri.file(vscode.workspace.workspaceFolders[0].uri.fsPath),
        filters: {
            'MQL Files': ['mq4', 'mq5']
        }
    };

    vscode.window.showOpenDialog(options).then(fileUri => {
        if (fileUri && fileUri[0])
            InsertNameFileMQL(fileUri[0]);
    });
}

function InsertNameFileMQL(uri) {

    const activeEditor = vscode.window.activeTextEditor, RelativePath = vscode.workspace.asRelativePath(uri.fsPath), extension = pathModule.extname(activeEditor.document.fileName),
        pos = new vscode.Position(0, 0);
        
    if (extension === '.mqh') activeEditor.edit(edit => edit.insert(pos, `//###<${RelativePath}>\n`));
    
}

function InsertMQH() {
    const options = {
        canSelectFolders: false,
        canSelectMany: false,
        defaultUri: vscode.Uri.file(pathModule.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'Include')),
        filters: {
            'MQH Include Files': ['mqh']
        }
    };

    vscode.window.showOpenDialog(options).then(fileUri => {
        if (fileUri && fileUri[0]) 
            InsertNameFileMQH(fileUri[0])        
    })
            
}

function InsertNameFileMQH(uri) {

    const { document, selection, edit } = vscode.window.activeTextEditor, NName = uri.fsPath, RelativePath = vscode.workspace.asRelativePath(NName), 
        Path = document.fileName, extension = pathModule.extname(Path),
        d = selection.start.line, ns = document.lineAt(d).text.length, pos = new vscode.Position(d, ns);

    if (['.mq4', '.mq5', '.mqh'].includes(extension)) {
        const dirName = pathModule.dirname(Path), Ye = NName.includes(Path.match(/.*\\(?=(?:(?:(?:.+)\.(?:\w+))$))/m)[0]) ? 1 : 0,
            str = Ye ? NName.slice(dirName.length + 1) : RelativePath.replace(/(^include\/)(.+)/im, "$2");
        edit(edit => edit.insert(pos, (ns > 0 ? '\n' : '') + '#include ' + (Ye === 1 ? '\"' : '<') + str + (Ye === 1 ? '\"' : '>')));
    }
}

function InsertResource() {

    const options = {
        canSelectFolders: false,
        canSelectMany: false,
        defaultUri: vscode.Uri.file(pathModule.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'Files')),
        filters: {
            'Import Files': ['bmp', 'wav']
        }
    };

    vscode.window.showOpenDialog(options).then(fileUri => {
        if (fileUri && fileUri[0]) {
            const { document, selection, edit } = vscode.window.activeTextEditor, NName = fileUri[0].fsPath, RelativePath = vscode.workspace.asRelativePath(NName),
                d = selection.start.line, ns = document.lineAt(d).text.length, pos = new vscode.Position(d, ns),
                str = RelativePath.replace(/\//g, '\\\\');

            edit(edit => edit.insert(pos, (ns > 0 ? '\n' : '') + '#resource ' + '\"\\\\' + str + '\"'));
        }
    });
}

function InsertImport() {

    const options = {
        canSelectFolders: false,
        canSelectMany: false,
        defaultUri: vscode.Uri.file(pathModule.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'Libraries')),
        filters: {
            'Library Files': ['dll', 'ex5']
        }
    };

    vscode.window.showOpenDialog(options).then(fileUri => {
        if (fileUri && fileUri[0]) {
            const { document, selection, edit } = vscode.window.activeTextEditor, NName = fileUri[0].fsPath, RelativePath = vscode.workspace.asRelativePath(NName),
                Path = document.fileName, extfile = pathModule.extname(NName), fileName = pathModule.basename(NName),
                d = selection.start.line, ns = document.lineAt(d).text.length, pos = new vscode.Position(d, ns);

            if (extfile === '.dll')
                edit(edit => edit.insert(pos, (ns > 0 ? '\n' : '') + '#import ' + '\"' + fileName + '\"' + '\n\n#import'));
            if (extfile === '.ex5') {
                const dirName = pathModule.dirname(Path), Ye = NName.includes(Path.match(/.*\\(?=(?:(?:(?:.+)\.(?:\w+))$))/m)[0]) ? 1 : 0,
                    str = Ye ? NName.slice(dirName.length + 1) : (RelativePath.search(/^Libraries/) != -1 ? RelativePath.match(/(?<=Libraries\/).+/gi) : '..\\..\\..\\' + RelativePath).replace(/\//g, '\\');
                edit(edit => edit.insert(pos, (ns > 0 ? '\n' : '') + '#import ' + '\"' + str + '\"' + '\n\n#import'));
            }
        }
    });
}

function InsertTime() {
    const { selection, edit } = vscode.window.activeTextEditor, { start, end } = selection, date = new Date(),
        time = `D'${ext.tf(date, 'Y')}.${ext.tf(date, 'M')}.${ext.tf(date, 'D')} ${ext.tf(date, 'h')}:${ext.tf(date, 'm')}:${ext.tf(date, 's')}'`,
        pos = new vscode.Position(start.line, start.character);

    (end.line !== start.line || end.character !== start.character) ? edit(edit => edit.replace(selection, time)) : edit(edit => edit.insert(pos, time));    
}

function CreateComment() {
    const { document, selection, edit } = vscode.window.activeTextEditor, { end } = selection,
        reg = /(?:(\w+)\s+)(?:(?:\w+::|)\w+(?: +|)\()/,
        wordAtCursorRange = document.getWordRangeAtPosition(end, reg);

    if (wordAtCursorRange === undefined)
        return undefined;
    const snip = document.getText(wordAtCursorRange),
        regEx = new RegExp(`${snip.replace('(', '\\(')}([\\s+\\n+\\w+&\\[\\]\\,=]*)\\)(?:(?:(?:\\s+|\\n)|)\\/\\*(?:.|\\n)*\\*\\/|(?:\\s+|)\\/\\/.*|)(?:\\{|\\s+\\{)`);
    let a, args;
    
    if (args = document.getText().match(regEx)) {        
        const space = ''.padEnd(wordAtCursorRange.start.character, ' ');
        let comment = space + '/**\n', type;
        comment += space + ' * ' + ext.lg['comm_func'] + '\n';
        args[1].replace(/\s+/g, ' ').trim().split(',').forEach((item, index) => { if (a = item.match(/(?<= )(?:[\w&\[\]=]+)$/, 'g')) comment += `${space} * @param  ${a[0]}: ${ext.lg['comm_arg']} ${index + 1}\n` });
        if((type = snip.match(reg)[1]) != 'void') comment += `${space} * @return ( ${type} )\n`;        
        comment += space + ' */\n';

        edit(edit => edit.insert(new vscode.Position(wordAtCursorRange.start.line, 0), comment));
    }
}

function OpenFileInMetaEditor(uri) {
    const extension = pathModule.extname(uri.fsPath), config = vscode.workspace.getConfiguration('mql_tools'), wn = vscode.workspace.name.includes('MQL4'), fileName = pathModule.basename(uri.fsPath);
    let MetaDir, CommM;
    
    if (['.mq4', '.mqh'].includes(extension) && wn) {
        MetaDir = config.Metaeditor.Metaeditor4Dir;
        CommM = ext.lg['path_editor4'];
    }
    else if (['.mq5', '.mqh'].includes(extension) && !wn) {
        MetaDir = config.Metaeditor.Metaeditor5Dir;
        CommM = ext.lg['path_editor5'];
    }
    else
        return undefined;

    const Nm = pathModule.basename(MetaDir), Pm = pathModule.dirname(MetaDir);

    if (!(fs.existsSync(Pm) && (Nm === 'metaeditor.exe' || Nm === 'metaeditor64.exe'))) {
        return vscode.window.showErrorMessage(`${CommM} [${MetaDir}]`);
    }

    try {
        childProcess.exec(`"${MetaDir}" "${uri.fsPath}"`);
    }
    catch (e) {
        return vscode.window.showErrorMessage(`${ext.lg['err_open_in_me']} - ${fileName}`);
    }
}


module.exports = {
	ShowFiles,	
    InsertNameFileMQH,
    InsertMQH,
    InsertNameFileMQL,
    InsertMQL,
    InsertResource,
    InsertImport,
    InsertTime,
    InsertIcon,
    CreateComment,
    OpenFileInMetaEditor
}
