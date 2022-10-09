'use strict';
const vscode = require('vscode');
const childProcess = require('child_process');
const fs = require('fs');
const pathModule = require('path');
const https = require('https');
const sleep = require('util').promisify(setTimeout);
const language = vscode.env.language;
const ext = require("./extension");


function Help(sm) {
    const { document, selection } = vscode.window.activeTextEditor, { start, end } = selection;
    if (end.line !== start.line)
        return undefined;
    const isSelectionSearch = end.line !== start.line || end.character !== start.character, wordAtCursorRange = isSelectionSearch ? selection : document.getWordRangeAtPosition(end, /(#\w+|\w+)/);
    if (wordAtCursorRange === undefined)
        return undefined;

    const config = vscode.workspace.getConfiguration('mql_tools'), extension = pathModule.extname(document.fileName), PathKeyHH = pathModule.join(__dirname, '../' ,'files', 'KeyHH.exe'), 
        wn = vscode.workspace.name.includes('MQL4'), helpval = config.Help.HelpVal, var_loc4 = config.Help.MQL4HelpLanguage, var_loc5 = config.Help.MQL5HelpLanguage, keyword = document.getText(wordAtCursorRange);

    let v, loc;

    if (extension === '.mq4' || (extension === '.mqh' && wn)) {
        v = 4; loc = var_loc4 === 'Default' ? (language === 'ru' ? '_russian' : '') : (var_loc4 === 'Русский' ? '_russian' : '');
    } 
    else if (extension === '.mq5' || (extension === '.mqh' && !wn)) {
        v = 5;
        switch (var_loc5 === 'Default' ? language : var_loc5) {
            case (var_loc5 === 'Default' ? 'ru' : 'Русский'): loc = '_russian'; break;
            case (var_loc5 === 'Default' ? 'zh-cn' : 'Chinese'): loc = '_chinese'; break;
            case (var_loc5 === 'Default' ? 'zh-tw' : 'Chinese'): loc = '_chinese'; break;
            case (var_loc5 === 'Default' ? 'fr' : 'French'): loc = '_french'; break;
            case (var_loc5 === 'Default' ? 'de' : 'German'): loc = '_german'; break;
            case (var_loc5 === 'Default' ? 'it' : 'Italian'): loc = '_italian'; break;
            case (var_loc5 === 'Default' ? 'es' : 'Spanish'): loc = '_spanish'; break;
            case (var_loc5 === 'Default' ? 'ja' : 'Japanese'): loc = '_japanese'; break;
            case (var_loc5 === 'Default' ? 'pt-br' : 'Portuguese'): loc = '_portuguese'; break;
            case (var_loc5 === 'Default' ? 'tr' : 'Turkish'): loc = '_turkish'; break;
            default: loc = ''; break;
        }
    }
    else return undefined;

    const PathHelp = pathModule.join(__dirname, '../' ,'files', 'help', 'mql' + v + loc + '.chm');

    if (!fs.existsSync(PathHelp))
        return download(v, loc);    

    childProcess.exec(`tasklist /FI "IMAGENAME eq KeyHH.exe"`, (err, stdout) => {
        if (stdout.includes("KeyHH.exe") != true) {
            childProcess.exec(`${PathKeyHH} -Mql ${PathHelp}`);
            sleep(sm ? helpval : 1000).then(() => { childProcess.exec(`${PathKeyHH} -Mql -#klink '${keyword}' ${PathHelp}`); });
        }
        else
            childProcess.exec(`${PathKeyHH} -Mql -#klink '${keyword}' ${PathHelp}`);
    });
}

function download(n, locname) {
    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: ext.lg['help_Lo'],
        },
        () => {
            return new Promise((resolve) => {
                if (!fs.existsSync(pathModule.join(__dirname, '../' , 'files', 'help')))
                    fs.mkdirSync(pathModule.join(__dirname, '../' , 'files', 'help'));
                const req = https.get('https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/files/help/mql' + n + locname + '.chm',
                    (response) => {
                        if (response.statusCode === 200) {
                            const file = fs.createWriteStream(
                                pathModule.join(__dirname, '../' , 'files', 'help', 'mql' + n + locname + '.chm')
                            );
                            response.pipe(file);

                            file.on('error', () => {
                                return resolve(), vscode.window.showErrorMessage(ext.lg['help_er_save']);
                            });

                            file.on('finish', () => {
                                return file.close(), resolve(), Help(false);
                            });
                        } else {
                            return resolve(), vscode.window.showErrorMessage(`${ext.lg['help_er_statusCode']} ${response.statusCode}`);
                        }
                    }
                );

                req.on('error', () => {
                    return resolve(), vscode.window.showErrorMessage(ext.lg['help_er_noconnect']);
                });
            });
        }
    );
}

module.exports = {
    Help
}