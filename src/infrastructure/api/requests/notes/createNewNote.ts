import { CreateNoteRequest, CreateNoteResponse } from "../../../../domain/types/notes";
import { createNoteEndpoint } from "../../endpoints/NotesEndpoints";
import useApi from "../../hooks/useApi";

export const createNewNote = async({requestBody, accessToken}:{requestBody:CreateNoteRequest, accessToken:string}) => {
    try{
        const response = await useApi({
            url: createNoteEndpoint,
            method: 'POST',
            data: requestBody,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data as CreateNoteResponse;
    }catch(error){
        throw error;
    }
}