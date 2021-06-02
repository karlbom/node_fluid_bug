
import express from 'express';
import http from 'http';

import { getDefaultObjectFromContainer } from "@fluidframework/aqueduct";
import { LoggingError } from "@fluidframework/telemetry-utils";

import { BackendType, getContainer } from './fluid/init';

import {CommandQueue} from "./fluid/dataObject"
import { CommandQueueContainerRuntimeFactory} from "./fluid/containerCode";
import { ContainerSchema } from "@fluid-experimental/fluid-static";
import { Container } from "@fluidframework/container-loader";

const app = express();
const server = http.createServer(app);

interface IActiveDocument {
    container: Container
    queue: CommandQueue
}
const activeDocuments = new Map<string, IActiveDocument>();

const schema: ContainerSchema = {
    name: 'demo-container',
    initialObjects: {}
};

async function try_get_container(documentId: string){
    const doc = activeDocuments.get(documentId);
    if(doc) return doc
    try {
        const container = await getContainer(documentId, CommandQueueContainerRuntimeFactory, false, BackendType.TINYLICIOUS);
        const queue = await getDefaultObjectFromContainer<CommandQueue>(container);
        activeDocuments.set(documentId, { container,queue });
        return { container,queue };
    } catch (error) {
        return undefined;
    }
    
       
}

app.get('/list', (req, res) => {
    res.send(JSON.stringify(Array.from(activeDocuments.keys())));
});
app.get('/show/:documentId',async (req, res) => {
    const { documentId } = req.params;
    const doc = (await try_get_container(documentId))!;
    const queue = await getDefaultObjectFromContainer<CommandQueue>(doc.container)
    
    const result = queue.list();

    res.send(JSON.stringify(result));
    
});

app.get('/add/:documentId',async (req, res) => {
    const { documentId } = req.params;
    const doc = (await try_get_container(documentId))!;
    const queue = doc.queue;
    const val = Math.floor(Math.random() * 100)
    queue.add(val);


    res.send(JSON.stringify({message: `Addded value ${val} added to queue`}));
    
});

app.get('/create/:documentId', async (req, res) => {
    const { documentId } = req.params;
    try {
        if (documentId == undefined) {
            throw Error("no documentId provided");
        }
        if (activeDocuments.has(documentId)) {
            throw Error("could not create document");
        }

        const container = await getContainer(documentId, CommandQueueContainerRuntimeFactory, true, BackendType.TINYLICIOUS);
        const queue = await getDefaultObjectFromContainer<CommandQueue>(container);

        activeDocuments.set(documentId, { container,queue });
        res.send(JSON.stringify({ "message": "container created", documentId }));

    } catch (error) {
        const e = error as LoggingError;       

        res.send(`${e.name}: ${e.message}, ${JSON.stringify(e.getTelemetryProperties())}`);
    }
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});