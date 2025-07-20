import { getMeEndpoint } from "../../endpoints/UserEndpoints";
import useApi from "../../hooks/useApi";
import { GetMeResponse } from "../../../../domain/types/user";

export const getUserData = async({accessToken}:{accessToken:string}) => {
    try{
        const response = await useApi({
            url: getMeEndpoint,
            method: 'GET',  
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data as GetMeResponse;
    }catch(error){
        console.log(error);
        throw error;
    }
}