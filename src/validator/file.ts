import { Validator } from "./validator";

export class File extends Validator{
    public getDescription(): string {
        return 'File is not valid';
    }

    /**
     * NOT MUCH RIGHT NOW.
     *
     * TODO think what to do here, currently only used for parameter to be present in SDKs
     *
     * @param name
     * @return boolean
     */
    public isValid(name: any): boolean {
        return true;
    }

    /**
     * Is array
     *
     * Function will return true if object is array.
     *
     * @return boolean
     */
    public isArray(): boolean {
        return false;
    }

    /**
     * Get Type
     *
     * Returns validator type.
     *
     * @return string
     */
    public getType(): string {
        return 'string';
    }
}