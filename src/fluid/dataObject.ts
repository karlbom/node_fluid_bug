import {DataObject, DataObjectFactory} from "@fluidframework/aqueduct";
import {ConsensusQueue, IOrderedCollection} from "@fluidframework/ordered-collection"
import { IEvent } from "@fluidframework/common-definitions";
import { IFluidHandle } from '@fluidframework/core-interfaces';


export class CommandQueue extends DataObject{
    private commandQueue: ConsensusQueue | undefined;

    public static get Name() { return "queue"; }
    public static readonly factory =
    new DataObjectFactory<CommandQueue, object,undefined,IEvent>(
        CommandQueue.Name,
        CommandQueue,
        [
            ConsensusQueue.getFactory()
        ],
        {},
    );
    public static getFactory() { return this.factory; }

    public add(value: number){
        if(this.commandQueue){
            this.commandQueue.add(value);
        }
    }
    public list(){
        return ((this.commandQueue as any).data as IOrderedCollection).asArray()
    }


    protected async initializingFirstTime(){
        const queue = ConsensusQueue.create(this.runtime);
        this.root.set("queue", queue.handle);
    }

    protected async hasInitialized() {
        // Create local references to the SharedMaps.
        // Otherwise, they need to be called async which is inconvenient.
        this.commandQueue = await this.root.get<IFluidHandle<ConsensusQueue>>('queue')!.get();
    
        this.commandQueue.on("add", value => {console.log(`Value ${value} added to queue`)});
        this.commandQueue.on("acquire", value => {console.log(`Value ${value} acquired from queue`)});
        this.commandQueue.on("complete", value => {console.log(`Value ${value} complete from queue`)});
        this.commandQueue.on("release", value => {console.log(`Value ${value} release from queue`)});
      }

}

