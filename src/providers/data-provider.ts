import { 
  DataProvider,
  GetListParams,
  GetOneParams,
  CreateParams,
  UpdateParams,
  DeleteOneParams,
  GetManyParams,
  CreateManyParams,
  UpdateManyParams,
  DeleteManyParams,
  CustomParams,
  GetListResponse,
  GetOneResponse,
  CreateResponse,
  UpdateResponse,
  DeleteOneResponse,
  GetManyResponse,
  CreateManyResponse,
  UpdateManyResponse,
  DeleteManyResponse,
  CustomResponse,
  BaseRecord,
  BaseKey
} from "@refinedev/core";
import { AxiosInstance } from "axios";
import { stringify } from "query-string";
import { ILevel, IStep } from "../interfaces";

// Set this to true to use mock data instead of real API calls
// Make sure to set this to false when connecting to the real API
const USE_MOCK_DATA = false;

// Mock data for development
const MOCK_LEVELS: ILevel[] = [
  {
    _id: "1",
    name: "Beginner",
    description: "Basic music concepts for beginners",
    index: 1,
    steps: [
      {
        _id: "101",
        levelId: "1",
        type: "Exercise",
        index: 1,
        name: "Reading Notes",
        description: "Learn to read basic music notation",
      },
      {
        _id: "102",
        levelId: "1",
        type: "Song",
        index: 2,
        name: "Twinkle Twinkle Little Star",
        description: "Simple song for beginners",
        scoreId: "1001",
      },
    ],
  },
  {
    _id: "2",
    name: "Intermediate",
    description: "Intermediate music concepts",
    index: 2,
    steps: [
      {
        _id: "201",
        levelId: "2",
        type: "Exercise",
        index: 1,
        name: "Scales Practice",
        description: "Practice major and minor scales",
      },
      {
        _id: "202",
        levelId: "2",
        type: "Song",
        index: 2,
        name: "Fur Elise",
        description: "Famous Beethoven piece",
        scoreId: "2001",
      },
    ],
  },
];

export const generateDataProvider = (
  apiUrl: string,
  httpClient: AxiosInstance
): DataProvider => {
  // Mock data provider for development
  if (USE_MOCK_DATA) {
    return {
      getList: async <TData extends BaseRecord = BaseRecord>({ resource }: GetListParams): Promise<GetListResponse<TData>> => {
        if (resource === "levels") {
          return {
            data: MOCK_LEVELS as unknown as TData[],
            total: MOCK_LEVELS.length,
          };
        }
        
        // Handle steps within a level
        if (resource.startsWith("levels/") && resource.includes("/steps")) {
          const levelId = resource.split("/")[1];
          const level = MOCK_LEVELS.find(l => l._id === levelId);
          return {
            data: (level?.steps || []) as unknown as TData[],
            total: level?.steps.length || 0,
          };
        }
        
        return {
          data: [] as TData[],
          total: 0,
        };
      },

      getOne: async <TData extends BaseRecord = BaseRecord>({ resource, id }: GetOneParams): Promise<GetOneResponse<TData>> => {
        if (resource === "levels") {
          const level = MOCK_LEVELS.find(l => l._id === id);
          return {
            data: level as unknown as TData,
          };
        }
        
        // Handle steps
        if (resource === "steps") {
          const step = MOCK_LEVELS.flatMap(l => l.steps).find(s => s._id === id);
          return {
            data: step as unknown as TData,
          };
        }
        
        return {
          data: null as unknown as TData,
        };
      },

      create: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, variables }: CreateParams<TVariables>): Promise<CreateResponse<TData>> => {
        if (resource === "levels") {
          const typedVariables = variables as unknown as {
            name: string;
            description: string;
            index: number;
          };
          
          const newLevel: ILevel = {
            _id: Date.now().toString(),
            name: typedVariables.name,
            description: typedVariables.description,
            index: typedVariables.index || MOCK_LEVELS.length + 1,
            steps: [],
          };
          MOCK_LEVELS.push(newLevel);
          return {
            data: newLevel as unknown as TData,
          };
        }
        
        // Handle steps
        if (resource.startsWith("levels/") && resource.includes("/steps")) {
          const levelId = resource.split("/")[1];
          const level = MOCK_LEVELS.find(l => l._id === levelId);
          
          if (level) {
            const typedVariables = variables as unknown as {
              type: string;
              index: number;
              name: string;
              description: string;
              scoreId?: string;
            };
            
            const newStep: IStep = {
              _id: Date.now().toString(),
              levelId: levelId,
              type: typedVariables.type as "Song" | "Exercise",
              index: typedVariables.index || level.steps.length + 1,
              name: typedVariables.name,
              description: typedVariables.description,
              scoreId: typedVariables.scoreId,
            };
            level.steps.push(newStep);
            return {
              data: newStep as unknown as TData,
            };
          }
        }
        
        return {
          data: variables as unknown as TData,
        };
      },

      update: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, id, variables }: UpdateParams<TVariables>): Promise<UpdateResponse<TData>> => {
        if (resource === "levels") {
          const level = MOCK_LEVELS.find(l => l._id === id);
          if (level) {
            Object.assign(level, variables);
            return {
              data: level as unknown as TData,
            };
          }
        }
        
        // Handle steps
        if (resource === "steps") {
          for (const level of MOCK_LEVELS) {
            const stepIndex = level.steps.findIndex(s => s._id === id);
            if (stepIndex !== -1) {
              level.steps[stepIndex] = { ...level.steps[stepIndex], ...variables };
              return {
                data: level.steps[stepIndex] as unknown as TData,
              };
            }
          }
        }
        
        return {
          data: variables as unknown as TData,
        };
      },

      deleteOne: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, id }: DeleteOneParams<TVariables>): Promise<DeleteOneResponse<TData>> => {
        if (resource === "levels") {
          const index = MOCK_LEVELS.findIndex(l => l._id === id);
          if (index !== -1) {
            const deleted = MOCK_LEVELS.splice(index, 1)[0];
            return {
              data: deleted as unknown as TData,
            };
          }
        }
        
        // Handle steps
        if (resource === "steps") {
          for (const level of MOCK_LEVELS) {
            const stepIndex = level.steps.findIndex(s => s._id === id);
            if (stepIndex !== -1) {
              const deleted = level.steps.splice(stepIndex, 1)[0];
              return {
                data: deleted as unknown as TData,
              };
            }
          }
        }
        
        return {
          data: null as unknown as TData,
        };
      },

      getMany: async <TData extends BaseRecord = BaseRecord>({ resource, ids }: GetManyParams): Promise<GetManyResponse<TData>> => {
        if (resource === "levels") {
          const levels = MOCK_LEVELS.filter(l => ids.includes(l._id));
          return {
            data: levels as unknown as TData[],
          };
        }
        
        // Handle steps
        if (resource === "steps") {
          const steps = MOCK_LEVELS.flatMap(l => l.steps).filter(s => ids.includes(s._id));
          return {
            data: steps as unknown as TData[],
          };
        }
        
        return {
          data: [] as unknown as TData[],
        };
      },

      createMany: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, variables }: CreateManyParams<TVariables>): Promise<CreateManyResponse<TData>> => {
        return {
          data: variables as unknown as TData[],
        };
      },

      updateMany: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, ids, variables }: UpdateManyParams<TVariables>): Promise<UpdateManyResponse<TData>> => {
        return {
          data: ids as unknown as TData[],
        };
      },

      deleteMany: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, ids }: DeleteManyParams<TVariables>): Promise<DeleteManyResponse<TData>> => {
        return {
          data: ids as unknown as TData[],
        };
      },

      custom: async <TData extends BaseRecord = BaseRecord, TQuery = unknown, TPayload = unknown>({ url, method, filters, sorters, payload, query }: CustomParams<TQuery, TPayload>): Promise<CustomResponse<TData>> => {
        return {
          data: {} as unknown as TData,
        };
      },

      getApiUrl: () => apiUrl,
    };
  }
  
  // Real API data provider
  return {
    getList: async <TData extends BaseRecord = BaseRecord>({ resource, pagination, filters, sorters }: GetListParams): Promise<GetListResponse<TData>> => {
      const url = `${apiUrl}/${resource}`;

      const { data } = await httpClient.get(url);

      return {
        data: data as TData[],
        total: data.length,
      };
    },

    getOne: async <TData extends BaseRecord = BaseRecord>({ resource, id }: GetOneParams): Promise<GetOneResponse<TData>> => {
      const url = `${apiUrl}/${resource}/${id}`;

      const { data } = await httpClient.get(url);

      return {
        data: data as TData,
      };
    },

    create: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, variables }: CreateParams<TVariables>): Promise<CreateResponse<TData>> => {
      const url = `${apiUrl}/${resource}`;

      const { data } = await httpClient.post(url, variables);

      return {
        data: data as TData,
      };
    },

    update: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, id, variables }: UpdateParams<TVariables>): Promise<UpdateResponse<TData>> => {
      const url = `${apiUrl}/${resource}/${id}`;

      const { data } = await httpClient.put(url, variables);

      return {
        data: data as TData,
      };
    },

    deleteOne: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, id }: DeleteOneParams<TVariables>): Promise<DeleteOneResponse<TData>> => {
      const url = `${apiUrl}/${resource}/${id}`;

      const { data } = await httpClient.delete(url);

      return {
        data: data as TData,
      };
    },

    getMany: async <TData extends BaseRecord = BaseRecord>({ resource, ids }: GetManyParams): Promise<GetManyResponse<TData>> => {
      const queryString = stringify({ ids: ids });
      const url = `${apiUrl}/${resource}?${queryString}`;

      const { data } = await httpClient.get(url);

      return {
        data: data as TData[],
      };
    },

    createMany: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, variables }: CreateManyParams<TVariables>): Promise<CreateManyResponse<TData>> => {
      const url = `${apiUrl}/${resource}/bulk`;

      const { data } = await httpClient.post(url, variables);

      return {
        data: data as TData[],
      };
    },

    updateMany: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, ids, variables }: UpdateManyParams<TVariables>): Promise<UpdateManyResponse<TData>> => {
      const queryString = stringify({ ids: ids });
      const url = `${apiUrl}/${resource}/bulk?${queryString}`;

      const { data } = await httpClient.patch(url, variables);

      return {
        data: data as TData[],
      };
    },

    deleteMany: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, ids }: DeleteManyParams<TVariables>): Promise<DeleteManyResponse<TData>> => {
      const queryString = stringify({ ids: ids });
      const url = `${apiUrl}/${resource}/bulk?${queryString}`;

      const { data } = await httpClient.delete(url);

      return {
        data: data as TData[],
      };
    },

    custom: async <TData extends BaseRecord = BaseRecord, TQuery = unknown, TPayload = unknown>({ url, method, filters, sorters, payload, query }: CustomParams<TQuery, TPayload>): Promise<CustomResponse<TData>> => {
      let requestUrl = `${apiUrl}/${url}`;

      if (query) {
        const queryString = stringify(query);
        requestUrl = `${requestUrl}?${queryString}`;
      }

      if (filters) {
        const filterQuery = stringify(filters);
        requestUrl = `${requestUrl}&${filterQuery}`;
      }

      if (sorters) {
        const sortQuery = stringify(sorters);
        requestUrl = `${requestUrl}&${sortQuery}`;
      }

      let axiosResponse;
      switch (method) {
        case "put":
        case "post":
        case "patch":
          axiosResponse = await httpClient[method](requestUrl, payload);
          break;
        case "delete":
          axiosResponse = await httpClient.delete(requestUrl, { data: payload });
          break;
        default:
          axiosResponse = await httpClient.get(requestUrl);
          break;
      }

      const { data } = axiosResponse;

      return {
        data: data as TData,
      };
    },

    getApiUrl: () => apiUrl,
  };
};
