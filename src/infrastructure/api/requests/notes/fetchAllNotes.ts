import { GetAllNotesResponse } from "../../../../domain/types/notes";
import { getAllNotesEndpoint } from "../../endpoints/NotesEndpoints";
import useApi from "../../hooks/useApi";

export const fetchAllNotes = async({accessToken}:{accessToken:string}) => {
    try{
        const response = await useApi({
            url: getAllNotesEndpoint,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },  
        });
        return response.data as GetAllNotesResponse;
    }catch(error){
        console.log(error);
        throw error;
    }
}