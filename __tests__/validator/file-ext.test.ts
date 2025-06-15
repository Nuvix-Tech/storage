import { FileExt } from '../../src/validator/file-ext';
import { Validator } from '../../src/validator/validator';

describe('FileExt Validator', () => {
    describe('Constants', () => {
        test('should have correct file type constants', () => {
            expect(FileExt.TYPE_JPEG).toBe('jpeg');
            expect(FileExt.TYPE_JPG).toBe('jpg');
            expect(FileExt.TYPE_GIF).toBe('gif');
            expect(FileExt.TYPE_PNG).toBe('png');
            expect(FileExt.TYPE_GZIP).toBe('gz');
            expect(FileExt.TYPE_ZIP).toBe('zip');
        });
    });

    describe('Constructor', () => {
        test('should create validator with allowed extensions', () => {
            const allowedExts = ['jpg', 'png', 'gif'];
            const validator = new FileExt(allowedExts);
            expect(validator).toBeInstanceOf(FileExt);
            expect(validator).toBeInstanceOf(Validator);
        });

        test('should accept empty array', () => {
            const validator = new FileExt([]);
            expect(validator).toBeInstanceOf(FileExt);
        });

        test('should accept single extension', () => {
            const validator = new FileExt(['pdf']);
            expect(validator).toBeInstanceOf(FileExt);
        });
    });

    describe('Basic Properties', () => {
        let validator: FileExt;

        beforeEach(() => {
            validator = new FileExt(['jpg', 'png', 'gif']);
        });

        test('should return correct description', () => {
            expect(validator.getDescription()).toBe('File extension is not valid');
        });

        test('should return correct type', () => {
            expect(validator.getType()).toBe('string');
        });

        test('should not be array type', () => {
            expect(validator.isArray()).toBe(false);
        });
    });

    describe('Validation Logic', () => {
        describe('Image Files', () => {
            let imageValidator: FileExt;

            beforeEach(() => {
                imageValidator = new FileExt(['jpg', 'jpeg', 'png', 'gif', 'webp']);
            });

            test('should validate allowed image extensions', () => {
                expect(imageValidator.isValid('photo.jpg')).toBe(true);
                expect(imageValidator.isValid('image.jpeg')).toBe(true);
                expect(imageValidator.isValid('logo.png')).toBe(true);
                expect(imageValidator.isValid('animation.gif')).toBe(true);
                expect(imageValidator.isValid('modern.webp')).toBe(true);
            });

            test('should reject disallowed extensions', () => {
                expect(imageValidator.isValid('document.pdf')).toBe(false);
                expect(imageValidator.isValid('video.mp4')).toBe(false);
                expect(imageValidator.isValid('text.txt')).toBe(false);
                expect(imageValidator.isValid('archive.zip')).toBe(false);
            });

            test('should be case insensitive', () => {
                expect(imageValidator.isValid('photo.JPG')).toBe(true);
                expect(imageValidator.isValid('image.JPEG')).toBe(true);
                expect(imageValidator.isValid('logo.PNG')).toBe(true);
                expect(imageValidator.isValid('animation.GIF')).toBe(true);
                expect(imageValidator.isValid('modern.WEBP')).toBe(true);
            });

            test('should handle mixed case', () => {
                expect(imageValidator.isValid('photo.JpG')).toBe(true);
                expect(imageValidator.isValid('image.JpEg')).toBe(true);
                expect(imageValidator.isValid('logo.PnG')).toBe(true);
                expect(imageValidator.isValid('animation.GiF')).toBe(true);
            });
        });

        describe('Document Files', () => {
            let docValidator: FileExt;

            beforeEach(() => {
                docValidator = new FileExt(['pdf', 'doc', 'docx', 'txt', 'rtf']);
            });

            test('should validate allowed document extensions', () => {
                expect(docValidator.isValid('document.pdf')).toBe(true);
                expect(docValidator.isValid('letter.doc')).toBe(true);
                expect(docValidator.isValid('report.docx')).toBe(true);
                expect(docValidator.isValid('readme.txt')).toBe(true);
                expect(docValidator.isValid('formatted.rtf')).toBe(true);
            });

            test('should reject non-document files', () => {
                expect(docValidator.isValid('image.jpg')).toBe(false);
                expect(docValidator.isValid('video.mp4')).toBe(false);
                expect(docValidator.isValid('audio.mp3')).toBe(false);
                expect(docValidator.isValid('archive.zip')).toBe(false);
            });
        });

        describe('Archive Files', () => {
            let archiveValidator: FileExt;

            beforeEach(() => {
                archiveValidator = new FileExt(['zip', 'gz', 'tar', 'rar', '7z']);
            });

            test('should validate allowed archive extensions', () => {
                expect(archiveValidator.isValid('archive.zip')).toBe(true);
                expect(archiveValidator.isValid('compressed.gz')).toBe(true);
                expect(archiveValidator.isValid('backup.tar')).toBe(true);
                expect(archiveValidator.isValid('files.rar')).toBe(true);
                expect(archiveValidator.isValid('data.7z')).toBe(true);
            });
        });

        describe('Multiple Extensions', () => {
            let multiValidator: FileExt;

            beforeEach(() => {
                multiValidator = new FileExt(['jpg', 'png', 'pdf', 'zip']);
            });

            test('should validate any allowed extension', () => {
                expect(multiValidator.isValid('image.jpg')).toBe(true);
                expect(multiValidator.isValid('logo.png')).toBe(true);
                expect(multiValidator.isValid('document.pdf')).toBe(true);
                expect(multiValidator.isValid('archive.zip')).toBe(true);
            });

            test('should reject disallowed extensions', () => {
                expect(multiValidator.isValid('video.mp4')).toBe(false);
                expect(multiValidator.isValid('audio.mp3')).toBe(false);
                expect(multiValidator.isValid('text.txt')).toBe(false);
                expect(multiValidator.isValid('document.doc')).toBe(false);
            });
        });
    });

    describe('Edge Cases', () => {
        let validator: FileExt;

        beforeEach(() => {
            validator = new FileExt(['txt', 'pdf']);
        });

        test('should handle files without extensions', () => {
            expect(validator.isValid('README')).toBe(false);
            expect(validator.isValid('Makefile')).toBe(false);
            expect(validator.isValid('Dockerfile')).toBe(false);
        });

        test('should handle files with multiple dots', () => {
            expect(validator.isValid('file.backup.txt')).toBe(true);
            expect(validator.isValid('data.min.js')).toBe(false); // js not allowed
            expect(validator.isValid('archive.tar.gz')).toBe(false); // gz not allowed in this test
        });

        test('should handle empty strings', () => {
            expect(validator.isValid('')).toBe(false);
        });

        test('should handle strings with only dots', () => {
            expect(validator.isValid('.')).toBe(false);
            expect(validator.isValid('..')).toBe(false);
            expect(validator.isValid('...')).toBe(false);
        });

        test('should handle files starting with dots', () => {
            expect(validator.isValid('.hidden.txt')).toBe(true);
            expect(validator.isValid('.gitignore')).toBe(false); // no extension
            expect(validator.isValid('.env.txt')).toBe(true);
        });

        test('should handle very long extensions', () => {
            const longExt = 'a'.repeat(100);
            const validatorWithLongExt = new FileExt([longExt]);
            expect(validatorWithLongExt.isValid(`file.${longExt}`)).toBe(true);
        });

        test('should handle unicode in filenames', () => {
            expect(validator.isValid('файл.txt')).toBe(true);
            expect(validator.isValid('文件.pdf')).toBe(true);
            expect(validator.isValid('ファイル.txt')).toBe(true);
        });

        test('should handle special characters in filenames', () => {
            expect(validator.isValid('file-name.txt')).toBe(true);
            expect(validator.isValid('file_name.pdf')).toBe(true);
            expect(validator.isValid('file name.txt')).toBe(true);
            expect(validator.isValid('file@name.pdf')).toBe(true);
        });
    });

    describe('Empty Allowed Extensions', () => {
        let strictValidator: FileExt;

        beforeEach(() => {
            strictValidator = new FileExt([]);
        });

        test('should reject all files when no extensions allowed', () => {
            expect(strictValidator.isValid('file.txt')).toBe(false);
            expect(strictValidator.isValid('image.jpg')).toBe(false);
            expect(strictValidator.isValid('document.pdf')).toBe(false);
            expect(strictValidator.isValid('README')).toBe(false);
        });
    });

    describe('Using Predefined Constants', () => {
        test('should work with predefined constants', () => {
            const imageValidator = new FileExt([
                FileExt.TYPE_JPEG,
                FileExt.TYPE_JPG,
                FileExt.TYPE_PNG,
                FileExt.TYPE_GIF
            ]);

            expect(imageValidator.isValid('photo.jpeg')).toBe(true);
            expect(imageValidator.isValid('image.jpg')).toBe(true);
            expect(imageValidator.isValid('logo.png')).toBe(true);
            expect(imageValidator.isValid('animation.gif')).toBe(true);
        });

        test('should work with archive constants', () => {
            const archiveValidator = new FileExt([
                FileExt.TYPE_ZIP,
                FileExt.TYPE_GZIP
            ]);

            expect(archiveValidator.isValid('archive.zip')).toBe(true);
            expect(archiveValidator.isValid('compressed.gz')).toBe(true);
            expect(archiveValidator.isValid('image.jpg')).toBe(false);
        });
    });
});
