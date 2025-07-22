import { GetSharedNotesResponse } from "../../../../domain/types/user";
import { getAllSharedNotesWithMeEndpoint } from "../../endpoints/UserEndpoints";
import useApi from "../../hooks/useApi";

export const getUserSharedNotes = async({accessToken}:{accessToken:string}) => {
    try{
        const response = await useApi({
            url: getAllSharedNotesWithMeEndpoint,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data as GetSharedNotesResponse;
    }catch(error){
        throw error;
    }
}