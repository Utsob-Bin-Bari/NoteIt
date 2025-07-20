import { AxiosResponse } from 'axios';
import { Config } from '../config/Config';
import { apiClient } from '../interceptor/interceptor';

const useApi = async({
  url,
  method,
  data,
  headers = {},
  timeout = Config.timeout,
  params,  
  baseUrl = Config.baseUrl,
}: {
  url: string;
  method: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  params?: {
    title?: string;
    limit?: number;
    offset?: number;
  };
  baseUrl?: string;
}): Promise<AxiosResponse> => {
  const config: any = {
    method,
    url: `${baseUrl}${url}`,
    headers,
    timeout,
  };
  
  if (params != null) {
    config.params = params;
  }

  if (data != null) {
    config.data = data;
  }
  
  const response = await apiClient(config);
  return response;
};

export default useApi;