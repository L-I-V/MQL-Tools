'use strict';
const url = require('url');
const vscode = require('vscode');
const childProcess = require('child_process');
const fs = require('fs');
const pathModule = require('path');
const sleep = require('util').promisify(setTimeout);
const language = vscode.env.language;
const { Help } = require("./help");
const { ShowFiles, InsertNameFileMQH, InsertMQH, InsertNameFileMQL, InsertMQL, InsertResource, InsertImport, InsertTime, InsertIcon, OpenFileInMetaEditor, CreateComment } = require("./contextMenu");
const { IconsInstallation } = require("./addIcon");
const { Hover_log, DefinitionProvider, Hover_MQL, ItemProvider, HelpProvider, ColorProvider } = require("./provider");
const { Cpp_prop, CreateProperties } = require("./createProperties");
const outputChannel = vscode.window.createOutputChannel('MQL', 'mql-output');
const os = process.platform;

try {
    var lg = require(`../landes.${language}.json`);
}
catch (error) {
    lg = require('../landes.json');
}


function Compile(rt) {
    FixFormatting();
    vscode.commands.executeCommand('workbench.action.files.saveAll');
    const NameFileMQL = rt != 0 ? FindParentFile() : '',
        path = NameFileMQL != undefined ? (fs.existsSync(NameFileMQL) ? NameFileMQL : vscode.window.activeTextEditor.document.fileName) : vscode.window.activeTextEditor.document.fileName,
        config = vscode.workspace.getConfiguration('mql_tools'),
        fileName = pathModule.basename(path),
        extension = pathModule.extname(path),
        PathScript = pathModule.join(__dirname, '../', 'files', 'MQL Tools_Compiler.exe'),
        logDir = config.LogFile.NameLog, Timemini = config.Script.Timetomini,
        mme = config.Script.MiniME, cme = config.Script.CloseME,
        wn = vscode.workspace.name.includes('MQL4'), startT = new Date(),
        time = `${tf(startT, 'h')}:${tf(startT, 'm')}:${tf(startT, 's')}`;

    let logFile, command, MetaDir, incDir, CommM, CommI, teq, includefile, log;

    if (extension === '.mq4' || extension === '.mqh' && wn && rt === 0) {
        MetaDir = config.Metaeditor.Metaeditor4Dir;
        incDir = config.Metaeditor.Include4Dir;
        CommM = lg['path_editor4'];
        CommI = lg['path_include_4'];
    } else if (extension === '.mq5' || extension === '.mqh' && !wn && rt === 0) {
        MetaDir = config.Metaeditor.Metaeditor5Dir;
        incDir = config.Metaeditor.Include5Dir;
        CommM = lg['path_editor5'];
        CommI = lg['path_include_5'];
    } else if (extension === '.mqh' && rt !== 0) {
        return vscode.window.showWarningMessage(lg['mqh']);
    } else {
        return undefined;
    }

    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Window,
            title: `MQL Tools: ${rt === 0 ? lg['checking'] : lg['compiling']}`,
        },
        () => {
            return new Promise((resolve) => {

                switch (rt) {
                    case 0: teq = lg['checking'];
                        break;
                    case 1: teq = lg['compiling'];
                        break;
                    case 2: teq = lg['comp_usi_script'];
                        break;
                }

                outputChannel.clear();
                outputChannel.show(true);
                outputChannel.appendLine(`[Starting] [${time}] ${teq} >>> ${fileName} <<<`);

                const Nm = pathModule.basename(MetaDir), Pm = pathModule.dirname(MetaDir);

                if (!(fs.existsSync(Pm) && (Nm === 'metaeditor.exe' || Nm === 'metaeditor64.exe'))) {
                    return resolve(), outputChannel.appendLine(`[Error]  '${CommM}' [ ${MetaDir} ]`);
                }

                if (incDir.length) {
                    if (!fs.existsSync(incDir)) {
                        return resolve(), outputChannel.appendLine(`[Error]  ${CommI} [ ${incDir} ]`);
                    } else {
                        includefile = ` /include:"${incDir}"`;
                        Cpp_prop(incDir);
                    }
                } else {
                    includefile = '';
                }

                if (logDir.length) {
                    if (pathModule.extname(logDir) === '.log') {
                        logFile = path.replace(fileName, logDir);
                    } else {
                        logFile = path.replace(fileName, logDir + '.log');
                    }
                } else {
                    logFile = path.replace(fileName, fileName.match(/.+(?=\.)/) + '.log');
                }

                if (os === 'linux') {
                    let DirAbsPath, CompRelPath, FileRelPath, IncRelPath, LogRelPath;
                    DirAbsPath = pathModule.dirname(MetaDir);
                    CompRelPath = pathModule.relative(DirAbsPath, MetaDir);
                    FileRelPath = pathModule.relative(DirAbsPath, path);
                    IncRelPath = pathModule.relative(DirAbsPath, incDir);
                    LogRelPath = pathModule.relative(DirAbsPath, logFile);

                    command = `cd "${DirAbsPath}" && wine "${CompRelPath}" /compile:"${FileRelPath}" /include:"${IncRelPath}"${rt === 1 || (rt === 2 && cme) ? "" : " /s"} /log:"${LogRelPath}"`;
                    }

                else {command = `"${MetaDir}" /compile:"${path}"${includefile}${rt === 1 || (rt === 2 && cme) ? '' : ' /s'} /log:"${logFile}"`;}

                childProcess.exec(command, (err, stdout, stderror) => {

                    if (stderror && os !== 'linux') {
                        return resolve(), outputChannel.appendLine(`[Error]  ${lg['editor64']} ${CommM} [${MetaDir}] \n[Warning] ${lg['editor64to']} [${Pm}\\${(Nm === 'metaeditor.exe' ? 'metaeditor64.exe' : 'metaeditor.exe')}]`);
                    }

                    try {
                        var data = fs.readFileSync(logFile, 'ucs-2');
                    } catch (err) {
                        return vscode.window.showErrorMessage(`${lg['err_read_log']} ${err}`), resolve();
                    }

                    config.LogFile.DeleteLog && fs.unlink(logFile, (err) => {
                            err && vscode.window.showErrorMessage(lg['err_remove_log']);
                        });

                    switch (rt) {
                        case 0: log = replaceLog(data, false); outputChannel.appendLine(String(log.text)); resolve(); break;
                        case 1: log = replaceLog(data, true); outputChannel.appendLine(String(log.text)); resolve(); break;
                        case 2: log = cme ? replaceLog(data, true) : replaceLog(data, false); break;
                    }

                    const end = new Date;

                    if (rt === 2 && !log.error) {
                        let TimeClose = (Math.ceil((end - startT) * 0.01) * 100);
                        command = `"${PathScript}" "${MetaDir}" "${path}" ${mme ? 1 : 0} ${Timemini} ${cme ? 1 : 0} ${TimeClose} ${Nm}`;

                        try {
                            childProcess.execSync(command);
                        }
                        catch (error) {
                            return outputChannel.appendLine(`[Error]  ${lg['err_start_script']}`), resolve();
                        }
                        outputChannel.appendLine(String(cme ? log.text : log.text + lg['info_log_compile'])); resolve();
                    } else if (rt === 2 && log.error) {
                        outputChannel.appendLine(log.text);
                        resolve();
                    }
                });
                sleep(30000).then(() => { resolve(); });
            });
        }
    );
}

function replaceLog(str, f) {
    let text = f ? '' : '\n\n', obj_hover = {}, ye;
    str.replace(/\u{FEFF}/gu, '').split('\n').forEach(item => {
        if (item.includes(f ? ': information: compiling' : ': information: checking')) {
            let regEx = new RegExp(`(?<=${f ? 'compiling' : 'checking'}.).+'`, 'gi'),
                name = String(item.match(regEx)),
                link = url.pathToFileURL(String(item.match(/[a-z]:\\.+(?= :)/gi))).href;
            Object.assign(obj_hover, { [name]: { ['link']: link } });
            text += name + '\n';
        }
        else if (item.includes(': information: including')) {
            let name_icl = String(item.match(/(?<=information: including ).+'/gi)),
                link_icl = url.pathToFileURL(String(item.match(/[a-z]:\\.+(?= :)/gi))).href;
            Object.assign(obj_hover, { [name_icl]: { ['link']: link_icl } });
            text += name_icl + '\n';
        }
        else if (item.includes('information: generating code') || item.includes('information: code generated')) return;
        else if (item.includes('information: info')) {
            let name_info = String(item.match(/(?<=information: ).+/gi)),
                link_info = url.pathToFileURL(String(item.match(/[a-z]:\\.+(?= :)/gi))).href;
            Object.assign(obj_hover, { [name_info]: { ['link']: link_info } });
            text += name_info + '\n';
        }
        else if (item.includes(f ? 'Result:' : ': information: result')) {
            let Err = item.match(/(?!0)\d+.error/), War = item.match(/(?!0)\d+.warning/);

            if (Err != null) {
                text += f ? '[Error] ' + item : '[Error] Result: ' + item.match(/\d+.error.+/);
                ye = true;
            } else if (War != null) {
                text += f ? '[Warning] ' + item : '[Warning] Result: ' + item.match(/\d+.error.+/);
                ye = false;
            } else {
                text += f ? '[Done] ' + item : '[Done] Result: ' + item.match(/\d+.error.+/);
                ye = false;
            }
        }
        else {
            let re = /([a-zA-Z]:\\.+(?= :)|^\(\d+,\d+\))(?:.: )(.+)/,
                link_res = item.replace(re, '$1').replace(/[\r\n]+/g, ''),
                name_res = item.replace(re, '$2').replace(/[\r\n]+/g, ''),
                gh = name_res.match(/(?<=error |warning )\d+/);

            name_res = name_res.replace(gh, '');

            if (link_res.match(/[a-z]:\\.+/gi) && name_res != '') {
                Object.assign(obj_hover, { [name_res + ' ' + String(link_res.match(/\((?:\d+\,\d+)\)$/gm))]: { ['link']: String(url.pathToFileURL(link_res).href.replace(/\((?=(\d+,\d+).$)/gm, '#').replace(/\)$/gm, '')), ['number']: String(gh) } });
                text += name_res + ' ' + link_res.match(/(.)(?:\d+,\d+).$/gm) + '\n';
            }
            else {
                if (gh) {
                    Object.assign(obj_hover, { [name_res]: { ['link']: '', ['number']: gh } });
                    text += name_res + '\n';
                }
                else
                    text += name_res + '\n';
            }
        }
    });

    exports.obj_hover = obj_hover;
    return {
        text: text,
        error: ye
    };

}

function FindParentFile() {
    const { document } = vscode.window.activeTextEditor;
    const extension = pathModule.extname(document.fileName);
    if (extension === '.mqh') {
        const workspacepath = vscode.workspace.workspaceFolders[0].uri.fsPath;

        let NameFileMQL, match, regEx = new RegExp('(\\/\\/###<).+(mq[4|5]>)', 'ig');

        while (match = regEx.exec(document.lineAt(0).text))
            NameFileMQL = match[0];        

        if (NameFileMQL != undefined)
            NameFileMQL = pathModule.join(workspacepath, String(NameFileMQL.match(/(?<=<).+(?=>)/)));
        
        return NameFileMQL;
    } else {
        return undefined;
    }
}

function tf(date, t, d) {

    switch (t) {
        case 'Y': d = date.getFullYear(); break;
        case 'M': d = date.getMonth() + 1; break;
        case 'D': d = date.getDate(); break;
        case 'h': d = date.getHours(); break;
        case 'm': d = date.getMinutes(); break;
        case 's': d = date.getSeconds(); break;
    }

    return d < 10 ? '0' + d.toString() : d.toString();
}

function FixFormatting() {
    const { document, edit } = vscode.window.activeTextEditor, array = [],
        data = {
            reg: [
                "\\bC '\\d{1,3},\\d{1,3},\\d{1,3}'",
                "\\bC '0x[A-Fa-f0-9]{2},0x[A-Fa-f0-9]{2},0x[A-Fa-f0-9]{2}'",
                "\\bD '(?:(?:\\d{2}|\\d{4})\\.\\d{2}\\.(?:\\d{2}|\\d{4})|(?:\\d{2}|\\d{4})\\.\\d{2}\\.(?:\\d{2}|\\d{4})\\s{1,}[\\d:]+)'"
            ],
            searchValue: [
                "C ",
                "C ",
                "D "
            ],
            replaceValue: [
                "C",
                "C",
                "D"
            ]
        };

    Array.from(document.getText().matchAll(new RegExp(CollectRegEx(data.reg), 'g'))).map(match => {        
        for (const i in data.reg) {
            if (match[0].match(new RegExp(data.reg[i], 'g'))) {
                let range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length))
                array.push({ range, to: document.getText(range).replace(data.searchValue[i], data.replaceValue[i]) })
            }
        }
    });

    array.length && edit(edit => array.forEach(({ range, to }) => edit.replace(range, to)));
}

function CollectRegEx(dt, string = "") {
    for (const i in dt) {
        string += dt[i] + '|';
    }
    return string.slice(0, -1);
}

function activate(context) {

    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.checkFile', () => Compile(0)));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.compileFile', () => Compile(1)));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.compileScript', () => Compile(2)));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.help', () => Help(true)));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.configurations', () => CreateProperties()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.Addicon', () => IconsInstallation()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.Showfiles', () => ShowFiles('**/*.ex4', '**/*.ex5')));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsMQL', () => InsertMQL()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsMQH', () => InsertMQH()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsNameMQL', (uri) => InsertNameFileMQL(uri)));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsNameMQH', (uri) => InsertNameFileMQH(uri)));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsResource', () => InsertResource()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsImport', () => InsertImport()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsTime', () => InsertTime()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsIcon', () => InsertIcon()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.openInME', (uri) => OpenFileInMetaEditor(uri)));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.commentary', () => CreateComment()));
    context.subscriptions.push(vscode.languages.registerHoverProvider('mql-output', Hover_log()));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider('mql-output', DefinitionProvider()));
    context.subscriptions.push(vscode.languages.registerHoverProvider({ pattern: '**/*.{mq4,mq5,mqh}' }, Hover_MQL()));
    context.subscriptions.push(vscode.languages.registerColorProvider({ pattern: '**/*.{mq4,mq5,mqh}' }, ColorProvider()));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ pattern: '**/*.{mq4,mq5,mqh}' }, ItemProvider()));
    sleep(1000).then(() => { context.subscriptions.push(vscode.languages.registerSignatureHelpProvider({ pattern: '**/*.{mq4,mq5,mqh}' }, HelpProvider(), '(', ',')); });

}

function deactivate() {
}


exports.lg = lg;
exports.tf = tf;
module.exports = {
    activate,
    deactivate
}
