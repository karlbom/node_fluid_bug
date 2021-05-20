import TinyliciousClient, { TinyliciousConnectionConfig } from "@fluid-experimental/tinylicious-client";
import { ContainerSchema, FluidContainer } from "@fluid-experimental/fluid-static";

export {FluidContainer};

export enum BackendType {
    TINYLICIOUS,
    ROUTERLICIOUS,
    FRS
}
export async function getContainer(documentId: string, containerSchema: ContainerSchema, newContainer: boolean, backend: BackendType) {
    switch (backend) {
        case BackendType.TINYLICIOUS:
            const config: TinyliciousConnectionConfig = { port: 7070 };
            TinyliciousClient.init(config);
            if (newContainer)
                await TinyliciousClient.createContainer({ id: documentId }, containerSchema);
            return TinyliciousClient.getContainer({ id: documentId }, containerSchema);
        default:
            throw Error("Backend not yet supported")
    }

}


// async function createTinyliciousContainer( serviceContainerConfig: TinyliciousContainerConfig,
//     containerSchema: ContainerSchema,){
//     const runtimeFactory = new DOProviderContainerRuntimeFactory(
//         containerSchema,
//     );
//     const container = await this.getContainerCore(
//         serviceContainerConfig.id,
//         runtimeFactory,
//         true,
//     );
//     const rootDataObject = (await container.request({ url: "/" })).value;
//     return rootDataObject as FluidContainer;
// }

