import { SampleDataObjectContainerRuntimeFactory, TestDataObject } from './sample/test_data_object'
import { getContainer, BackendType } from './sample/init'
import { getDefaultObjectFromContainer } from "@fluidframework/aqueduct";
import { v4 } from 'uuid';


async function launch() {

    // const backend = BackendType.ROUTERLICIOUS;
    const backend = BackendType.TINYLICIOUS;
    const documentId = v4();
    const container = await getContainer(documentId, SampleDataObjectContainerRuntimeFactory, true, backend);
    const queue = await getDefaultObjectFromContainer<TestDataObject>(container);


    await new Promise(r => setTimeout(r, 1000));
    console.log("first connected:", queue.dds!.connected);

    const container2 = await getContainer(documentId, SampleDataObjectContainerRuntimeFactory, false, backend);
    const queue2 = await getDefaultObjectFromContainer<TestDataObject>(container2);

    await new Promise(r => setTimeout(r, 1000));
    console.log("second connected:", queue2.dds!.connected);
    //both dds in the data object are connected on tinylicious, if we use the routerlicious backend the second dds is never connected
}

launch();