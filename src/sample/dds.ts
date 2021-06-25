
import { SharedObject, ValueType } from "@fluidframework/shared-object-base";

import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelStorageService,
    IChannelFactory,
    Serializable,
} from "@fluidframework/datastore-definitions";
import { readAndParse } from "@fluidframework/driver-utils";
import {
    FileMode,
    ISequencedDocumentMessage,
    ITree,
    MessageType,
    TreeEntry,
} from "@fluidframework/protocol-definitions";

import { SampleFactory } from "./dds_factory";
import { IFluidSerializer } from "@fluidframework/core-interfaces";

import { ISharedObject, ISharedObjectEvents } from "@fluidframework/shared-object-base";



export enum SampleEventType {
    Append = "valuesChanged"
}
export interface ISharedStrictArrayEvents<T extends Serializable> extends ISharedObjectEvents {
    (event: SampleEventType.Append, listener: (value: T[]) => void): any;
}

const snapshotFileName = "sample_dds_snapshot";

export class SampleDDS<T extends Serializable = any> extends SharedObject<ISharedStrictArrayEvents<T>>
{
    public static getFactory(): IChannelFactory {
        return new SampleFactory();
    }
    /**
     * The data array held by this dds.
     */



    protected snapshotCore(serializer: IFluidSerializer): ITree {
        // Get a serializable form of data
        const content = ""

        // And then construct the tree for it
        const tree: ITree = {
            entries: [
                {
                    mode: FileMode.File,
                    path: snapshotFileName,
                    type: TreeEntry.Blob,
                    value: {
                        contents: JSON.stringify(content),
                        encoding: "utf-8",
                    },
                },
            ],
        };

        return tree;
    }
    protected async loadCore(services: IChannelStorageService): Promise<void> {

    }

    foo() {
        this.submitLocalMessage("TESTOP");
    }
    protected registerCore() {
        // throw new Error("Method not implemented.");
    }
    protected processCore(message: ISequencedDocumentMessage, local: boolean, localOpMetadata: unknown) {
        // if (message.type === MessageType.Operation && message.sequenceNumber > this.lastSeenSequenceNumber) {
        //     const op = message.contents as IAppendOperation;

        //     // apply operation only if it references the correct previous operation
        //     if (this.lastSeenSequenceNumber === op.lastSeenSequenceNumber) {
        //         switch (op.type) {
        //             case "append":
        //                 this.appendCore(op);
        //                 break;

        //             default:
        //                 throw new Error("Unknown operation");
        //         }
        //         if (this.activePush) {
        //             if (this.activePush.id === op.id) {
        //                 this.activePush.resolve();
        //             } else {
        //                 this.activePush.reject(new Error("Not at head"));
        //             }
        //             this.activePush = undefined;
        //         }

        //     }
        //     // update the last sequence number we have seen after processing
        //     this.lastSeenSequenceNumber = message.sequenceNumber;
        // }
    }

    protected onConnect() {
        console.log("Sample Object connected!");
    }
    protected onDisconnect() {
        console.log(`Sample Object ${this.id} is now disconnected`);
    }
    protected applyStashedOp(content: any): unknown {
        throw new Error("Method not implemented.");
    }


    /**
* Create a new strict array
*
* @param runtime - data store runtime the new shared map belongs to
* @param id - optional name of the shared map
* @returns newly create shared strict array (but not attached yet)
*/
    public static create(runtime: IFluidDataStoreRuntime, id?: string) {
        return runtime.createChannel(id, SampleFactory.Type) as SampleDDS;
    }


}