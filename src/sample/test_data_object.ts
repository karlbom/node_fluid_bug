import { DataObject, DataObjectFactory } from "@fluidframework/aqueduct";
import { ConsensusQueue, IOrderedCollection } from "@fluidframework/ordered-collection"
import { IEvent } from "@fluidframework/common-definitions";
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SampleDDS } from "./dds";


export class TestDataObject extends DataObject {
    dds: SampleDDS | undefined;

    public static get Name() { return "SampleDDS"; }
    public static readonly factory =
        new DataObjectFactory<TestDataObject, object, undefined, IEvent>(
            TestDataObject.Name,
            TestDataObject,
            [
                SampleDDS.getFactory()
            ],
            {},
        );
    public static getFactory() { return this.factory; }


    protected async initializingFirstTime() {
        const queue = SampleDDS.create(this.runtime);
        this.root.set("queue", queue.handle);
    }

    init() {
        this.dds!.foo();
    }

    protected async hasInitialized() {
        // Create local references to the SharedMaps.
        // Otherwise, they need to be called async which is inconvenient.
        this.dds = await this.root.get<IFluidHandle<SampleDDS>>('queue')!.get();
        console.log("data object initialized")

    }

}



import { ContainerRuntimeFactoryWithDefaultDataStore } from "@fluidframework/aqueduct";



export const SampleDataObjectContainerRuntimeFactory = new ContainerRuntimeFactoryWithDefaultDataStore(
    TestDataObject.getFactory(),
    new Map([
        [TestDataObject.Name, Promise.resolve(TestDataObject.getFactory())],
    ]),
);

