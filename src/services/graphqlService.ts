import type { GraphQLRequest, GraphQLResponse } from '@/types/api';

export class GraphQLService {
  private endpoint: string;

  constructor(endpoint: string = '/api/graphql') {
    this.endpoint = endpoint;
  }

  public setEndpoint(url: string): void {
    this.endpoint = url;
  }

  /**
   * 13. Eksekusi GraphQL Query / Mutation
   * POST /api/graphql
   */
  public async execute<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse<T>> {
    const payload: GraphQLRequest = {
      query,
      variables,
    };

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed with status: ${response.status}`);
    }

    return (await response.json()) as GraphQLResponse<T>;
  }
}

const serverUrl = (import.meta.env.SUWAYOMI_SERVER_URL ?? '').replace(/\/+$/, '');
export const graphqlService = new GraphQLService(`${serverUrl}/api/graphql`);
