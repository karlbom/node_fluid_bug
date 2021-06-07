/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelServices,
    IChannelFactory,
} from "@fluidframework/datastore-definitions";
import { SharedStrictArray } from "./strict_arrray";
import { ISharedStrictArray } from "./interfaces";


/**
 * The factory that defines the map
 */
export class StrictArrayFactory implements IChannelFactory {
    public static readonly Type = "StrictArray";

    public static readonly Attributes: IChannelAttributes = {
        type: StrictArrayFactory.Type,
        snapshotFormatVersion: "0.1",
        packageVersion: "0.0.1",
    };

    public get type() {
        return StrictArrayFactory.Type;
    }


    
    public get attributes() {
        return StrictArrayFactory.Attributes;
    }

    /**
     * {@inheritDoc @fluidframework/datastore-definitions#IChannelFactory.load}
     */
    public async load(
        runtime: IFluidDataStoreRuntime,
        id: string,
        services: IChannelServices,
        attributes: IChannelAttributes): Promise<ISharedStrictArray> {
        const array = new SharedStrictArray(id, runtime, attributes);
        await array.load(services);
        return array;
    }

    public create(document: IFluidDataStoreRuntime, id: string): ISharedStrictArray {
        const array = new SharedStrictArray(id, document, this.attributes);
        array.initializeLocal();
        return array;
    }
}