import { ISharedObject, ISharedObjectEvents } from "@fluidframework/shared-object-base";
import { Serializable } from "@fluidframework/datastore-definitions";


export enum SharedStrictArrayEventType {
    Added = "valuesAdded"
}
export interface ISharedStrictArrayEvents<T extends Serializable> extends ISharedObjectEvents {
    (event: SharedStrictArrayEventType.Added, listener: (value: T[]) => void): any;
}


export interface ISharedStrictArray<T extends Serializable = any> extends ISharedObject<ISharedStrictArrayEvents<T>> {
    /**
     * Retrieves the given key from the map.
     * @param key - Key to retrieve from
     * @returns The stored value, or undefined if the key is not set
     */
    get(): T[];

    /**
     * Appends a values to the array
     * @param values value to append
     * @returns wether the value was successfully appended
     */
    append(values: T[]): Promise<void>;


}