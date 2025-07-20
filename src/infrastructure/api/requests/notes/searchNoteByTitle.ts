import { SearchNotesResponse } from "../../../../domain/types/notes";
import { searchNoteEndpoint } from "../../endpoints/NotesEndpoints";
import useApi from "../../hooks/useApi";

export const searchNoteByTitle = async({title, accessToken}:{title:string, accessToken:string}) => {
    try{
        const response = await useApi({
            url: searchNoteEndpoint,
            method: 'GET',
            params: {
                title:title,
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data as SearchNotesResponse;
    }catch(error){
        console.log(error);
        throw error;
    }
}