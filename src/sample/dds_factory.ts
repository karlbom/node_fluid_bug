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


import { SampleDDS } from "./dds";


/**
 * The factory that defines the map
 */
export class SampleFactory implements IChannelFactory {
    public static readonly Type = "SampleDDS";

    public static readonly Attributes: IChannelAttributes = {
        type: SampleFactory.Type,
        snapshotFormatVersion: "0.1",
        packageVersion: "0.0.1",
    };

    public get type() {
        return SampleFactory.Type;
    }

    public get attributes() {
        return SampleFactory.Attributes;
    }

    /**
     * {@inheritDoc @fluidframework/datastore-definitions#IChannelFactory.load}
     */
    public async load(
        runtime: IFluidDataStoreRuntime,
        id: string,
        services: IChannelServices,
        attributes: IChannelAttributes): Promise<SampleDDS> {
        const dds = new SampleDDS(id, runtime, attributes);
        await dds.load(services);
        return dds;
    }

    public create(document: IFluidDataStoreRuntime, id: string): SampleDDS {
        const dds = new SampleDDS(id, document, this.attributes);
        dds.initializeLocal();
        return dds;
    }
}