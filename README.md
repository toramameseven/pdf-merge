# merge-pdf README

Visual Studio Code extension to easily merge pdf files. If you have the [pdftk][pdftk], you can add bookmark to a pdf file.

## Features

- Merge pdf files
- Add bookmark(you need th pdftk)
- For windows 10 and later.


## Usage

### normal usage

1. create a merge settings file. The file should end with `.pdfm`.
    
    sample.pdfm
    ```
    pdffile001.pdf
    pdffile002.pdf
    pdffile003.pdf
    ```
2. These pdf file are in the same folder with a `sample.pdfm`.
3. Right click in the editor, and select `MergePdf:Merge(no bookmark)`.
4. You get a merged pdf file, `sample.pdfm.pdf`.
5. If you installed the pdftk and select `MergePdf:Merge`, you will get a pdf file with bookmark.There are pdf filenames as bookmarks.

### add custom bookmark

1. To add bookmark, you set bookmark to `pdfm` file.

    sample.pdfm
    ```
    pdffile001.pdf|bookmark001
    pdffile002.pdf|
    pdffile003.pdf|bookmark002

    this is a comment line. (the line with no pdf filename is a comment line.)
    ```
    - pdffile002.pdf has only `|`, so no bookmark.

## Configuration

### merge-pdf.pdftk

- pdftk binary full path. end with .exe
- example: `C:\Program Files (x86)\PDFtk Server\bin\pdftk.exe`

### merge-pdf.pdftk-timeout

- pdftk timeout: ms. Default value is 60000 ms.

## Release Notes

### 0.0.1

first release.


[pdftk]:https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/

