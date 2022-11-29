'use strict';
const vscode = require('vscode');
const pathModule = require('path');
const ext = require('./extension');
const err_codes = require('../data/error-codes.json');
const obj_items = require('../data/items.json');
const colorW = require('../data/color.json')
const language = vscode.env.language;

const groupFunctions = 2;
const groupKeywords = 13;
const groupColors = 15;
const groupConstants = 20;

function Hover_log() {
    return {
        provideHover(document, position) {
            const word = document.lineAt(position.line).text;

            if (!(word in ext.obj_hover)) return undefined;

            const link = (typeof ext.obj_hover[word].link == 'undefined') ? '' : ext.obj_hover[word].link,
                loclang = language === 'zh-tw' ? 'zh-cn' : language;

            if (loclang in err_codes)
                var local = err_codes[loclang][ext.obj_hover[word].number];

            if (!local && !link)
                return undefined;

            const contents = new vscode.MarkdownString(`${local ? local : `[${ext.lg['hover_log']}](${link})`}`);

            if (local) {
                if (link) {
                    contents.supportHtml = true;
                    contents.appendMarkdown(`<hr>\n\n[${ext.lg['hover_log']}](${link})`);
                }
            }
            return new vscode.Hover(contents);
        }
    }
}

function DefinitionProvider() {
    return {
        provideDefinition(document, position) {
            const word = document.lineAt(position.line).text;

            if (!(word in ext.obj_hover)) return undefined;

            const link = (typeof ext.obj_hover[word].link == 'undefined') ? '' : ext.obj_hover[word].link;

            if (!link) return undefined;
            const fileLink = link.match(/.+(?=#)/g) !== null ? link.match(/.+(?=#)/g)[0] : link,
                fragment1 = link.match(/.+(?=#)/g) !== null ? link.match(/(?<=#)(?:\d+,\d+)$/gm)[0].match(/(?:\w+)/g)[0] : 0,
                fragment2 = link.match(/.+(?=#)/g) !== null ? link.match(/(?<=#)(?:\d+,\d+)$/gm)[0].match(/(?:\w+)/g)[1] : 0,
                uri = vscode.Uri.file(fileLink.match(/(?<=file:\/\/\/).+/g)[0].replace(/%20/g,' ')),
                pos = new vscode.Position(+fragment1 <= 0 ? 0 : +fragment1 - 1, +fragment2 <= 0 ? 0 : +fragment2 - 1);

            return new vscode.Location(uri, pos);
        }
    }
}

function Hover_MQL() {
    return {
        provideHover(document, position) {
            const loclang = language === 'zh-tw' ? 'zh-cn' : language,
                range = document.getWordRangeAtPosition(position),
                word = document.getText(range);

            if (!(word in obj_items)) return undefined;
            if (![groupFunctions, groupConstants].includes(obj_items[word].group)) return undefined;
            const example = (typeof obj_items[word].code.map(match => match.label)[0] == 'undefined') ? '' : obj_items[word].code.map(match => match.label+'\n').join('\n'),
                dl = obj_items[word].description[loclang] ? obj_items[word].description[loclang] : obj_items[word].description.en,
                description = (typeof dl == 'undefined') ? '' : dl,
                contents = new vscode.MarkdownString(),
                rex = /(\()(\w+)(\))(.+\n.*|.*)/;

            contents.appendCodeblock(example, 'cpp');
            contents.supportHtml = true;

            contents.appendMarkdown(
                `<span style="color:#ffd700e6;">${description.replace(rex, '$1')}</span><span style="color:#C678DD;"> ${description.replace(rex, '$2')} </span>` +
                `<span style="color:#ffd700e6;">${description.replace(rex, '$3')}</span><span>${description.replace(rex, '$4')}</span><hr>\n\n`);

            (obj_items[word].parameters[loclang] ? obj_items[word].parameters[loclang] : obj_items[word].parameters.en).forEach(function (item) {
                const re = /(.+?(?=  ))(.+)/;
                contents.appendMarkdown(' `' + item.replace(re, '$1') + '` -' + item.replace(re, '$2') + '<br>\n');
            });
            
            return new vscode.Hover(contents);
        }
    }
}

function ItemProvider() {
    return {
        provideCompletionItems(document, position) {
            const loclang = language === 'zh-tw' ? 'zh-cn' : language,
                path = vscode.Uri.file(pathModule.join(__dirname, '../', 'images', 'mql_icon_mini.png')),
                range = document.getWordRangeAtPosition(position),
                prefix = document.getText(range),
                regEx = new RegExp(prefix, 'i');

            return Object.values(obj_items).filter(name => name.label.substring(0, prefix.length).match(regEx)).map(match => {
                    const item = new vscode.CompletionItem(match.label, match.group);
                    item.insertText = new vscode.SnippetString(match.body);
                    item.detail = match.description[loclang] ? match.description[loclang] : match.description.en;
                    const contents = new vscode.MarkdownString();
                    contents.appendCodeblock(match.code.map(match => match.label)[0]);
                    if (match.group === groupColors) {
                        if (match.label in colorW) {
                            let clrRGB = colorW[match.label].split(',');                          
                            contents.appendMarkdown(
                                `<span style="background-color:#${rgbaToHex(+clrRGB[0], +clrRGB[1], +clrRGB[2])};">${Array.from({length: 55}, () => '&nbsp;').join('')}</span><br>\n`);
                            contents.supportHtml = true;
                        }
                    }
                    contents.appendMarkdown(`![](${path})`);
                    item.documentation = contents;
                    return item;
                });
        }
    }
}

function HelpProvider () {
    return {
        provideSignatureHelp(document, position, token, context) {
            const loclang = language === 'zh-tw' ? 'zh-cn' : language,
                  line = document.lineAt(position).text.substring(0, position.character);

            if(line.lastIndexOf('//') >= 0)
                return undefined;

            let i = position.character - 1,
                bracketCount = 0;
            while (i >= 0) {
                const char = line.substring(i, i+1);
                if (char == '(') {
                    if (bracketCount == 0)
                        break;
                }
                else if (char == ')') {
                    bracketCount++;
                }
                i--;
            }

            const nf = line.substring(0, i).match(/(?:\w+)(?=$)/gm);
            if(!nf) 
                return undefined;
            const FunctionName = nf[0];

            if (!(FunctionName in obj_items)) 
                return undefined;
            //if (obj_items[FunctionName].group !== groupFunctions) 
            if (![groupFunctions, groupConstants].includes(obj_items[FunctionName].group)) 
                return undefined;

            const sig = new vscode.SignatureHelp();

            sig.signatures = obj_items[FunctionName].code.map((str) => {
                if(/(?<=\().+(?=\))/.exec(str.label))
                    var jh = /(?<=\().+(?=\))/.exec(str.label)[0].split(',');
                else jh = [str.label];
                const arrParam = jh,
                    paramDescription = obj_items[FunctionName].parameters[loclang] ? obj_items[FunctionName].parameters[loclang] : obj_items[FunctionName].parameters.en,
                    mdSig = new vscode.MarkdownString(`<span style="color:#d19a66;"><i> ${str.description[loclang] ? str.description[loclang] : str.description.en ? str.description.en : ''} </i></span>`);

                mdSig.supportHtml = true;

                const info = new vscode.SignatureInformation(str.label, mdSig);

                info.parameters = arrParam.map((item) => {
                    if(/(?:.*\s)(.+)/g.exec(item))
                        var xc = /(?:.*\s)(.+)/g.exec(item)[1];
                    else xc = item;
                    const npt = xc,
                        reg = /((?:^\w+|^\w+\[\])(?=\s))+(?:  )(.+)/m,
                        prm = paramDescription.find(name =>
                            (reg.exec(name) !== null ? reg.exec(name)[1] : '') == npt
                        ),
                        des = reg.exec(prm) !== null ? reg.exec(prm)[2] : '',
                        r = /(\[)(.+?)(\])(.*)/,
                        md = new vscode.MarkdownString(
                            `<span style="color:#ffd700e6;">${des.replace(r,'$1')}</span><span style="color:#C678DD;">${des.replace(r,'$2')}</span>` +
                            `<span style="color:#ffd700e6;">${des.replace(r,'$3')}</span><span style="color:#05AD97;">${des.replace(r,'$4')}</span>`);
                    md.supportHtml = true;
                    return (new vscode.ParameterInformation(item, md))
                });
                return(info);
            });

            sig.activeSignature = context.triggerKind === 1 || (context.triggerKind === 2 && context.isRetrigger === false) ? 0 : context.activeSignatureHelp.activeSignature;
            let ui = (line.substring(i + 1).match(/(?:\w+|'\w+')(?:,|\s+,)/g) || []).length,
                pr = obj_items[FunctionName].pr;
            
            if(pr > 0)
                if(ui > pr-1)
                    ui = pr-1;
            
            sig.activeParameter = ui;

            return sig;
        }
    }
}

function ColorProvider() {
    return {
        provideDocumentColors(document) {
            const matches = document.getText().matchAll(/\bC'\d{1,3},\d{1,3},\d{1,3}'|\bC'0x[A-Fa-f0-9]{2},0x[A-Fa-f0-9]{2},0x[A-Fa-f0-9]{2}'|\b0x(?:[A-Fa-f0-9]{2})?(?:[A-Fa-f0-9]{6})\b/g),
                ret = Array.from(matches).map(match => {
                    const colorName = match[0];
                    let clrRGB, hx, lr, lx;

                    if (hx = colorName.match(/\b0x(?:[A-Fa-f0-9]{2})?(?:[A-Fa-f0-9]{6})\b/)){                       
                        clrRGB = hexToRgbA(hx[0]);}

                    else if (colorName.includes(`C'`)) {
                        if (lr = colorName.match(/(?<=C')\d{1,3},\d{1,3},\d{1,3}(?=')/)) {
                            clrRGB = lr[0].split(',');
                            clrRGB.push(255);
                        }

                        else if (lx = colorName.match(/(?<=C')0x[A-Fa-f0-9]{2},0x[A-Fa-f0-9]{2},0x[A-Fa-f0-9]{2}(?=')/)) {
                            clrRGB = lx[0].split(',').map(match => parseInt(match));
                            clrRGB.push(255);
                        }
                    }

                    if (clrRGB) {
                        return (new vscode.ColorInformation(new vscode.Range(
                            document.positionAt(match.index),
                            document.positionAt(match.index + match[0].length)
                        ),
                            new vscode.Color(clrRGB[0] / 255, clrRGB[1] / 255, clrRGB[2] / 255, round(clrRGB[3] / 255))));
                    }
                });

            Array.from(document.getText().matchAll(/\w+/g)).filter(x => x in colorW).forEach(item => {

                const rgbCol = colorW[item[0]].split(',');                
                if (rgbCol) {
                    ret.push(new vscode.ColorInformation(new vscode.Range(
                        document.positionAt(item.index),
                        document.positionAt(item.index + item[0].length)
                    ),
                        new vscode.Color(rgbCol[0] / 255, rgbCol[1] / 255, rgbCol[2] / 255, 1)));
                }
            });

            return ret;
        },

        provideColorPresentations(color, context){ 
            const colorName = context.document.getText(context.range),
                red = color.red*255,
                green = color.green*255,
                blue = color.blue*255,
                alpha = color.alpha*255; 

            if(colorName.match(/(?<=\b0x)(?:[A-Fa-f0-9]{2})?(?:[A-Fa-f0-9]{6})\b/)){                
                return [new vscode.ColorPresentation(`0x${rgbaToHex(blue, green, red, round(alpha, 0))}`)];
            }
            else if(colorName.includes(`C'`)) {
                if(colorName.match(/(?<=C')\d{1,3},\d{1,3},\d{1,3}(?=')/)){
                    const clrRGB = `${red},${green},${blue}`;

                    for (let arg in colorW){
                        if (colorW[arg] === clrRGB)
                            return [new vscode.ColorPresentation(arg)];
                        
                    }
                    return [new vscode.ColorPresentation(`C'${clrRGB}'`)];
                }
                else if (colorName.match(/(?<=C')0x[A-Fa-f0-9]{2},0x[A-Fa-f0-9]{2},0x[A-Fa-f0-9]{2}(?=')/)) {
                    return [new vscode.ColorPresentation(`C'${dToHex(red, green, blue)}'`)]
                }
            }
            else if(colorName in colorW) {                
                const clrRGB = `${red},${green},${blue}`;

                for (let arg in colorW){
                    if (colorW[arg] === clrRGB)                       
                        return [new vscode.ColorPresentation(arg)];
                    
                }
                return [new vscode.ColorPresentation(`C'${clrRGB}'`)];
            }
        }
    }
}

function hexToRgbA(hexColor){
    return [
        hexColor & 0xFF, (hexColor >> 8) & 0xFF, (hexColor >> 16) & 0xFF, (hexColor >> 24) & 0xFF ? ((hexColor >> 24) & 0xFF) : 255
    ]
}

function rgbaToHex(red, green, blue, alpha = 255) {
    const rgb = (alpha << 24) | (red << 16) | (green << 8) | (blue << 0);
    return (0x100000000 + rgb).toString(16).slice(alpha == 255 ? 2 : alpha == 0 ? 3 : (alpha < 128 ? 1 : 0));
}

function dToHex(r, g, b) {
    return [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0x0' + hex : '0x' + hex;
    }).join();
}

function round(num, precision = 2) {
	return +(Math.round(num + "e" + precision) + "e" + -precision);
}


module.exports = {
    Hover_log,
    DefinitionProvider,
    Hover_MQL,
    ItemProvider,
    HelpProvider,
    ColorProvider
}
