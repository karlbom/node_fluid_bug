
import express from 'express';
import http from 'http';

import { BackendType, FluidContainer, getContainer } from './fluid/init';
import { SharedMap } from "@fluidframework/map";

const app = express();
const server = http.createServer(app);


interface IActiveDocument {

    container: FluidContainer
}
const activeDocuments = new Map<string, IActiveDocument>();

const schema = {
    name: 'demo-container',
    initialObjects: { myMap: SharedMap }
};


app.get('/list', (req, res) => {    
    res.send(JSON.stringify(Array.from(activeDocuments.keys())));
});

app.get('/create/:documentId', async (req, res) => {
    const { documentId } = req.params;
    try {
        if (documentId == undefined) {
            throw Error("no documentId provided");
        }
        if(activeDocuments.has(documentId)){
            throw Error("could not create document");
        }
        
        const container = await getContainer(documentId, schema, true, BackendType.TINYLICIOUS);
        activeDocuments.set(documentId,{container});
        res.send(JSON.stringify({ "message": "container created", documentId }));

    } catch (error) {
        
        res.send((error as Error).message);
    }

});


app.get('/init/:documentId', (req, res) => {
    res.send('<h1>Hello world</h1>');
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});