## The MQL Tools extension adds language support for MQL (MetaQuotes Language) to VS Code, including functions:
#
### 1.  Checking the syntax of mqh/mq4/mq5 files (without compilation).

### 2.  Compilation of mq4/mq5 files.

### 3.  Compilation of mq4/mq5 files using script.
The script opens the file "mq4/mq5" in the "MetaEditor" and clicks the "Compile" button, thus MT4/MT5 is automatically updated. (`The idea is taken` [from here](https://www.mql5.com/en/blogs/post/719548/page2#comment_16501434)).

![](https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/images/Mql_comp.jpg)

### 4. Opening the MQL help.
To find the word you need in the MQL help, put the cursor on it or highlight it and then press F1.

### 5. In the explorer context menu, added items: 
- "Open in 'MetaEditor'"
- "Show/hide ex4/ex5 files" 
- "Insert MQH as #include"

    ![](https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/images/InsertInclude+.gif)

- "Insert the file name 'mq4/mq5' in 'mqh'"

    (When working with the "mqh" file, in order not to switch to the "mq4/mq5" file window during compilation, you should write the name of the "mq4/mq5" file on the first line. Example: //###<Experts/Examples/MACD Sample.mq5>).

    ![](https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/images/InsertMQH.gif)


### 6. Creating a comment for a function.
![](https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/images/CreateComment.gif)

### 7. Visualizing and modify mql colors.

![](https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/images/ColorsMql+.jpg)

### 8.  Autocomplete of entering names of variables, constants and MQL5 functions.

### 9.  Displaying information about mql5 function when hovers show the mouse cursor over its name.

### 10.  MQL syntax highlighting.


#
### Quick Setup Guide: 

1. Open the folder with MQL files in VSCode. Example: C:\Users\<your name>\AppData\Roaming\MetaQuotes\Terminal\D2E7219F73C8BF37CD8BF550E55FF075\MQL5. (`The folder must be named MQL4 or MQL5! This is important!!!`)

2. Specify the path to MetaEditor in the extension settings and, if necessary, the path to "Include" files.
3. Create a settings file "settings.json". Press `Ctrl+Shift+P` to open the command palette, select `"MQL: Create configuration"`.

    ![](https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/images/Settings.jpg)

    
4. If you wish, you can set icons for MQL files. Press  `Ctrl+Shift+P` to open the command palette, select `"MQL: Add icons to the theme"`, then select a theme to which icons will be added (icons can be added only to certain 4 themes).

   ![](https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/images/Icons5.jpg)  ![](https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/images/Icons4.jpg)
