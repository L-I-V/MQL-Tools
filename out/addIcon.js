'use strict';
const vscode = require('vscode');
const fs = require('fs');
const pathModule = require('path');
const sleep = require('util').promisify(setTimeout);
const ext = require('./extension');

function AddIcon(
    NameExt,
    FullNameExt,
    dirName = '',
    fileExt = '',
    dirJsonName = '',
    JsonFileName = [],
    PartPath = '') {
    const extenPath = vscode.extensions.all[vscode.extensions.all.length - 2].extensionPath.match(/.+(?=\\)/)[0], 
        NameDir = fs.readdirSync(extenPath, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).filter(name => name.includes(FullNameExt)).join();
        
    try {
        vscode.extensions.getExtension(FullNameExt).extensionPath;
    }
    catch (e) {

    return NameDir === '' ?
            vscode.window.showInformationMessage(`${ext.lg['s_i_m']} '${NameExt}'`, ext.lg['but_text_i'])
            .then((selection) => {
                if (selection === ext.lg['but_text_i']) {
                    vscode.window.withProgress(
                        {
                            location: vscode.ProgressLocation.Notification,
                            title: `${ext.lg['s_i_m_1']} '${NameExt}'`,
                        },
                        () => {
                            return new Promise((resolve) => {
                                vscode.commands.executeCommand('workbench.extensions.installExtension', FullNameExt).then(() => { 
                                    sleep(2000).then(() => {resolve(); AddIcon(NameExt, FullNameExt, dirName, fileExt, dirJsonName, JsonFileName, PartPath);})});
                            });
                        }
                    );
                }
            })
       : vscode.window.showWarningMessage(`'${NameExt}' ${ext.lg['s_i_m_4']}`);
    }

    NameExt === 'Material Icon Theme' ? add_material(NameExt, extenPath) : NameExt === 'vscode-icons' ? add_vsicons(NameExt, extenPath) : add(dirName, fileExt, dirJsonName, JsonFileName, PartPath, NameDir, NameExt, extenPath);
}

function add(dirName, fileExt, dirJsonName, JsonFileName, PartPath, NameDir, NameExt, extenPath) {

    ['mq4', 'mq5', 'ex4', 'ex5', 'mqh'].forEach(x => {
        fs.copyFileSync(
            pathModule.join(__dirname, '../' , 'files', 'icons', x + '.' + fileExt),
            pathModule.join(extenPath, NameDir, dirName, x + '.' + fileExt)
        )
    });
     
    JsonFileName.forEach(name => {
        const obj = JSON.parse(fs.readFileSync(pathModule.join(extenPath, NameDir, dirJsonName, name + '.json')));

        if (NameExt === 'Material Theme Icons') { dirName = dirName.split('/')[dirName.split('/').length - 1]; }
        if (NameExt === 'VSCode Great Icons') {
            Object.assign(obj.iconDefinitions, 
                { _f_mq4: { iconPath: PartPath + dirName + '/mq4.' + fileExt } },
                { _f_mq5: { iconPath: PartPath + dirName + '/mq5.' + fileExt } },
                { _f_mqh: { iconPath: PartPath + dirName + '/mqh.' + fileExt } },
                { _f_ex4: { iconPath: PartPath + dirName + '/ex4.' + fileExt } },
                { _f_ex5: { iconPath: PartPath + dirName + '/ex5.' + fileExt } });

            Object.assign(obj.fileExtensions, 
                { mq4: '_f_mq4' },
                { mq5: '_f_mq5' },
                { mqh: '_f_mqh' },
                { ex4: '_f_ex4' },
                { ex5: '_f_ex5' });
        } else {
            Object.assign(obj.iconDefinitions, 
                { mq4: { iconPath: PartPath + dirName + '/mq4.' + fileExt } },
                { mq5: { iconPath: PartPath + dirName + '/mq5.' + fileExt } },
                { mqh: { iconPath: PartPath + dirName + '/mqh.' + fileExt } },
                { ex4: { iconPath: PartPath + dirName + '/ex4.' + fileExt } },
                { ex5: { iconPath: PartPath + dirName + '/ex5.' + fileExt } });

            Object.assign(obj.fileExtensions, 
                { mq4: 'mq4' },
                { mq5: 'mq5' },
                { mqh: 'mqh' },
                { ex4: 'ex4' },
                { ex5: 'ex5' });
        }

        const json = JSON.stringify(obj, null, 4);

        fs.writeFileSync(pathModule.join(extenPath, NameDir, dirJsonName, name + '.json'), json, 'utf8');
    });

    vscode.window.showInformationMessage(`${ext.lg['s_i_m_2']} '${NameExt}'`);
}

function add_material(NameExt, extenPath){
    const config = vscode.workspace.getConfiguration(),
        folderName = 'material-icon-theme-custom-icons';

    pathModule.join(extenPath, 'mql-tools-icons', folderName)
        .split(pathModule.sep)
        .reduce((prevPath, folder) => {
        const currentPath = pathModule.join(prevPath, folder, pathModule.sep);
        if (!fs.existsSync(currentPath))
            fs.mkdirSync(currentPath);        
        return currentPath;
        }, '');

    ['mq4.svg', 'mq5.svg', 'ex4.svg', 'ex5.svg', 'mqh.svg'].forEach(x => {
        fs.copyFileSync(
            pathModule.join(__dirname, '../', 'files', 'icons', x),
            pathModule.join(extenPath, 'mql-tools-icons', folderName, x)
        )
    });

    let obj = {
        '*.ex4': `../../mql-tools-icons/${folderName}/ex4`,
        '*.ex5': `../../mql-tools-icons/${folderName}/ex5`,
        '*.mq4': `../../mql-tools-icons/${folderName}/mq4`,
        '*.mq5': `../../mql-tools-icons/${folderName}/mq5`,
        '*.mqh': `../../mql-tools-icons/${folderName}/mqh`,
    };

    config.update('material-icon-theme.files.associations', obj, true);

    vscode.window.showInformationMessage(`${ext.lg['s_i_m_2']} '${NameExt}'`);
}

function add_vsicons(NameExt, extenPath){
    const config = vscode.workspace.getConfiguration(),
        folderName = 'vsicons-custom-icons';

    pathModule.join(extenPath, 'mql-tools-icons', folderName)
        .split(pathModule.sep)
        .reduce((prevPath, folder) => {
        const currentPath = pathModule.join(prevPath, folder, pathModule.sep);
        if (!fs.existsSync(currentPath)){
            fs.mkdirSync(currentPath);
        }
        return currentPath;
        }, '');

    ['mq4.svg', 'mq5.svg', 'ex4.svg', 'ex5.svg', 'mqh.svg'].forEach(x => {
        fs.copyFileSync(
            pathModule.join(__dirname, '../', 'files', 'icons', x),
            pathModule.join(extenPath, 'mql-tools-icons', folderName, 'file_type_' + x)
        )
    });

    let obj = [
        { 'icon': 'mq4',  'extensions': ['mq4'], 'format': 'svg' },
        { 'icon': 'mq5',  'extensions': ['mq5'], 'format': 'svg' },
        { 'icon': 'mqh',  'extensions': ['mqh'], 'format': 'svg' },
        { 'icon': 'ex4',  'extensions': ['ex4'], 'format': 'svg' },
        { 'icon': 'ex5',  'extensions': ['ex5'], 'format': 'svg' }
      ];

    config.update('vsicons.customIconFolderPath', pathModule.join(extenPath, 'mql-tools-icons'), true);
    config.update('vsicons.associations.files', obj, true);

    vscode.window.showInformationMessage(`${ext.lg['s_i_m_2']} '${NameExt}'`);
}

function IconsInstallation() {
    const theme1 = 'Material Icon Theme', theme2 = 'vscode-icons', theme3 = 'VSCode Great Icons', theme4 = 'Material Theme Icons', options = [
        {
            label: theme1,
            volume: 0
        },
        {
            label: theme2,
            volume: 1
        },
        {
            label: theme3,
            volume: 2
        },
        {
            label: theme4,
            volume: 3
        },
    ];

    vscode.window.showQuickPick(options, { placeHolder: ext.lg['s_i_t'] }).then((item) => {
        if (!item)
            return undefined;

        switch (item.volume) {
            case 0: AddIcon(
                theme1,
                'pkief.material-icon-theme'               
            );
                break;
            case 1: AddIcon(
                theme2,
                'vscode-icons-team.vscode-icons'
            );
                break;
            case 2: AddIcon(
                theme3,
                'emmanuelbeziat.vscode-great-icons',
                'icons',
                'png',
                '',
                [
                    'icons'
                ],
                './'
            );
                break;

            case 3: AddIcon(
                theme4,
                'equinusocio.vsc-material-theme-icons',
                'out/icons',
                'svg',
                'out/variants',
                [
                    'Material-Theme-Icons',
                    'Material-Theme-Icons-Darker',
                    'Material-Theme-Icons-Light',
                    'Material-Theme-Icons-Ocean',
                    'Material-Theme-Icons-Palenight',
                ],
                '../'
            );
                break;
        }
    });
}

module.exports = {
    IconsInstallation
}