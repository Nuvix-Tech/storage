import { Validator } from '../../src/validator/validator';

// Concrete implementation for testing
class TestValidator extends Validator {
    async isValid(value: any): Promise<boolean> {
        return typeof value === 'string';
    }
}

describe('Validator Base Class', () => {
    let validator: TestValidator;

    beforeEach(() => {
        validator = new TestValidator();
    });

    describe('Constants', () => {
        test('should have correct type constants', () => {
            expect(Validator.TYPE_STRING).toBe('string');
            expect(Validator.TYPE_ARRAY).toBe('array');
            expect(Validator.TYPE_INTEGER).toBe('integer');
            expect(Validator.TYPE_BOOLEAN).toBe('boolean');
        });
    });

    describe('Abstract Implementation', () => {
        test('should implement isValid method', async () => {
            expect(await validator.isValid('test')).toBe(true);
            expect(await validator.isValid(123)).toBe(false);
            expect(await validator.isValid(null)).toBe(false);
            expect(await validator.isValid(undefined)).toBe(false);
        });

        test('should be extendable', () => {
            expect(validator).toBeInstanceOf(Validator);
            expect(typeof validator.isValid).toBe('function');
        });
    });

    describe('Type System', () => {
        test('should provide type constants for validation', () => {
            const types = [
                Validator.TYPE_STRING,
                Validator.TYPE_ARRAY,
                Validator.TYPE_INTEGER,
                Validator.TYPE_BOOLEAN
            ];

            types.forEach(type => {
                expect(typeof type).toBe('string');
                expect(type.length).toBeGreaterThan(0);
            });
        });
    });
});
