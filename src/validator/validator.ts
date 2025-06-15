
export abstract class Validator {
    static TYPE_STRING = 'string';
    static TYPE_ARRAY = 'array';
    static TYPE_INTEGER = 'integer';
    static TYPE_BOOLEAN = 'boolean';

    abstract isValid(value: any): boolean | Promise<boolean>;
}