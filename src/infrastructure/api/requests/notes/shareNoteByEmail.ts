import { ShareNoteResponse } from "../../../../domain/types/notes";
import { shareNoteEndpoint } from "../../endpoints/NotesEndpoints";
import { ShareNoteRequest } from "../../../../domain/types/notes";
import useApi from "../../hooks/useApi";

export const shareNoteByEmail = async({noteId, requestBody, accessToken}:{noteId:string, requestBody:ShareNoteRequest, accessToken:string}) => {
    try{
        const response = await useApi({
            url: shareNoteEndpoint(noteId),
            method: 'POST',
            data: requestBody,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data as ShareNoteResponse;
    }catch(error){
        console.log(error);
        throw error;
    }
}