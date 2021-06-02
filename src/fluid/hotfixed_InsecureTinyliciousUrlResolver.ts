import {  InsecureTinyliciousUrlResolver } from "@fluidframework/tinylicious-driver";
import { IRequest } from "@fluidframework/core-interfaces";
import {
    IFluidResolvedUrl,
    IResolvedUrl,
} from "@fluidframework/driver-definitions";

export const defaultTinyliciousPort = 7070;
export const defaultTinyliciousEndpoint = "http://localhost";

interface HackedAccess {
    tinyliciousPort: number,
    auth(documentId: string) :any,
}

export class HotfixedInsecureTinyliciousUrlResolver extends InsecureTinyliciousUrlResolver {
    private readonly fluidProtocolEndpoint: string;
    public constructor(
        tinyliciousPort = defaultTinyliciousPort,
        private readonly tinyliciousEndpoint = defaultTinyliciousEndpoint,
        ) {
            super(tinyliciousPort)
            this.fluidProtocolEndpoint = this.tinyliciousEndpoint.replace(/(^\w+:|^)\/\//, "fluid://");
         }

         public async resolve(request: IRequest): Promise<IResolvedUrl> {
            const url = request.url.replace(`${this.tinyliciousEndpoint}:${(this as any as HackedAccess).tinyliciousPort}/`, "");
            const documentId = url.split("/")[0];
            const encodedDocId = encodeURIComponent(documentId);
            const documentRelativePath = url.slice(documentId.length);
    
            // eslint-disable-next-line max-len
            const documentUrl = `${this.fluidProtocolEndpoint}:${(this as any as HackedAccess).tinyliciousPort}/tinylicious/${encodedDocId}${documentRelativePath}`;
            const deltaStorageUrl =
                `${this.tinyliciousEndpoint}:${(this as any as HackedAccess).tinyliciousPort}/deltas/tinylicious/${encodedDocId}`;
            const storageUrl = `${this.tinyliciousEndpoint}:${(this as any as HackedAccess).tinyliciousPort}/repos/tinylicious`;
    
            const response: IFluidResolvedUrl = {
                endpoints: {
                    deltaStorageUrl,
                    ordererUrl: `${this.tinyliciousEndpoint}:${(this as any as HackedAccess).tinyliciousPort}`,
                    storageUrl,
                },
                id: documentId,
                tokens: { jwt: (this as any as HackedAccess).auth(documentId) },
                type: "fluid",
                url: documentUrl,
            };
            return response;
        }

        public async getAbsoluteUrl(resolvedUrl: IFluidResolvedUrl, relativeUrl: string): Promise<string> {
            const documentId = decodeURIComponent(
                resolvedUrl.url.replace(`${this.fluidProtocolEndpoint}:${(this as any as HackedAccess).tinyliciousPort}/tinylicious/`, ""),
            );
            /*
             * The detached container flow will ultimately call getAbsoluteUrl() with the resolved.url produced by
             * resolve().  The container expects getAbsoluteUrl's return value to be a URL that can then be roundtripped
             * back through resolve() again, and get the same result again.  So we'll return a "URL" with the same format
             * described above.
             */
            return `${documentId}/${relativeUrl}`;
        }
}