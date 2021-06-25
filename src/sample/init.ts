//import TinyliciousClient, { TinyliciousConnectionConfig } from "@fluid-experimental/tinylicious-client";
import { RouterliciousDocumentServiceFactory } from "@fluidframework/routerlicious-driver";
import { getContainer as getFluidContainer, } from "@fluid-experimental/get-container";
import { InsecureTinyliciousUrlResolver } from "@fluidframework/tinylicious-driver";
import { InsecureTinyliciousTokenProvider } from "@fluidframework/tinylicious-driver";
import { IRuntimeFactory } from "@fluidframework/container-definitions";
import { RouterliciousService } from '@fluid-experimental/get-container';

import * as jwt from 'jsonwebtoken';

export enum BackendType {
    TINYLICIOUS,
    ROUTERLICIOUS,
    FRS
}
export async function getContainer(documentId: string, containerRuntimeFactory: IRuntimeFactory, newContainer: boolean, backend: BackendType) {
    switch (backend) {
        case BackendType.TINYLICIOUS:
            const tokenProvider = new InsecureTinyliciousTokenProvider();
            const documentServiceFactory = new RouterliciousDocumentServiceFactory(tokenProvider);


            const urlResolver = new InsecureTinyliciousUrlResolver(7070, "http://localhost");
            const containerService = {
                documentServiceFactory,
                urlResolver,
            };
            return getFluidContainer(
                containerService,
                documentId,
                containerRuntimeFactory,
                newContainer,
            );
        case BackendType.ROUTERLICIOUS: {


            const serviceRouter = new RouterliciousService({
                orderer: "http://localhost:3003",
                storage: "http://localhost:3001",
                tenantId: "local",
                key: "43cfc3fbf04a97c0921fd23ff10f9e4b",
            });

            return getFluidContainer(
                serviceRouter,
                documentId,
                containerRuntimeFactory,
                newContainer
            );
        }
        default:
            throw Error("Backend not yet supported")
    }
}

