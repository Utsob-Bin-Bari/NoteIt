import { GetSharedUsersResponse } from "../../../../domain/types/notes";
import { getNoteUsersEndpoint } from "../../endpoints/NotesEndpoints";
import useApi from "../../hooks/useApi";

export const fetchAllSharedUsers = async({noteId, accessToken}:{noteId:string, accessToken:string}) => {
    try{
        const response = await useApi({
            url: getNoteUsersEndpoint(noteId),
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data as GetSharedUsersResponse;
    }catch(error){
        console.log(error);
        throw error;
    }
}