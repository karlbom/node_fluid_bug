
import { SharedObject, ValueType } from "@fluidframework/shared-object-base";
import { ISharedStrictArrayEvents, ISharedStrictArray } from "./interfaces";
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

import { StrictArrayFactory } from "./factory";
import { IFluidSerializer } from "@fluidframework/core-interfaces";
import * as uuid from "uuid";

interface ISharedStrictArraySnapshotFormat {
    // The value of the counter
    values: any[];
    lastSeenSequenceNumber: number;
}

interface IAppendOperation {
    // The type of the value
    type: "append";

    // The actual value
    value: any;

    id: string

    // last seen sequence number
    lastSeenSequenceNumber: number
}
const snapshotFileName = "shared_strict_array";

type PendingResolve = (value: IAppendOperation | undefined) => void;

export class SharedStrictArray<T extends Serializable = any> extends SharedObject<ISharedStrictArrayEvents<T>>
    implements ISharedStrictArray<T> {



    public static getFactory(): IChannelFactory {
		return new StrictArrayFactory();
	}
    /**
     * The data array held by this dds.
     */
    private data: T[] = [];

    private lastSeenSequenceNumber: number = -1

    private activePush: { id: string, resolve: any, reject: any } | undefined;


    protected snapshotCore(serializer: IFluidSerializer): ITree {
        // Get a serializable form of data
        const content: ISharedStrictArraySnapshotFormat = {
            // store the array
            values: this.data,
            // store the last seen sequence number as well so we can continue tracking new ops if we restore 
            // from a snapshot
            lastSeenSequenceNumber: this.lastSeenSequenceNumber
        };

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
        const content = await readAndParse<ISharedStrictArraySnapshotFormat>(services, snapshotFileName);

        this.data = content.values;
        this.lastSeenSequenceNumber = content.lastSeenSequenceNumber;
    }
    protected registerCore() {
        // throw new Error("Method not implemented.");
    }
    protected processCore(message: ISequencedDocumentMessage, local: boolean, localOpMetadata: unknown) {
        if (message.type === MessageType.Operation && message.sequenceNumber>this.lastSeenSequenceNumber) {
            const op = message.contents as IAppendOperation;

            // apply operation only if it references the correct previous operation
            if (this.lastSeenSequenceNumber === op.lastSeenSequenceNumber) {
                switch (op.type) {
                    case "append":
                        this.appendCore(op);
                        break;

                    default:
                        throw new Error("Unknown operation");
                }
                if(this.activePush){
                    if (this.activePush.id === op.id) {
                        this.activePush.resolve();
                        this.activePush = undefined;
                    } else {
                        this.activePush.reject(new Error("Not at head"));
                        this.activePush = undefined;
                    }
                }
                
            } 
            // update the last sequence number we have seen after processing
            this.lastSeenSequenceNumber = message.sequenceNumber;
        }
        // if (local) {
        //     // Resolve the pending promise for this operation now that we have received an ack for it.
        //     const resolve = localOpMetadata as PendingResolve;
        //     const op = message.contents as IAppendOperation;
        //     resolve(op);
        // }

    }

    protected appendCore(op: IAppendOperation) {
        this.data?.push(op.value);
    }
    protected onDisconnect() {
        console.log(`SharedStrictArray ${this.id} is now disconnected`);
    }
    protected applyStashedOp(content: any): unknown {
        throw new Error("Method not implemented.");
    }
    get(): T[] {
        return this.data;
    }

    public async sendAndWaitForConfirmation(message: IAppendOperation) {
        if (!this.isAttached()) {
            throw new Error("Not attached.");
        }

        //wait until we know the server has accepted the message
        // await this.newAckBasedPromise<IAppendOperation | undefined>((resolve) => {
        //     // Send the resolve function as the localOpMetadata. This will be provided back to us when the
        //     // op is ack'd.
        //     this.submitLocalMessage(message, resolve);
        //     // If we fail due to runtime being disposed, it's better to return undefined then unhandled exception.
        // });
        // return a promise that resolves once we process the request and it is a valid op, otherwise the 
        return new Promise<void>((resolve, reject) => {
            this.activePush = { id: message.id, resolve, reject };
            this.submitLocalMessage(message);
        });
    }
    append(value: T): Promise<void> {
        if (this.activePush !== undefined) {
            return Promise.reject(new Error("Already have a pending push"))
        }
        const op: IAppendOperation = {
            lastSeenSequenceNumber: this.lastSeenSequenceNumber,
            type: "append",
            value,
            id: uuid.v4()
        };

        return this.sendAndWaitForConfirmation(op);
    }
    owner?: string | undefined;

    /**
* Create a new strict array
*
* @param runtime - data store runtime the new shared map belongs to
* @param id - optional name of the shared map
* @returns newly create shared strict array (but not attached yet)
*/
    public static create(runtime: IFluidDataStoreRuntime, id?: string) {
        return runtime.createChannel(id, StrictArrayFactory.Type) as SharedStrictArray;
    }


}