// obfuscate.js
const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Direktori sumber (kode yang sudah di-compile)
const sourceDir = path.join(__dirname, 'build');
// Direktori tujuan (tempat menyimpan kode ter-obfuskasi)
const outputDir = path.join(__dirname, 'server');

// Fungsi untuk membaca semua file secara rekursif
function walkSync(dir, filelist = []) {
    const files = fs.readdirSync(dir);
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        } else {
            // Hanya proses file JavaScript
            if (file.endsWith('.js')) {
                filelist.push(path.join(dir, file));
            }
        }
    });
    return filelist;
}

// Opsi obfuskasi (bisa dikonfigurasi sesuai kebutuhan)
const obfuscationOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersType: 'variable',
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersChainedCalls: true,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
};

// Proses semua file
const fileList = walkSync(sourceDir);

fileList.forEach(filePath => {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Obfuscate konten file
    const obfuscationResult = JavaScriptObfuscator.obfuscate(fileContent, obfuscationOptions);

    // Dapatkan path relatif untuk membuat struktur folder yang sama di output
    const relativePath = path.relative(sourceDir, filePath);
    const outputPath = path.join(outputDir, relativePath);
    const outputDirPath = path.dirname(outputPath);

    // Buat direktori jika belum ada
    if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
    }

    // Tulis file yang sudah di-obfuskasi
    fs.writeFileSync(outputPath, obfuscationResult.getObfuscatedCode());
});

console.log(`Obfuscation complete! ${fileList.length} files processed.`);
console.log(`Output directory: ${outputDir}`);