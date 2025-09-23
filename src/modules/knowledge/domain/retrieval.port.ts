export type RetrievedDoc = {
    id: string;
    url: string;
    content: string;
  };
  
  export interface RetrieverPort {
    search(query: string, k?: number): Promise<RetrievedDoc[]>;
  }
  