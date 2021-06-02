import { ContainerRuntimeFactoryWithDefaultDataStore } from "@fluidframework/aqueduct";

import { CommandQueue } from "./dataObject";

export const CommandQueueContainerRuntimeFactory = new ContainerRuntimeFactoryWithDefaultDataStore(
    CommandQueue.getFactory(),
    new Map([
        [CommandQueue.Name, Promise.resolve(CommandQueue.getFactory())],
    ]),
);
