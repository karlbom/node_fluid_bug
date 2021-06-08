import { SharedStrictArray } from "./../src/simple_dds/strict_arrray"
import { SharedStrictArrayEventType } from "./../src/simple_dds/interfaces"
import { expect } from "chai";
import { LocalDeltaConnectionServer, ILocalDeltaConnectionServer } from "@fluidframework/server-local-server";
import { IFluidCodeDetails } from "@fluidframework/core-interfaces";
import { IUrlResolver } from "@fluidframework/driver-definitions";
import {
    createAndAttachContainer,
    createLoader,
    OpProcessingController,
    ITestFluidObject,
    TestFluidObjectFactory,
} from "@fluidframework/test-utils";
import { LocalResolver, LocalDocumentServiceFactory } from "@fluidframework/local-driver";
import { requestFluidObject } from "@fluidframework/runtime-utils";
import { IContainer, IHostLoader, ILoaderOptions } from "@fluidframework/container-definitions";


describe("Strict Array", () => {
    const documentId = "localServerTest";
    const documentLoadUrl = `fluid-test://localhost/${documentId}`;
    const propertyDdsId = "SharedArray";
    const codeDetails: IFluidCodeDetails = {
        package: "localServerTestPackage",
        config: {},
    };
    const factory = new TestFluidObjectFactory([[propertyDdsId, SharedStrictArray.getFactory()]]);

    let deltaConnectionServer: ILocalDeltaConnectionServer;
    let urlResolver: LocalResolver;
    let opProcessingController: OpProcessingController;
    let container1: IContainer;
    let container2: IContainer;
    let dataObject1: ITestFluidObject;
    let dataObject2: ITestFluidObject;
    let sharedArray1: SharedStrictArray;
    let sharedArray2: SharedStrictArray;

    function createLocalLoader(
        packageEntries: Iterable<[IFluidCodeDetails, TestFluidObjectFactory]>,
        localDeltaConnectionServer: ILocalDeltaConnectionServer,
        localUrlResolver: IUrlResolver,
        options?: ILoaderOptions,
    ): IHostLoader {
        const documentServiceFactory = new LocalDocumentServiceFactory(localDeltaConnectionServer);

        return createLoader(packageEntries, documentServiceFactory, localUrlResolver, undefined, options);
    }

    async function createContainer(): Promise<IContainer> {
        const loader = createLocalLoader([[codeDetails, factory]], deltaConnectionServer, urlResolver);
        return createAndAttachContainer(codeDetails, loader, urlResolver.createCreateNewRequest(documentId));
    }

    async function loadContainer(): Promise<IContainer> {
        const loader = createLocalLoader([[codeDetails, factory]], deltaConnectionServer, urlResolver);
        return loader.resolve({ url: documentLoadUrl });
    }

    describe("Local state", () => {
        beforeEach(async () => {
            deltaConnectionServer = LocalDeltaConnectionServer.create();
            urlResolver = new LocalResolver();

            // Create a Container for the first client.
            container1 = await createContainer();
            dataObject1 = await requestFluidObject<ITestFluidObject>(container1, "default");
            sharedArray1 = await dataObject1.getSharedObject<SharedStrictArray>(propertyDdsId);

            // Load the Container that was created by the second client.
            container2 = await loadContainer();
            dataObject2 = await requestFluidObject<ITestFluidObject>(container2, "default");
            sharedArray2 = await dataObject2.getSharedObject<SharedStrictArray>(propertyDdsId);

            opProcessingController = new OpProcessingController();
            opProcessingController.addDeltaManagers(container1.deltaManager, container2.deltaManager);
        });
        describe("APIs", () => {
            it("Can create a SharedStrictArray", async () => {
                expect(sharedArray1).to.not.be.equal(undefined);
            });

            it("Can push new op", async () => {

                await opProcessingController.pauseProcessing();

                let appendPromise = sharedArray1.append([{ test: "sample" }]);

                await opProcessingController.process(container1.deltaManager, container2.deltaManager);

                return appendPromise.then(() => {
                    expect(sharedArray1.get().length).to.equal(1);
                    expect(sharedArray2.get().length).to.equal(1);

                    expect(sharedArray1.get()[0]).to.deep.equal({ test: "sample" });
                    expect(sharedArray2.get()[0]).to.deep.equal({ test: "sample" });
                });


            });

            it("Should emit event on successfully push", async () => {
                await opProcessingController.pauseProcessing();
                const appendPromise = sharedArray1.append([{ test: "sample" }]);

                let eventEmitted = false;
                sharedArray1.once(SharedStrictArrayEventType.Added, () => {
                    eventEmitted = true;
                })

                await opProcessingController.process(container1.deltaManager, container2.deltaManager);
                expect(eventEmitted).to.equal(true);

                return appendPromise;
            });

            it("Can push multiple ops", async () => {

                await opProcessingController.pauseProcessing();

                const promise_1 = sharedArray1.append([{ test: "sample" }]);

                await opProcessingController.process(container1.deltaManager, container2.deltaManager);
                await promise_1;

                const promise_2 = sharedArray1.append([{ test: "sample2" }]);
                await opProcessingController.process(container1.deltaManager, container2.deltaManager);
                await promise_2;


                expect(sharedArray1.get().length).to.equal(2);
                expect(sharedArray2.get().length).to.equal(2);

                expect(sharedArray1.get()[0]).to.deep.equal({ test: "sample" });
                expect(sharedArray1.get()[1]).to.deep.equal({ test: "sample2" });
                expect(sharedArray2.get()[0]).to.deep.equal({ test: "sample" });
                expect(sharedArray2.get()[1]).to.deep.equal({ test: "sample2" });


                const promise_3 = sharedArray2.append([{ test: "sample3" }]);
                await opProcessingController.process(container1.deltaManager, container2.deltaManager);
                await promise_3;

                expect(sharedArray1.get().length).to.equal(3);
                expect(sharedArray2.get().length).to.equal(3);

                expect(sharedArray1.get()[2]).to.deep.equal({ test: "sample3" });
                expect(sharedArray2.get()[2]).to.deep.equal({ test: "sample3" });


            });
            it("Cannot push new op when not at head", async () => {
                await opProcessingController.pauseProcessing();

                sharedArray1.append([{ test: "sample" }]);

                await opProcessingController.process(container1.deltaManager);


                let appendPromise2 = sharedArray2.append([{ test: "conflict" }]);


                let finalPromise2 = appendPromise2.then(
                    () => {
                        throw new Error("promise should not succeed");
                    }, (error: Error) => {
                        expect(sharedArray2.get().length).to.equal(1);
                        expect(sharedArray1.get().length).to.equal(1);
                        expect(error).to.not.equal(undefined)
                        expect(error.message).to.equal("Not at head")
                    });

                await opProcessingController.process(container2.deltaManager);


                await finalPromise2;


            })
        });
    })

});

