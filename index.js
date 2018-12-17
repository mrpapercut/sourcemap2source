const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const {SourceMapConsumer} = require('source-map');

const argv = require('yargs')
    .usage('Usage: $0 -s [sourcemap file] -o [destination folder]')
    .alias('s', 'sourcemap')
    .describe('s', 'Sourcemap file')
    .demandOption(['sourcemap'])
    .alias('o', 'output')
    .describe('o', 'Output directory')
    .demandOption(['output'])
    .version(false)
    .argv;

class UnmapSourcemap {
    constructor(sourcemap, outputdir) {
        this.sourcemap = sourcemap;
        this.outputdir = outputdir;

        fs.readFile(this.sourcemap, 'utf8', (err, rawSourcemap) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }

            this.parseRawSourcemap(rawSourcemap);
        });
    }

    parseRawSourcemap(rawSourcemap) {
        SourceMapConsumer.with(rawSourcemap, null, consumer => {
            for (let i in consumer.sources) {
                const {filename, folder} = this.parseFilename(consumer.sources[i]);
                const folderOutput = path.join(__dirname, './', this.outputdir, folder);
                const fileOutput = path.join(__dirname, './', this.outputdir, folder, filename);

                mkdirp(folderOutput, err => {
                    if (err) {
                        console.log('Error creating directory:', err);
                    } else {
                        fs.writeFile(fileOutput, consumer.sourceContentFor(consumer.sources[i]), err => {
                            if (err) {
                                console.log('Error creating file:', err);
                            } else {
                                console.log('Written file:', fileOutput);
                            }
                        });
                    }
                });
            }
        });
    }

    parseFilename(filepath) {
        if (filepath.indexOf('webpack:///') === 0) {
            filepath = filepath.replace('webpack:///', './');
        }

        const folder = filepath.split('/').slice(0, -1).join('/');
        const filename = filepath.replace(folder + '/', '');

        return {
            filename,
            folder
        };
    }
}

if (argv.sourcemap && argv.output) {
    try {
        if (!fs.existsSync(argv.sourcemap)) {
            throw new Error(`File ${argv.sourcemap} does not exist or is not readable`);
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }

    new UnmapSourcemap(argv.sourcemap, argv.output);
}
