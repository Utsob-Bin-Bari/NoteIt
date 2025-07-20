import { GetBookmarkedNotesResponse } from "../../../../domain/types/bookmarks";
import { getBookmarkedNotesEndpoint } from "../../endpoints/BookmarkEndpoints";
import useApi from "../../hooks/useApi";

export const fetchAllBookmarkedNotes = async({accessToken}:{accessToken:string}) => {
    try{
        const response = await useApi({
            url: getBookmarkedNotesEndpoint,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data as GetBookmarkedNotesResponse;
    }catch(error){
        console.log(error);
        throw error;
    }
}