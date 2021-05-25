import TinyliciousClient, { TinyliciousConnectionConfig } from "@fluid-experimental/tinylicious-client";
import { ContainerSchema } from "@fluid-experimental/fluid-static";

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

